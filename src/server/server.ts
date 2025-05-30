// File: src/server/server.ts
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameManager } from './gameManager.js';
import type { ClientToServerEvents, ServerToClientEvents } from '../types/game.js';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const gameManager = new GameManager(io);

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('createRoom', (playerName, callback) => {
    try {
      const roomId = gameManager.createRoom(socket.id, playerName);
      socket.join(roomId);
      callback(roomId);
    } catch (error) {
      socket.emit('error', error instanceof Error ? error.message : 'Failed to create room');
    }
  });

  socket.on('joinRoom', (roomId, playerName, callback) => {
    try {
      const success = gameManager.joinRoom(socket.id, roomId, playerName);
      if (success) {
        socket.join(roomId);
      }
      callback(success);
    } catch (error) {
      socket.emit('error', error instanceof Error ? error.message : 'Failed to join room');
      callback(false);
    }
  });

  socket.on('leaveRoom', () => {
    gameManager.leaveRoom(socket.id);
  });

  socket.on('rollDice', () => {
    gameManager.rollDice(socket.id);
  });

  socket.on('moveToken', (tokenId, targetPosition) => {
    gameManager.moveToken(socket.id, tokenId, targetPosition);
  });

  socket.on('usePowerUp', (powerUp, targetData) => {
    gameManager.usePowerUp(socket.id, powerUp, targetData);
  });

  socket.on('voteRule', (rule, vote) => {
    gameManager.voteRule(socket.id, rule, vote);
  });

  socket.on('playerReady', () => {
    gameManager.setPlayerReady(socket.id);
  });

  socket.on('startGame', () => {
    gameManager.startGame(socket.id);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    gameManager.leaveRoom(socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// File: src/server/gameManager.ts
import { Server } from 'socket.io';
import type { 
  ServerToClientEvents, 
  ClientToServerEvents, 
  RoomState, 
  GameState, 
  Player, 
  Token, 
  Cell, 
  PlayerColor, 
  GameRules,
  PowerUpType,
  CellType
} from '../types/game.js';
import { GameLogic } from './gameLogic.js';

export class GameManager {
  private rooms = new Map<string, RoomState>();
  private playerRooms = new Map<string, string>();
  private timers = new Map<string, NodeJS.Timeout>();

  constructor(private io: Server<ClientToServerEvents, ServerToClientEvents>) {}

  createRoom(playerId: string, playerName: string): string {
    const roomId = this.generateRoomId();
    const player = this.createPlayer(playerId, playerName, PlayerColor.RED);
    
    const room: RoomState = {
      id: roomId,
      players: [player],
      maxPlayers: 4,
      ruleVotes: this.initializeRuleVotes(),
      allPlayersReady: false
    };

    this.rooms.set(roomId, room);
    this.playerRooms.set(playerId, roomId);
    
    this.io.to(roomId).emit('roomJoined', room);
    return roomId;
  }

  joinRoom(playerId: string, roomId: string, playerName: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room || room.players.length >= room.maxPlayers) {
      return false;
    }

    const colors = [PlayerColor.RED, PlayerColor.GREEN, PlayerColor.BLUE, PlayerColor.YELLOW];
    const usedColors = room.players.map(p => p.color);
    const availableColor = colors.find(color => !usedColors.includes(color));
    
    if (!availableColor) {
      return false;
    }

    const player = this.createPlayer(playerId, playerName, availableColor);
    room.players.push(player);
    this.playerRooms.set(playerId, roomId);

    this.io.to(roomId).emit('playerJoined', player);
    this.io.to(roomId).emit('roomJoined', room);
    
    return true;
  }

  leaveRoom(playerId: string): void {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== playerId);
    this.playerRooms.delete(playerId);

    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      const timer = this.timers.get(roomId);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(roomId);
      }
    } else {
      this.io.to(roomId).emit('playerLeft', playerId);
      this.io.to(roomId).emit('roomJoined', room);
    }
  }

  voteRule(playerId: string, rule: keyof GameRules, vote: boolean): void {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room || room.gameState?.gameStarted) return;

    room.ruleVotes[rule][playerId] = vote;
    this.io.to(roomId).emit('ruleVoteUpdated', room.ruleVotes);
  }

  setPlayerReady(playerId: string): void {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.isReady = true;
      room.allPlayersReady = room.players.every(p => p.isReady);
      this.io.to(roomId).emit('roomJoined', room);
    }
  }

  startGame(playerId: string): void {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room || !room.allPlayersReady || room.players.length < 2) return;

    const gameRules = this.calculateFinalRules(room.ruleVotes, room.players.length);
    const gameState = GameLogic.initializeGame(room.players, gameRules);
    room.gameState = gameState;

    this.io.to(roomId).emit('gameStarted', gameState);
    this.startTurnTimer(roomId);
  }

  rollDice(playerId: string): void {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room?.gameState) return;

    const gameState = room.gameState;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    if (currentPlayer.id !== playerId || gameState.diceRolled || gameState.gameEnded) {
      return;
    }

    const dice = Math.floor(Math.random() * 6) + 1;
    gameState.dice = dice;
    gameState.diceRolled = true;

    this.io.to(roomId).emit('diceRolled', dice, playerId);
    this.io.to(roomId).emit('gameUpdated', gameState);

    // Check if player has valid moves
    if (!GameLogic.hasValidMoves(gameState, currentPlayer)) {
      setTimeout(() => this.nextTurn(roomId), 1000);
    }
  }

  moveToken(playerId: string, tokenId: string, targetPosition: number): void {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room?.gameState) return;

    const gameState = room.gameState;
    const result = GameLogic.moveToken(gameState, playerId, tokenId, targetPosition);
    
    if (result.success) {
      this.io.to(roomId).emit('tokenMoved', result.moveData!);
      this.io.to(roomId).emit('gameUpdated', gameState);

      if (gameState.gameEnded) {
        this.io.to(roomId).emit('gameEnded', 
          gameState.players.find(p => p.id === gameState.winner)!,
          [...gameState.players].sort((a, b) => b.points - a.points)
        );
      } else if (gameState.dice !== 6 && !result.killedTokens?.length) {
        setTimeout(() => this.nextTurn(roomId), 1000);
      } else {
        gameState.diceRolled = false;
        this.startTurnTimer(roomId);
      }
    }
  }

  usePowerUp(playerId: string, powerUp: PowerUpType, targetData?: any): void {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room?.gameState) return;

    const result = GameLogic.usePowerUp(room.gameState, playerId, powerUp, targetData);
    if (result) {
      this.io.to(roomId).emit('gameUpdated', room.gameState);
    }
  }

  private nextTurn(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room?.gameState) return;

    GameLogic.nextTurn(room.gameState);
    this.io.to(roomId).emit('gameUpdated', room.gameState);
    this.startTurnTimer(roomId);
  }

  private startTurnTimer(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room?.gameState?.rules.timedMoves) return;

    const timer = this.timers.get(roomId);
    if (timer) clearTimeout(timer);

    const gameState = room.gameState;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    currentPlayer.timeLeft = gameState.rules.moveTimeLimit;

    const countdown = setInterval(() => {
      currentPlayer.timeLeft--;
      this.io.to(roomId).emit('gameUpdated', gameState);

      if (currentPlayer.timeLeft <= 0) {
        clearInterval(countdown);
        this.io.to(roomId).emit('playerTurnTimeout', currentPlayer.id);
        this.nextTurn(roomId);
      }
    }, 1000);

    this.timers.set(roomId, countdown);
  }

  private createPlayer(id: string, name: string, color: PlayerColor): Player {
    return {
      id,
      name,
      color,
      tokens: this.createTokens(id, color),
      kills: 0,
      points: 0,
      isReady: false,
      timeLeft: 10
    };
  }

  private createTokens(playerId: string, color: PlayerColor): Token[] {
    return Array.from({ length: 4 }, (_, i) => ({
      id: `${playerId}_token_${i}`,
      color,
      position: -1,
      isActive: false,
      powerUps: {
        shield: 0,
        speedBoost: false,
        frozen: 0
      }
    }));
  }

  private initializeRuleVotes(): RoomState['ruleVotes'] {
    return {
      powerUps: {},
      reverseKill: {},
      timedMoves: {},
      trapZones: {},
      killZoneMode: {},
      pointsSystem: {},
      moveTimeLimit: {},
      killZoneInterval: {}
    };
  }

  private calculateFinalRules(votes: RoomState['ruleVotes'], playerCount: number): GameRules {
    const majority = Math.ceil(playerCount / 2);
    
    return {
      powerUps: Object.values(votes.powerUps).filter(Boolean).length >= majority,
      reverseKill: Object.values(votes.reverseKill).filter(Boolean).length >= majority,
      timedMoves: Object.values(votes.timedMoves).filter(Boolean).length >= majority,
      trapZones: Object.values(votes.trapZones).filter(Boolean).length >= majority,
      killZoneMode: Object.values(votes.killZoneMode).filter(Boolean).length >= majority,
      pointsSystem: Object.values(votes.pointsSystem).filter(Boolean).length >= majority,
      moveTimeLimit: 10,
      killZoneInterval: 15
    };
  }

  private generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}