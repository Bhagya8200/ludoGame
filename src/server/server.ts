import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import type {
  GameState,
  Player,
  Token,
  PowerUp,
  MoveResult,
  GameSettings,
} from "../types/game";
import {
  rollDice,
  createPlayer,
  canTokenMove,
  calculateNewPosition,
  getTokensAtPosition,
  canKillToken,
  calculatePoints,
  checkWinCondition,
  generatePowerUp,
  isTrapPosition,
  COLORS,
  TRAP_POSITIONS,
  isPositionSafe,
} from "../utils/boardUtils";
import { connectToDatabase } from "../database/connection";
import { GameService } from "../services/gameService";
import { GameRoom } from "../models/GameRoom";

function hasValidMoves(
  player: Player,
  diceValue: number,
  game: GameState
): boolean {
  return player.tokens.some((token) => canTokenMove(token, diceValue, game));
}

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectToDatabase().catch(console.error);

// Clean up old rooms periodically
setInterval(() => {
  GameService.cleanupOldRooms().catch(console.error);
}, 3600000); // Every hour

const playerSockets = new Map<string, string>(); // playerId -> roomId
const moveTimers = new Map<string, NodeJS.Timeout>();

// Default game settings
const defaultSettings: GameSettings = {
  timedMoves: true,
  moveTimeLimit: 15,
  powerUpsEnabled: true,
  trapZonesEnabled: true,
  pointsSystemEnabled: true,
};

function updateTokenEffects(player: Player) {
  player.tokens.forEach((token) => {
    if (token.hasShield && token.shieldTurns > 0) {
      token.shieldTurns--;
      if (token.shieldTurns <= 0) {
        token.hasShield = false;
      }
    }

    if (token.isFrozen && token.frozenTurns > 0) {
      token.frozenTurns--;
      if (token.frozenTurns <= 0) {
        token.isFrozen = false;
      }
    }
  });
}

function startMoveTimer(roomId: string, gameState: GameState) {
  // Clear existing timer
  clearMoveTimer(roomId);

  if (!gameState.gameStarted || gameState.gameEnded) return;

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  currentPlayer.moveTimeLeft = defaultSettings.moveTimeLimit;

  const timer = setInterval(async () => {
    currentPlayer.moveTimeLeft--;

    if (currentPlayer.moveTimeLeft <= 3 && currentPlayer.moveTimeLeft > 0) {
      io.to(roomId).emit("timeWarning", currentPlayer.moveTimeLeft);
    }

    if (currentPlayer.moveTimeLeft <= 0) {
      clearInterval(timer);
      moveTimers.delete(roomId);

      try {
        // Skip turn in database
        const room = await GameService.nextTurn(roomId);
        if (room) {
          const updatedGameState = GameService.convertToGameState(room);
          io.to(roomId).emit("turnSkipped", currentPlayer.id);
          io.to(roomId).emit("gameStateUpdate", updatedGameState);

          // Start timer for next player
          startMoveTimer(roomId, updatedGameState);
        }
      } catch (error) {
        console.error("Error skipping turn:", error);
      }
    }
  }, 1000);

  moveTimers.set(roomId, timer);
}

function clearMoveTimer(roomId: string) {
  const timer = moveTimers.get(roomId);
  if (timer) {
    clearTimeout(timer);
    moveTimers.delete(roomId);
  }
}

async function nextTurn(roomId: string): Promise<void> {
  try {
    const room = await GameService.nextTurn(roomId);
    if (room) {
      const gameState = GameService.convertToGameState(room);
      startMoveTimer(roomId, gameState);
      io.to(roomId).emit("gameStateUpdate", gameState);
    }
  } catch (error) {
    console.error("Error in nextTurn:", error);
  }
}

