// src/server/server.ts
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { GameState, Player, Token, GameAction, GAME_RULES } from '../types/game';

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

interface Room {
  id: string;
  gameState: GameState;
  timers: Map<string, NodeJS.Timeout>;
}

const rooms = new Map<string, Room>();

const createInitialGameState = (roomId: string): GameState => ({
  id: roomId,
  players: [],
  currentPlayer: 0,
  dice: 1,
  turnCount: 0,
  gamePhase: 'waiting',
  rules: [...GAME_RULES],
  powerUpCells: [10, 23, 36, 49], // Random positions for power-ups
  trapCells: [15, 28, 41, 6], // Random trap positions
  killZoneActive: false,
  timeLeft: 10,
  winner: undefined
});

const createPlayer = (id: string, name: string, color: 'red' | 'blue' | 'green' | 'yellow'): Player => ({
  id,
  name,
  color,
  tokens: Array.from({ length: 4 }, (_, i) => ({
    id: `${id}-token-${i}`,
    playerId: id,
    position: -1,
    isInHome: true,
    isFinished: false,
    shield: 0,
    speedBoost: false,
    frozen: 0
  })),
  score: 0,
  kills: 0,
  isOnline: true
});

const rollDice = (): number => Math.floor(Math.random() * 6) + 1;

const isValidMove = (gameState: GameState, playerId: string, tokenId: string, steps: number): boolean => {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return false;

  const token = player.tokens.find(t => t.id === tokenId);
  if (!token || token.isFinished || token.frozen > 0) return false;

  // Can't move if not current player's turn
  if (gameState.players[gameState.currentPlayer].id !== playerId) return false;

  return true;
};

const moveToken = (gameState: GameState, playerId: string, tokenId: string, steps: number): boolean => {
  if (!isValidMove(gameState, playerId, tokenId, steps)) return false;

  const player = gameState.players.find(p => p.id === playerId);
  const token = player!.tokens.find(t => t.id === tokenId);

  if (token!.isInHome && steps === 6) {
    // Move out of home
    token!.isInHome = false;
    token!.position = getStartPosition(player!.color);
  } else if (!token!.isInHome) {
    // Normal move
    const newPosition = (token!.position + (token!.speedBoost ? steps * 2 : steps)) % 52;
    token!.position = newPosition;
    token!.speedBoost = false;

    // Check for kills
    checkForKills(gameState, token!, player!);

    // Check for power-ups
    if (gameState.powerUpCells.includes(newPosition)) {
      activatePowerUp(gameState, token!, player!);
    }

    // Check for traps
    if (gameState.trapCells.includes(newPosition)) {
      activateTrap(gameState, token!);
    }
  }

  return true;
};

const getStartPosition = (color: string): number => {
  const positions = { red: 1, blue: 14, green: 27, yellow: 40 };
  return positions[color as keyof typeof positions];
};

const checkForKills = (gameState: GameState, movedToken: Token, player: Player) => {
  if (movedToken.shield > 0) return;

  gameState.players.forEach(otherPlayer => {
    if (otherPlayer.id === player.id) return;

    otherPlayer.tokens.forEach(token => {
      if (token.position === movedToken.position && !token.isInHome && !token.isFinished && token.shield === 0) {
        // Check reverse kill rule
        if (gameState.rules.find(r => r.id === 'reverseKill')?.enabled && otherPlayer.kills > player.kills) {
          // Reverse kill - move attacking token home
          movedToken.position = -1;
          movedToken.isInHome = true;
        } else {
          // Normal kill
          token.position = -1;
          token.isInHome = true;
          player.kills++;
          player.score += 10;
          otherPlayer.score -= 5;
        }
      }
    });
  });
};

const activatePowerUp = (gameState: GameState, token: Token, player: Player) => {
  const powerUpType = Math.floor(Math.random() * 4);
  
  switch (powerUpType) {
    case 0: // Shield
      token.shield = 2;
      break;
    case 1: // Speed boost
      token.speedBoost = true;
      break;
    case 2: // Teleport (handled in frontend)
      break;
    case 3: // Swap (handled in frontend)
      break;
  }
};

const activateTrap = (gameState: GameState, token: Token) => {
  const trapType = Math.random() > 0.5 ? 'stepBack' : 'freeze';
  
  if (trapType === 'stepBack') {
    token.position = Math.max(0, token.position - 3);
  } else {
    token.frozen = 1;
  }
};

