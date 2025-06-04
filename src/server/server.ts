// server.ts
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

// Game state storage
const games = new Map<string, GameState>();
const gameSettings = new Map<string, GameSettings>();
const playerSockets = new Map<string, string>(); // playerId -> socketId
const moveTimers = new Map<string, NodeJS.Timeout>();

// Default game settings
const defaultSettings: GameSettings = {
  timedMoves: true,
  moveTimeLimit: 15,
  powerUpsEnabled: true,
  trapZonesEnabled: true,
  pointsSystemEnabled: true,
};

function createNewGame(roomId: string): GameState {
  const game: GameState = {
    id: roomId,
    players: [],
    currentPlayerIndex: 0,
    diceValue: 0,
    canRollDice: false,
    gameStarted: false,
    gameEnded: false,
    winner: null,
    turnCount: 0,
    powerUps: [],
    trapZones: TRAP_POSITIONS,
    lastRollTime: Date.now(),
  };

  // Initialize power-ups
  if (defaultSettings.powerUpsEnabled) {
    for (let i = 0; i < 3; i++) {
      game.powerUps.push(generatePowerUp());
    }
  }

  return game;
}

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

function startMoveTimer(game: GameState) {
  const settings = gameSettings.get(game.id) || defaultSettings;
  if (!settings.timedMoves) return;

  const currentPlayer = game.players[game.currentPlayerIndex];
  currentPlayer.moveTimeLeft = settings.moveTimeLimit;

  const timer = setInterval(() => {
    currentPlayer.moveTimeLeft--;

    if (currentPlayer.moveTimeLeft <= 3 && currentPlayer.moveTimeLeft > 0) {
      io.to(game.id).emit("timeWarning", currentPlayer.moveTimeLeft);
    }

    if (currentPlayer.moveTimeLeft <= 0) {
      clearInterval(timer);
      moveTimers.delete(game.id);

      // Skip turn
      nextTurn(game);
      io.to(game.id).emit("turnSkipped", currentPlayer.id);
      io.to(game.id).emit("gameStateUpdate", game);
    }
  }, 1000);

  moveTimers.set(game.id, timer);
}

function clearMoveTimer(gameId: string) {
  const timer = moveTimers.get(gameId);
  if (timer) {
    clearTimeout(timer);
    moveTimers.delete(gameId);
  }
}

function nextTurn(game: GameState) {
  clearMoveTimer(game.id);

  // Update token effects for current player
  updateTokenEffects(game.players[game.currentPlayerIndex]);

  game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
  game.canRollDice = true;
  game.diceValue = 0;
  game.turnCount++;

  // Start timer for next player
  startMoveTimer(game);
}