// Enhanced moveToken function with full game logic
async function moveTokenWithLogic(
  roomId: string,
  playerId: string,
  tokenId: string
): Promise<MoveResult | null> {
  try {
    // First get the current room state
    const room = await GameService.getRoomById(roomId);
    if (!room) return null;

    const gameState = GameService.convertToGameState(room);
    const player = gameState.players.find((p) => p.id === playerId);
    if (!player) return null;

    const token = player.tokens.find((t) => t.id === tokenId);
    if (!token) return null;

    if (!canTokenMove(token, gameState.diceValue, gameState)) {
      return { success: false, pointsEarned: 0, message: "Token cannot move" };
    }

    const oldPosition = token.position;
    const newPosition = calculateNewPosition(
      token,
      gameState.diceValue,
      player.color
    );

    if (newPosition >= 56 && !token.isInHomeRun) {
      token.isInHomeRun = true;
    }

    token.position = newPosition;

    if (token.isInHomeRun && newPosition >= 62) {
      token.isFinished = true;
      player.points += calculatePoints("finish_token");

      if (checkWinCondition(player)) {
        gameState.gameEnded = true;
        gameState.winner = player.id;
      }
    }

    let result: MoveResult = { success: true, pointsEarned: 0 };

    if (!token.isInHomeRun) {
      const tokensAtPosition = getTokensAtPosition(
        gameState.players,
        newPosition
      );
      const otherTokens = tokensAtPosition.filter(
        (t) => t.playerId !== playerId
      );

      if (otherTokens.length > 0 && !isPositionSafe(newPosition)) {
        for (const otherToken of otherTokens) {
          if (canKillToken(token, otherToken)) {
            otherToken.position = -1;
            otherToken.isInHomeRun = false;
            otherToken.isFinished = false;

            // FIX: Increment kill counter for the attacking player
            player.kills += 1;
            player.points += calculatePoints("kill");

            const killedPlayer = gameState.players.find(
              (p) => p.id === otherToken.playerId
            );
            if (killedPlayer) {
              killedPlayer.points += calculatePoints("get_killed");
            }

            result.killedToken = otherToken;
            result.message = `Token killed!`;

            // Record the move with kill information
            await GameService.recordMove(roomId, {
              playerId,
              tokenId,
              fromPosition: oldPosition,
              toPosition: newPosition,
              diceValue: gameState.diceValue,
              moveType: "kill",
              pointsEarned: calculatePoints("kill"),
              killedTokenId: otherToken.id,
            });
          }
        }
      }

      // Power-up logic
      const powerUp = gameState.powerUps.find(
        (p) => p.position === newPosition && p.isActive
      );
      if (powerUp) {
        powerUp.isActive = false;
        result.powerUpActivated = powerUp;

        switch (powerUp.type) {
          case "shield":
            token.hasShield = true;
            token.shieldTurns = 2;
            result.message = `Shield activated! Token protected for 2 turns.`;
            break;
          case "speed":
            const speedBoost = 2;
            const speedNewPosition = calculateNewPosition(
              token,
              speedBoost,
              player.color
            );
            if (!token.isInHomeRun || speedNewPosition <= 62) {
              token.position = speedNewPosition;
              if (speedNewPosition >= 56 && !token.isInHomeRun) {
                token.isInHomeRun = true;
              }
              result.message = `Speed boost! Moved ${speedBoost} extra spaces.`;
            }
            break;
          case "teleport":
            result.message = `Teleport power-up collected! Use it to move to any position.`;
            break;
          case "swap":
            result.message = `Swap power-up collected! Use it to swap positions with another token.`;
            break;
        }

        // Spawn new power-up after delay
        setTimeout(async () => {
          try {
            const currentRoom = await GameService.getRoomById(roomId);
            if (currentRoom) {
              const newPowerUp = generatePowerUp();
              await GameService.addPowerUp(roomId, newPowerUp);
              io.to(roomId).emit("powerUpSpawned", newPowerUp);
            }
          } catch (error) {
            console.error("Error spawning new power-up:", error);
          }
        }, 5000);
      }

      // Trap logic
      if (isTrapPosition(newPosition) && !token.hasShield) {
        const trapEffect = Math.random() < 0.5 ? "back" : "freeze";
        if (trapEffect === "back") {
          const backSteps = 3;
          let trapNewPosition = token.position - backSteps;
          if (trapNewPosition < 0) {
            trapNewPosition = 52 + trapNewPosition;
          }
          token.position = trapNewPosition;
          result.message = `Trap activated! Moved back ${backSteps} steps.`;
        } else {
          token.isFrozen = true;
          token.frozenTurns = 1;
          result.message = `Trap activated! Token frozen for 1 turn.`;
        }
      }

      if (isPositionSafe(newPosition)) {
        result.message = result.message || `Token is now on a safe position!`;
      }
    }

    // Check for completing a round
    if (oldPosition > newPosition && !token.isInHomeRun && oldPosition < 52) {
      player.points += calculatePoints("complete_round");
      result.message =
        result.message || `Completed a round! Bonus points awarded.`;
    }

    result.pointsEarned = player.points;

    // Update the game state in database
    const updatedRoom = await GameService.updateGameState(roomId, gameState);
    if (!updatedRoom) return null;

    // Handle turn logic
    if (gameState.diceValue !== 6) {
      await nextTurn(roomId);
    } else {
      await GameService.setCanRollDice(roomId, true);
      clearMoveTimer(roomId);
      const currentGameState = GameService.convertToGameState(updatedRoom);
      startMoveTimer(roomId, currentGameState);
    }

    return result;
  } catch (error) {
    console.error("Error in moveTokenWithLogic:", error);
    return null;
  }
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", async (roomId: string, playerName: string) => {
    try {
      let room = await GameService.getRoomById(roomId);
      if (!room) {
        room = await GameService.createOrGetRoom(roomId);
        if (!room) {
          socket.emit("error", "Failed to create room");
          return;
        }
      }

      // IMPORTANT: Check for reconnection FIRST before checking if game started
      const existingPlayer = room.players.find((p) => p.name === playerName);

      if (existingPlayer) {
        // Player is reconnecting - update their socket ID and player ID
        existingPlayer.id = socket.id; // Update player ID to current socket
        existingPlayer.socketId = socket.id;
        existingPlayer.lastSeen = new Date();

        // Update token playerIds to match new socket ID
        existingPlayer.tokens.forEach((token) => {
          token.playerId = socket.id;
        });

        await room.save();

        playerSockets.set(socket.id, roomId);
        socket.join(roomId);

        const gameState = GameService.convertToGameState(room);

        // Send reconnection success with current game state
        socket.emit("reconnected", existingPlayer);
        socket.emit("gameStateUpdate", gameState);

        // If game is in progress, restart the move timer
        if (room.gameStarted && !room.gameEnded) {
          startMoveTimer(roomId, gameState);
        }

        // Notify other players about reconnection
        socket.to(roomId).emit("playerReconnected", existingPlayer);

        console.log(`Player ${playerName} reconnected to room ${roomId}`);
        return;
      }

      // New player joining - only now check if game already started
      if (room.gameStarted && !room.gameEnded) {
        socket.emit(
          "error",
          "Game already started and you are not a previous player"
        );
        return;
      }

      room = await GameService.addPlayerToRoom(
        roomId,
        socket.id,
        playerName,
        socket.id
      );
      if (!room) {
        socket.emit("error", "Failed to join room");
        return;
      }

      playerSockets.set(socket.id, roomId);
      socket.join(roomId);

      const gameState = GameService.convertToGameState(room);
      const newPlayer = gameState.players.find((p) => p.id === socket.id);

      io.to(roomId).emit("playerJoined", newPlayer);
      io.to(roomId).emit("gameStateUpdate", gameState);
    } catch (error: any) {
      socket.emit("error", error.message);
    }
  });

  socket.on("playerReady", async (roomId: string) => {
    try {
      const room = await GameService.updatePlayerReady(roomId, socket.id);
      if (!room) return;

      const gameState = GameService.convertToGameState(room);

      if (room.gameStarted) {
        startMoveTimer(roomId, gameState);
        io.to(roomId).emit("gameStarted");
      }

      io.to(roomId).emit("gameStateUpdate", gameState);
    } catch (error) {
      console.error("Error updating player ready:", error);
    }
  });

  socket.on("rollDice", async (roomId: string) => {
    try {
      const result = await GameService.rollDice(roomId, socket.id);
      if (!result) return;

      const { room, diceValue } = result;
      const gameState = GameService.convertToGameState(room);
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];

      io.to(roomId).emit(
        "diceRolled",
        diceValue,
        currentPlayer.id,
        currentPlayer
      );

      // Check if player has any valid moves
      if (!hasValidMoves(currentPlayer, diceValue, gameState)) {
        // No valid moves available, auto-skip after 2 seconds
        setTimeout(async () => {
          try {
            const currentRoom = await GameService.getRoomById(roomId);
            if (currentRoom && !currentRoom.canRollDice) {
              await nextTurn(roomId);
              io.to(roomId).emit("turnSkipped", currentPlayer.id);
            }
          } catch (error) {
            console.error("Error auto-skipping turn:", error);
          }
        }, 2000);
      }

      io.to(roomId).emit("gameStateUpdate", gameState);
    } catch (error) {
      console.error("Error rolling dice:", error);
    }
  });

  socket.on("moveToken", async (roomId: string, tokenId: string) => {
    try {
      clearMoveTimer(roomId);

      const result = await moveTokenWithLogic(roomId, socket.id, tokenId);
      if (!result) {
        socket.emit("error", "Invalid move");
        return;
      }

      // Get updated room state
      const room = await GameService.getRoomById(roomId);
      if (!room) return;

      const gameState = GameService.convertToGameState(room);

      io.to(roomId).emit("tokenMoved", result);
      io.to(roomId).emit("gameStateUpdate", gameState);

      if (room.gameEnded) {
        const winner = gameState.players.find((p) => p.id === room.winner)!;
        io.to(roomId).emit("gameEnded", winner);
        clearMoveTimer(roomId);
      }
    } catch (error) {
      console.error("Error moving token:", error);
      socket.emit("error", "Failed to move token");
    }
  });

  socket.on("skipTurn", async (roomId: string) => {
    try {
      const room = await GameService.getRoomById(roomId);
      if (!room || room.canRollDice) return;

      const gameState = GameService.convertToGameState(room);
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];

      if (currentPlayer.id !== socket.id) return;

      // Only allow manual skip if no valid moves available
      if (!hasValidMoves(currentPlayer, gameState.diceValue, gameState)) {
        await nextTurn(roomId);
        io.to(roomId).emit("turnSkipped", currentPlayer.id);
      }
    } catch (error) {
      console.error("Error skipping turn:", error);
    }
  });

  socket.on(
    "usePowerUp",
    async (roomId: string, powerUpType: string, targetData: any) => {
      try {
        const room = await GameService.usePowerUp(
          roomId,
          socket.id,
          powerUpType,
          targetData
        );
        if (!room) return;

        const gameState = GameService.convertToGameState(room);
        io.to(roomId).emit("gameStateUpdate", gameState);
      } catch (error) {
        console.error("Error using power-up:", error);
      }
    }
  );

  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);
    const roomId = playerSockets.get(socket.id);

    if (roomId) {
      try {
        const room = await GameService.getRoomById(roomId);
        if (room) {
          const player = room.players.find((p) => p.socketId === socket.id);
          if (player) {
            // Mark player as disconnected but don't remove them
            player.lastSeen = new Date();
            await room.save();

            // Notify other players about disconnection
            socket.to(roomId).emit("playerDisconnected", player.id);

            // Only clear move timer if the disconnected player was the current player
            const gameState = GameService.convertToGameState(room);
            const currentPlayer =
              gameState.players[gameState.currentPlayerIndex];
            if (currentPlayer.id === player.id) {
              clearMoveTimer(roomId);
            }
          }
        }
      } catch (error) {
        console.error("Error handling disconnect:", error);
      }

      playerSockets.delete(socket.id);
    }
  });

  // This removes players who have been disconnected for more than 5 minutes
  setInterval(async () => {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const rooms = await GameRoom.find({
        gameStarted: false, // Only cleanup waiting rooms
        "players.lastSeen": { $lt: fiveMinutesAgo },
      });

      for (const room of rooms) {
        const activePlayers = room.players.filter(
          (p) => p.lastSeen > fiveMinutesAgo
        );

        if (activePlayers.length !== room.players.length) {
          room.players = activePlayers;
          await room.save();
        }
      }
    } catch (error) {
      console.error("Error cleaning up disconnected players:", error);
    }
  }, 60000); // Run every minute
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
