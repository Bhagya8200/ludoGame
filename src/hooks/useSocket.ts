// File: src/hooks/useSocket.ts
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../types/game.js';

export const useSocket = () => {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socketRef.current = io('http://localhost:3001');

    socketRef.current.on('connect', () => {
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected
  };
};

// File: src/hooks/useGame.ts
import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket.js';
import type { RoomState, GameState, Player, GameRules, PowerUpType } from '../types/game.js';

export const useGame = () => {
  const { socket, isConnected } = useSocket();
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('roomJoined', (room) => {
      setRoomState(room);
      setError(null);
    });

    socket.on('playerJoined', (player) => {
      setRoomState(prev => prev ? {
        ...prev,
        players: [...prev.players.filter(p => p.id !== player.id), player]
      } : null);
    });

    socket.on('playerLeft', (playerId) => {
      setRoomState(prev => prev ? {
        ...prev,
        players: prev.players.filter(p => p.id !== playerId)
      } : null);
    });

    socket.on('gameStarted', (game) => {
      setGameState(game);
    });

    socket.on('gameUpdated', (game) => {
      setGameState(game);
    });

    socket.on('diceRolled', (dice, playerId) => {
      console.log(`Player ${playerId} rolled ${dice}`);
    });

    socket.on('tokenMoved', (moveData) => {
      console.log('Token moved:', moveData);
    });

    socket.on('gameEnded', (winner, finalScores) => {
      console.log('Game ended:', winner, finalScores);
    });

    socket.on('ruleVoteUpdated', (votes) => {
      setRoomState(prev => prev ? { ...prev, ruleVotes: votes } : null);
    });

    socket.on('error', (message) => {
      setError(message);
    });

    return () => {
      socket.off('roomJoined');
      socket.off('playerJoined');
      socket.off('playerLeft');
      socket.off('gameStarted');
      socket.off('gameUpdated');
      socket.off('diceRolled');
      socket.off('tokenMoved');
      socket.off('gameEnded');
      socket.off('ruleVoteUpdated');
      socket.off('error');
    };
  }, [socket]);

  // Update current player when game state changes
  useEffect(() => {
    if (gameState && socket) {
      const player = gameState.players.find(p => p.id === socket.id);
      setCurrentPlayer(player || null);
    }
  }, [gameState, socket]);

  const createRoom = useCallback((playerName: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      socket.emit('createRoom', playerName, (roomId) => {
        resolve(roomId);
      });
    });
  }, [socket]);

  const joinRoom = useCallback((roomId: string, playerName: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      socket.emit('joinRoom', roomId, playerName, (success) => {
        resolve(success);
      });
    });
  }, [socket]);

  const leaveRoom = useCallback(() => {
    if (socket) {
      socket.emit('leaveRoom');
      setRoomState(null);
      setGameState(null);
      setCurrentPlayer(null);
    }
  }, [socket]);

  const rollDice = useCallback(() => {
    if (socket) {
      socket.emit('rollDice');
    }
  }, [socket]);

  const moveToken = useCallback((tokenId: string, targetPosition: number) => {
    if (socket) {
      socket.emit('moveToken', tokenId, targetPosition);
    }
  }, [socket]);

  const usePowerUp = useCallback((powerUp: PowerUpType, targetData?: any) => {
    if (socket) {
      socket.emit('usePowerUp', powerUp, targetData);
    }
  }, [socket]);

  const voteRule = useCallback((rule: keyof GameRules, vote: boolean) => {
    if (socket) {
      socket.emit('voteRule', rule, vote);
    }
  }, [socket]);

  const setPlayerReady = useCallback(() => {
    if (socket) {
      socket.emit('playerReady');
    }
  }, [socket]);

  const startGame = useCallback(() => {
    if (socket) {
      socket.emit('startGame');
    }
  }, [socket]);

  return {
    isConnected,
    roomState,
    gameState,
    currentPlayer,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    rollDice,
    moveToken,
    usePowerUp,
    voteRule,
    setPlayerReady,
    startGame
  };
};