// server.ts - Updated moveToken function with proper logic
function moveToken(
  game: GameState,
  playerId: string,
  tokenId: string
): MoveResult {
  const player = game.players.find((p) => p.id === playerId);
  if (!player)
    return { success: false, pointsEarned: 0, message: "Player not found" };

  const token = player.tokens.find((t) => t.id === tokenId);
  if (!token)
    return { success: false, pointsEarned: 0, message: "Token not found" };

  if (!canTokenMove(token, game.diceValue, game)) {
    return { success: false, pointsEarned: 0, message: "Token cannot move" };
  }

  const oldPosition = token.position;
  const newPosition = calculateNewPosition(token, game.diceValue, player.color);

  // Check if entering home run (position >= 56 means home run)
  if (newPosition >= 56 && !token.isInHomeRun) {
    token.isInHomeRun = true;
  }

  token.position = newPosition;

  // Check if finished (home run position 62 = 56 + 6, the final spot)
  if (token.isInHomeRun && newPosition >= 62) {
    token.isFinished = true;
    player.points += calculatePoints("finish_token");

    // Check win condition
    if (checkWinCondition(player)) {
      game.gameEnded = true;
      game.winner = player.id;
    }
  }

  let result: MoveResult = { success: true, pointsEarned: 0 };

  // Only check for interactions on main board (not in home run)
  if (!token.isInHomeRun) {
    // 1. CHECK FOR TOKEN KILLING FIRST
    const tokensAtPosition = getTokensAtPosition(game.players, newPosition);
    const otherTokens = tokensAtPosition.filter((t) => t.playerId !== playerId);

    if (otherTokens.length > 0 && !isPositionSafe(newPosition)) {
      // Kill other tokens at this position (if not protected)
      otherTokens.forEach((otherToken) => {
        if (canKillToken(token, otherToken)) {
          // Send token back to home
          otherToken.position = -1;
          otherToken.isInHomeRun = false;
          otherToken.isFinished = false;

          // Award points
          player.points += calculatePoints("kill");
          const killedPlayer = game.players.find(
            (p) => p.id === otherToken.playerId
          );
          if (killedPlayer) {
            killedPlayer.points += calculatePoints("get_killed");
          }

          result.killedToken = otherToken;
          result.message = `Token killed!`;
        }
      });
    }

    // 2. CHECK FOR POWER-UPS
    const powerUp = game.powerUps.find(
      (p) => p.position === newPosition && p.isActive
    );
    if (powerUp) {
      powerUp.isActive = false;
      result.powerUpActivated = powerUp;

      // Apply power-up effect
      switch (powerUp.type) {
        case "shield":
          token.hasShield = true;
          token.shieldTurns = 2;
          result.message = `Shield activated! Token protected for 2 turns.`;
          break;
        case "speed":
          // Speed boost - move additional spaces
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
          // For teleport, we'll need UI interaction, so just mark it
          result.message = `Teleport power-up collected! Use it to move to any position.`;
          break;
        case "swap":
          // For swap, we'll need UI interaction, so just mark it
          result.message = `Swap power-up collected! Use it to swap positions with another token.`;
          break;
      }

      // Spawn new power-up after delay
      setTimeout(() => {
        if (games.has(game.id)) {
          const newPowerUp = generatePowerUp();
          game.powerUps.push(newPowerUp);
          io.to(game.id).emit("powerUpSpawned", newPowerUp);
        }
      }, 5000);
    }

    // 3. CHECK FOR TRAP ZONES
    if (isTrapPosition(newPosition) && !token.hasShield) {
      const trapEffect = Math.random() < 0.5 ? "back" : "freeze";

      if (trapEffect === "back") {
        const backSteps = 3;
        let trapNewPosition = token.position - backSteps;

        // Don't go below 0 or into negative positions
        if (trapNewPosition < 0) {
          trapNewPosition = 52 + trapNewPosition; // Wrap around
        }

        token.position = trapNewPosition;
        result.message = `Trap activated! Moved back ${backSteps} steps.`;
      } else {
        token.isFrozen = true;
        token.frozenTurns = 1;
        result.message = `Trap activated! Token frozen for 1 turn.`;
      }
    }

    // 4. CHECK FOR SAFE POSITIONS (informational)
    if (isPositionSafe(newPosition)) {
      result.message = result.message || `Token is now on a safe position!`;
    }
  }

  // Award points for completing rounds (only on main board)
  if (oldPosition > newPosition && !token.isInHomeRun && oldPosition < 52) {
    player.points += calculatePoints("complete_round");
    result.message =
      result.message || `Completed a round! Bonus points awarded.`;
  }

  result.pointsEarned = player.points;

  // Next turn if didn't roll 6
  if (game.diceValue !== 6) {
    nextTurn(game);
  } else {
    game.canRollDice = true;
    clearMoveTimer(game.id);
    startMoveTimer(game);
  }

  return result;
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", (roomId: string, playerName: string) => {
    if (!games.has(roomId)) {
      games.set(roomId, createNewGame(roomId));
      gameSettings.set(roomId, { ...defaultSettings });
    }

    const game = games.get(roomId)!;

    if (game.players.length >= 4) {
      socket.emit("error", "Room is full");
      return;
    }

    if (game.gameStarted) {
      socket.emit("error", "Game already started");
      return;
    }

    const color = COLORS[game.players.length];
    const player = createPlayer(socket.id, playerName, color);

    game.players.push(player);
    playerSockets.set(player.id, socket.id);

    socket.join(roomId);
    io.to(roomId).emit("playerJoined", player);
    io.to(roomId).emit("gameStateUpdate", game);
  });

  socket.on("playerReady", (roomId: string) => {
    const game = games.get(roomId);
    if (!game) return;

    const player = game.players.find((p) => p.id === socket.id);
    if (!player) return;

    player.isReady = true;

    // Start game if all players ready
    if (game.players.length >= 1 && game.players.every((p) => p.isReady)) {
      game.gameStarted = true;
      game.canRollDice = true;
      startMoveTimer(game);
      io.to(roomId).emit("gameStarted");
    }

    io.to(roomId).emit("gameStateUpdate", game);
  });

  // Modified rollDice handler
  socket.on("rollDice", (roomId: string) => {
    const game = games.get(roomId);
    if (!game || !game.canRollDice) return;

    const currentPlayer = game.players[game.currentPlayerIndex];
    if (currentPlayer.id !== socket.id) return;

    game.diceValue = rollDice();
    game.canRollDice = false;
    game.lastRollTime = Date.now();

    io.to(roomId).emit(
      "diceRolled",
      game.diceValue,
      currentPlayer.id,
      currentPlayer
    );

    // Check if player has any valid moves
    if (!hasValidMoves(currentPlayer, game.diceValue, game)) {
      // No valid moves available, auto-skip after 2 seconds
      setTimeout(() => {
        // Double-check the game still exists and it's still this player's turn
        const currentGame = games.get(roomId);
        if (
          currentGame &&
          currentGame.players[currentGame.currentPlayerIndex].id ===
            currentPlayer.id
        ) {
          nextTurn(currentGame);
          io.to(roomId).emit("turnSkipped", currentPlayer.id);
          io.to(roomId).emit("gameStateUpdate", currentGame);
        }
      }, 2000);
    }

    io.to(roomId).emit("gameStateUpdate", game);
  });

  socket.on("moveToken", (roomId: string, tokenId: string) => {
    const game = games.get(roomId);
    if (!game || game.canRollDice) return;

    const currentPlayer = game.players[game.currentPlayerIndex];
    if (currentPlayer.id !== socket.id) return;

    // Check if this move is still valid
    const token = currentPlayer.tokens.find((t) => t.id === tokenId);
    if (!token || !canTokenMove(token, game.diceValue, game)) {
      socket.emit("error", "Invalid move");
      return;
    }

    const result = moveToken(game, socket.id, tokenId);

    io.to(roomId).emit("tokenMoved", result);
    io.to(roomId).emit("gameStateUpdate", game);

    if (game.gameEnded) {
      const winner = game.players.find((p) => p.id === game.winner)!;
      io.to(roomId).emit("gameEnded", winner);
      clearMoveTimer(roomId);
    }
  });

  socket.on("skipTurn", (roomId: string) => {
    const game = games.get(roomId);
    if (!game || game.canRollDice) return;

    const currentPlayer = game.players[game.currentPlayerIndex];
    if (currentPlayer.id !== socket.id) return;

    // Only allow manual skip if no valid moves available
    if (!hasValidMoves(currentPlayer, game.diceValue, game)) {
      nextTurn(game);
      io.to(roomId).emit("turnSkipped", currentPlayer.id);
      io.to(roomId).emit("gameStateUpdate", game);
    }
  });

  socket.on(
    "usePowerUp",
    (roomId: string, powerUpType: string, targetData: any) => {
      const game = games.get(roomId);
      if (!game) return;

      const player = game.players.find((p) => p.id === socket.id);
      if (!player) return;

      // Handle teleport and swap power-ups
      if (powerUpType === "teleport" && targetData.position !== undefined) {
        const token = player.tokens.find((t) => t.id === targetData.tokenId);
        if (token && !token.isInHomeRun) {
          token.position = targetData.position;
          io.to(roomId).emit("gameStateUpdate", game);
        }
      }

      if (powerUpType === "swap" && targetData.targetTokenId) {
        const playerToken = player.tokens.find(
          (t) => t.id === targetData.tokenId
        );
        const targetToken = game.players
          .flatMap((p) => p.tokens)
          .find((t) => t.id === targetData.targetTokenId);

        if (
          playerToken &&
          targetToken &&
          !playerToken.isInHomeRun &&
          !targetToken.isInHomeRun
        ) {
          const tempPos = playerToken.position;
          playerToken.position = targetToken.position;
          targetToken.position = tempPos;
          io.to(roomId).emit("gameStateUpdate", game);
        }
      }
    }
  );

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Find and remove player from games
    for (const [roomId, game] of games.entries()) {
      const playerIndex = game.players.findIndex((p) => p.id === socket.id);
      if (playerIndex !== -1) {
        game.players.splice(playerIndex, 1);
        playerSockets.delete(socket.id);
        clearMoveTimer(roomId);

        if (game.players.length === 0) {
          games.delete(roomId);
          gameSettings.delete(roomId);
        } else {
          io.to(roomId).emit("playerLeft", socket.id);
          io.to(roomId).emit("gameStateUpdate", game);
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
