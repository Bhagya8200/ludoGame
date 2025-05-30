// hooks.ts
import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameState, Player, Token, MoveResult, PowerUp } from '../types/game';

export const useSocket = (serverUrl: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(serverUrl);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    return () => {
      newSocket.close();
    };
  }, [serverUrl]);

  return { socket, connected };
};

export const useGame = (socket: Socket | null) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string>('');
  const [notification, setNotification] = useState<string>('');
  const [timeWarning, setTimeWarning] = useState<number>(0);

  useEffect(() => {
    if (!socket) return;

    socket.on('gameStateUpdate', (state: GameState) => {
      setGameState(state);
      const player = state.players.find(p => p.id === socket.id);
      setCurrentPlayer(player || null);
    });

    socket.on('playerJoined', (player: Player) => {
      setNotification(`${player.name} joined the game`);
      setTimeout(() => setNotification(''), 3000);
    });

    socket.on('playerLeft', (playerId: string) => {
      setNotification('A player left the game');
      setTimeout(() => setNotification(''), 3000);
    });

    socket.on('diceRolled', (value: number, playerId: string) => {
      setNotification(`Dice rolled: ${value}`);
      setTimeout(() => setNotification(''), 2000);
    });

    socket.on('tokenMoved', (result: MoveResult) => {
      if (result.message) {
        setNotification(result.message);
        setTimeout(() => setNotification(''), 3000);
      }
      if (result.killedToken) {
        setNotification('Token killed!');
        setTimeout(() => setNotification(''), 3000);
      }
      if (result.powerUpActivated) {
        setNotification(`Power-up activated: ${result.powerUpActivated.type}`);
        setTimeout(() => setNotification(''), 3000);
      }
    });

    socket.on('gameStarted', () => {
      setNotification('Game started!');
      setTimeout(() => setNotification(''), 3000);
    });

    socket.on('gameEnded', (winner: Player) => {
      setNotification(`${winner.name} wins!`);
    });

    socket.on('timeWarning', (timeLeft: number) => {
      setTimeWarning(timeLeft);
      setTimeout(() => setTimeWarning(0), 1000);
    });

    socket.on('turnSkipped', (playerId: string) => {
      setNotification('Turn skipped due to timeout');
      setTimeout(() => setNotification(''), 3000);
    });

    socket.on('killZoneActivated', () => {
      setNotification('⚡ KILL ZONE ACTIVATED! ⚡');
      setTimeout(() => setNotification(''), 5000);
    });

    socket.on('powerUpSpawned', (powerUp: PowerUp) => {
      setNotification(`New power-up available: ${powerUp.type}`);
      setTimeout(() => setNotification(''), 3000);
    });

    socket.on('error', (message: string) => {
      setError(message);
      setTimeout(() => setError(''), 5000);
    });

    return () => {
      socket.off('gameStateUpdate');
      socket.off('playerJoined');
      socket.off('playerLeft');
      socket.off('diceRolled');
      socket.off('tokenMoved');
      socket.off('gameStarted');
      socket.off('gameEnded');
      socket.off('timeWarning');
      socket.off('turnSkipped');
      socket.off('killZoneActivated');
      socket.off('powerUpSpawned');
      socket.off('error');
    };
  }, [socket]);

  const joinRoom = useCallback((roomId: string, playerName: string) => {
    if (socket) {
      socket.emit('joinRoom', roomId, playerName);
    }
  }, [socket]);

  const setReady = useCallback((roomId: string) => {
    if (socket) {
      socket.emit('playerReady', roomId);
    }
  }, [socket]);

  const rollDice = useCallback((roomId: string) => {
    if (socket) {
      socket.emit('rollDice', roomId);
    }
  }, [socket]);

  const moveToken = useCallback((roomId: string, tokenId: string) => {
    if (socket) {
      socket.emit('moveToken', roomId, tokenId);
    }
  }, [socket]);

  const usePowerUp = useCallback((roomId: string, powerUpType: string, targetData: any) => {
    if (socket) {
      socket.emit('usePowerUp', roomId, powerUpType, targetData);
    }
  }, [socket]);

  return {
    gameState,
    currentPlayer,
    error,
    notification,
    timeWarning,
    joinRoom,
    setReady,
    rollDice,
    moveToken,
    usePowerUp
  };
};

export const useTimer = (initialTime: number, onTimeUp?: () => void) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isActive, setIsActive] = useState(false);

  const start = useCallback(() => {
    setIsActive(true);
    setTimeLeft(initialTime);
  }, [initialTime]);

  const stop = useCallback(() => {
    setIsActive(false);
  }, []);

  const reset = useCallback(() => {
    setTimeLeft(initialTime);
    setIsActive(false);
  }, [initialTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            setIsActive(false);
            if (onTimeUp) onTimeUp();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, onTimeUp]);

  return { timeLeft, isActive, start, stop, reset };
};

export const usePowerUpSelection = () => {
  const [selectedPowerUp, setSelectedPowerUp] = useState<string | null>(null);
  const [showPowerUpDialog, setShowPowerUpDialog] = useState(false);
  const [powerUpData, setPowerUpData] = useState<any>(null);

  const selectPowerUp = useCallback((type: string, data?: any) => {
    setSelectedPowerUp(type);
    setPowerUpData(data);
    setShowPowerUpDialog(true);
  }, []);

  const closePowerUpDialog = useCallback(() => {
    setSelectedPowerUp(null);
    setPowerUpData(null);
    setShowPowerUpDialog(false);
  }, []);

  return {
    selectedPowerUp,
    showPowerUpDialog,
    powerUpData,
    selectPowerUp,
    closePowerUpDialog
  };
};

export const useAudioEffects = () => {
  const playDiceRoll = useCallback(() => {
    // Create a simple dice roll sound effect
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  }, []);

  const playTokenMove = useCallback(() => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(880, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  }, []);

  const playKill = useCallback(() => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }, []);

  const playPowerUp = useCallback(() => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  }, []);

  return {
    playDiceRoll,
    playTokenMove,
    playKill,
    playPowerUp
  };
};