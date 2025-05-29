// src/hooks/useSocket.ts
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState } from '../types/game';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string>('');
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3001', {
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      setError('');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('roomCreated', ({ roomId: newRoomId, gameState: newGameState }) => {
      setRoomId(newRoomId);
      setGameState(newGameState);
    });

    newSocket.on('gameState', (newGameState: GameState) => {
      setGameState(newGameState);
    });

    newSocket.on('error', (errorMessage: string) => {
      setError(errorMessage);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const createRoom = (playerName: string) => {
    if (socket) {
      socket.emit('createRoom', playerName);
    }
  };

  const joinRoom = (roomId: string, playerName: string) => {
    if (socket) {
      socket.emit('joinRoom', { roomId, playerName });
      setRoomId(roomId);
    }
  };

  const voteRule = (ruleId: string) => {
    if (socket && roomId) {
      socket.emit('voteRule', { roomId, ruleId });
    }
  };

  const startGame = () => {
    if (socket && roomId) {
      socket.emit('startGame', roomId);
    }
  };

  const rollDice = () => {
    if (socket && roomId) {
      socket.emit('rollDice', roomId);
    }
  };

  const moveToken = (tokenId: string, steps: number) => {
    if (socket && roomId) {
      socket.emit('moveToken', { roomId, tokenId, steps });
    }
  };

  const usePowerUp = (powerUpType: string, tokenId: string, targetData?: any) => {
    if (socket && roomId) {
      socket.emit('usePowerUp', { roomId, powerUpType, tokenId, targetData });
    }
  };

  return {
    socket,
    gameState,
    roomId,
    isConnected,
    error,
    createRoom,
    joinRoom,
    voteRule,
    startGame,
    rollDice,
    moveToken,
    usePowerUp
  };
};