const nextTurn = (gameState: GameState) => {
  // Reduce shield and frozen counters
  gameState.players.forEach(player => {
    player.tokens.forEach(token => {
      if (token.shield > 0) token.shield--;
      if (token.frozen > 0) token.frozen--;
    });
  });

  gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
  gameState.turnCount++;
  gameState.dice = rollDice();
  gameState.timeLeft = 10;

  // Check for kill zone activation
  if (gameState.turnCount % 15 === 0 && gameState.rules.find(r => r.id === 'killZone')?.enabled) {
    gameState.killZoneActive = !gameState.killZoneActive;
  }

  // Check win condition
  const winner = checkWinCondition(gameState);
  if (winner) {
    gameState.gamePhase = 'finished';
    gameState.winner = winner.id;
  }
};

const checkWinCondition = (gameState: GameState): Player | null => {
  // Check if any player has all tokens finished
  for (const player of gameState.players) {
    if (player.tokens.every(token => token.isFinished)) {
      return player;
    }
  }

  // If points system is enabled, check for score-based win (after certain turns)
  if (gameState.rules.find(r => r.id === 'pointsSystem')?.enabled && gameState.turnCount > 100) {
    const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
    if (sortedPlayers[0].score > sortedPlayers[1].score + 20) {
      return sortedPlayers[0];
    }
  }

  return null;
};

const startTurnTimer = (room: Room, playerId: string) => {
  const timer = setTimeout(() => {
    // Auto-skip turn
    nextTurn(room.gameState);
    io.to(room.id).emit('gameState', room.gameState);
    
    const nextPlayerId = room.gameState.players[room.gameState.currentPlayer].id;
    startTurnTimer(room, nextPlayerId);
  }, 10000);

  room.timers.set(playerId, timer);
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createRoom', (playerName: string) => {
    const roomId = uuidv4();
    const room: Room = {
      id: roomId,
      gameState: createInitialGameState(roomId),
      timers: new Map()
    };

    const player = createPlayer(socket.id, playerName, 'red');
    room.gameState.players.push(player);

    rooms.set(roomId, room);
    socket.join(roomId);
    
    socket.emit('roomCreated', { roomId, gameState: room.gameState });
  });

  socket.on('joinRoom', ({ roomId, playerName }: { roomId: string, playerName: string }) => {
    const room = rooms.get(roomId);
    if (!room || room.gameState.players.length >= 4) {
      socket.emit('error', 'Room not found or full');
      return;
    }

    const colors = ['red', 'blue', 'green', 'yellow'];
    const usedColors = room.gameState.players.map(p => p.color);
    const availableColor = colors.find(c => !usedColors.includes(c as any));

    if (!availableColor) {
      socket.emit('error', 'No available colors');
      return;
    }

    const player = createPlayer(socket.id, playerName, availableColor as any);
    room.gameState.players.push(player);

    socket.join(roomId);
    io.to(roomId).emit('gameState', room.gameState);
  });

  socket.on('voteRule', ({ roomId, ruleId }: { roomId: string, ruleId: string }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const rule = room.gameState.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.votes++;
      io.to(roomId).emit('gameState', room.gameState);
    }
  });

  socket.on('startGame', (roomId: string) => {
    const room = rooms.get(roomId);
    if (!room || room.gameState.players.length < 2) return;

    // Finalize rules based on votes
    room.gameState.rules.forEach(rule => {
      rule.enabled = rule.votes >= Math.ceil(room.gameState.players.length / 2);
    });

    room.gameState.gamePhase = 'playing';
    room.gameState.dice = rollDice();
    
    io.to(roomId).emit('gameState', room.gameState);
    
    const firstPlayerId = room.gameState.players[0].id;
    if (room.gameState.rules.find(r => r.id === 'timedMoves')?.enabled) {
      startTurnTimer(room, firstPlayerId);
    }
  });

  socket.on('rollDice', (roomId: string) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.gameState.dice = rollDice();
    io.to(roomId).emit('gameState', room.gameState);
  });

  socket.on('moveToken', ({ roomId, tokenId, steps }: { roomId: string, tokenId: string, steps: number }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    if (moveToken(room.gameState, socket.id, tokenId, steps)) {
      // Clear current timer
      const currentTimer = room.timers.get(socket.id);
      if (currentTimer) {
        clearTimeout(currentTimer);
        room.timers.delete(socket.id);
      }

      nextTurn(room.gameState);
      io.to(roomId).emit('gameState', room.gameState);

      // Start next player's timer
      if (room.gameState.gamePhase === 'playing' && 
          room.gameState.rules.find(r => r.id === 'timedMoves')?.enabled) {
        const nextPlayerId = room.gameState.players[room.gameState.currentPlayer].id;
        startTurnTimer(room, nextPlayerId);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Mark player as offline in all rooms
    rooms.forEach(room => {
      const player = room.gameState.players.find(p => p.id === socket.id);
      if (player) {
        player.isOnline = false;
        io.to(room.id).emit('gameState', room.gameState);
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});