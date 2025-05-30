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
} from "../utils/boardUtils";

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
  moveTimeLimit: 10,
  powerUpsEnabled: true,
  trapZonesEnabled: true,
  reverseKillEnabled: true,
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
    isKillZoneActive: false,
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

function updateTokenEffects(player: Player): void {
  player.tokens.forEach((token) => {
    if (token.hasShield && token.shieldTurns !== undefined && token.shieldTurns > 0) {
      token.shieldTurns--;
      if (token.shieldTurns <= 0) {
        token.hasShield = false;
      }
    }

    if (token.isFrozen && token.frozenTurns !== undefined && token.frozenTurns > 0) {
      token.frozenTurns--;
      if (token.frozenTurns <= 0) {
        token.isFrozen = false;
      }
    }
  });
}

function handleKillZoneActivation(game: GameState): void {
  if (game.turnCount > 0 && game.turnCount % 15 === 0) {
    game.isKillZoneActive = true;
    io.to(game.id).emit("killZoneActivated");

    // Deactivate after 3 turns
    setTimeout(() => {
      if (games.has(game.id)) {
        game.isKillZoneActive = false;
        io.to(game.id).emit("gameStateUpdate", game);
      }
    }, 30000); // 30 seconds
  }
}

function startMoveTimer(game: GameState): void {
  const settings = gameSettings.get(game.id) || defaultSettings;
  if (!settings.timedMoves) return;

  const currentPlayer = game.players[game.currentPlayerIndex];
  if (!currentPlayer) return;
  
  currentPlayer.moveTimeLeft = settings.moveTimeLimit;

  const timer = setInterval(() => {
    if (currentPlayer.moveTimeLeft !== undefined) {
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
    }
  }, 1000);

  moveTimers.set(game.id, timer);
}

function clearMoveTimer(gameId: string): void {
  const timer = moveTimers.get(gameId);
  if (timer) {
    clearInterval(timer);
    moveTimers.delete(gameId);
  }
}

function nextTurn(game: GameState): void {
  clearMoveTimer(game.id);

  // Update token effects for current player
  const currentPlayer = game.players[game.currentPlayerIndex];
  if (currentPlayer) {
    updateTokenEffects(currentPlayer);
  }

  game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
  game.canRollDice = true;
  game.diceValue = 0;
  game.turnCount++;

  // Check for kill zone activation
  handleKillZoneActivation(game);

  // Start timer for next player
  startMoveTimer(game);
}

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

  // Check if entering home run
  if (newPosition >= 56) {
    token.isInHomeRun = true;
    token.position = newPosition;

    // Check if finished
    if (newPosition >= 61) {
      token.isFinished = true;
      player.points = (player.points || 0) + calculatePoints("finish_token");

      // Check win condition
      if (checkWinCondition(player)) {
        game.gameEnded = true;
        game.winner = player.id;
      }
    }
  } else {
    token.position = newPosition;
  }

  const result: MoveResult = { success: true, pointsEarned: 0 };

  // Check for kills
  if (newPosition < 56) {
    const tokensAtPosition = getTokensAtPosition(game.players, newPosition);
    const targetTokens = tokensAtPosition.filter((t) => t.id !== token.id);

    for (const targetToken of targetTokens) {
      if (canKillToken(token, targetToken, game.isKillZoneActive)) {
        const targetPlayer = game.players.find(
          (p) => p.id === targetToken.playerId
        );
        if (!targetPlayer) continue;
        
        const settings = gameSettings.get(game.id) || defaultSettings;

        // Ensure kills property exists and is initialized
        player.kills = player.kills || 0;
        targetPlayer.kills = targetPlayer.kills || 0;
        player.points = player.points || 0;
        targetPlayer.points = targetPlayer.points || 0;

        // Reverse kill logic
        if (settings.reverseKillEnabled && targetPlayer.kills > player.kills) {
          // Attacker goes home instead
          token.position = -1;
          token.isInHomeRun = false;
          player.points += calculatePoints("get_killed");
          result.message = "Reverse kill! Your token was sent home.";
        } else {
          // Normal kill
          targetToken.position = -1;
          targetToken.isInHomeRun = false;
          targetToken.hasShield = false;
          targetToken.shieldTurns = 0;

          player.kills++;
          player.points += calculatePoints("kill");
          targetPlayer.points += calculatePoints("get_killed");

          result.killedToken = targetToken;
        }
        break;
      }
    }
  }

  // Check for power-ups
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
        break;
      case "speed":
        // Speed boost applied on next move (handled in canTokenMove)
        break;
    }

    // Spawn new power-up
    setTimeout(() => {
      if (games.has(game.id)) {
        const newPowerUp = generatePowerUp();
        game.powerUps.push(newPowerUp);
        io.to(game.id).emit("powerUpSpawned", newPowerUp);
      }
    }, 5000);
  }

  // Check for trap zones
  if (isTrapPosition(newPosition) && !token.hasShield) {
    const trapEffect = Math.random() < 0.5 ? "back" : "freeze";

    if (trapEffect === "back") {
      token.position = Math.max(0, token.position - 3);
      result.message = "Trap activated! Moved back 3 steps.";
    } else {
      token.isFrozen = true;
      token.frozenTurns = 1;
      result.message = "Trap activated! Token frozen for 1 turn.";
    }
  }

  // Award points for completing rounds
  if (oldPosition > newPosition && !token.isInHomeRun) {
    player.points = (player.points || 0) + calculatePoints("complete_round");
  }

  result.pointsEarned = player.points || 0;

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
    if (game.players.length >= 2 && game.players.every((p) => p.isReady)) {
      game.gameStarted = true;
      game.canRollDice = true;
      startMoveTimer(game);
      io.to(roomId).emit("gameStarted");
    }

    io.to(roomId).emit("gameStateUpdate", game);
  });

  socket.on("rollDice", (roomId: string) => {
    const game = games.get(roomId);
    if (!game || !game.canRollDice) return;

    const currentPlayer = game.players[game.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.id !== socket.id) return;

    game.diceValue = rollDice();
    game.canRollDice = false;
    game.lastRollTime = Date.now();

    io.to(roomId).emit("diceRolled", game.diceValue, currentPlayer.id);
    io.to(roomId).emit("gameStateUpdate", game);
  });

  socket.on("moveToken", (roomId: string, tokenId: string) => {
    const game = games.get(roomId);
    if (!game || game.canRollDice) return;

    const currentPlayer = game.players[game.currentPlayerIndex];
    if (!currentPlayer || currentPlayer.id !== socket.id) return;

    const result = moveToken(game, socket.id, tokenId);

    io.to(roomId).emit("tokenMoved", result);
    io.to(roomId).emit("gameStateUpdate", game);

    if (game.gameEnded && game.winner) {
      const winner = game.players.find((p) => p.id === game.winner);
      if (winner) {
        io.to(roomId).emit("gameEnded", winner);
      }
      clearMoveTimer(roomId);
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