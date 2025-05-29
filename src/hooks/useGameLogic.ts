// src/hooks/useGameLogic.ts
import { useState, useCallback, useMemo } from 'react';
import { GameState, Token, Player, PowerUp } from '../types/game';
import { canTokenMove, isPositionSafe, calculateScore } from '../utils/gameLogic';
import { getAvailableTeleportPositions, getSwappableTokens, canActivatePowerUp } from '../utils/powerUps';

export const useGameLogic = (gameState: GameState | null, playerId: string) => {
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [showPowerUpModal, setShowPowerUpModal] = useState(false);
  const [availablePowerUp, setAvailablePowerUp] = useState<PowerUp | null>(null);

  const currentPlayer = useMemo(() => {
    if (!gameState) return null;
    return gameState.players.find(p => p.id === playerId) || null;
  }, [gameState, playerId]);

  const isMyTurn = useMemo(() => {
    if (!gameState || !currentPlayer) return false;
    return gameState.players[gameState.currentPlayer]?.id === playerId;
  }, [gameState, currentPlayer, playerId]);

  const movableTokens = useMemo(() => {
    if (!currentPlayer || !gameState) return [];
    
    return currentPlayer.tokens.filter(token => 
      canTokenMove(token, gameState.dice) && !token.isFinished
    );
  }, [currentPlayer, gameState]);

  const getTokenAtPosition = useCallback((position: number): Token | null => {
    if (!gameState) return null;
    
    for (const player of gameState.players) {
      for (const token of player.tokens) {
        if (token.position === position && !token.isInHome && !token.isFinished) {
          return token;
        }
      }
    }
    return null;
  }, [gameState]);

  const canKillToken = useCallback((attackerToken: Token, targetToken: Token): boolean => {
    if (!gameState) return false;
    
    // Can't kill if target has shield
    if (targetToken.shield > 0) return false;
    
    // Can't kill on safe positions
    if (isPositionSafe(targetToken.position)) return false;
    
    // Can't kill own tokens (unless kill zone is active)
    const attackerPlayer = gameState.players.find(p => p.tokens.includes(attackerToken));
    const targetPlayer = gameState.players.find(p => p.tokens.includes(targetToken));
    
    if (attackerPlayer?.id === targetPlayer?.id && !gameState.killZoneActive) return false;
    
    return true;
  }, [gameState]);

  const calculateMoveConsequences = useCallback((token: Token, steps: number) => {
    if (!gameState) return null;
    
    const actualSteps = token.speedBoost ? steps * 2 : steps;
    const newPosition = (token.position + actualSteps) % 52;
    const targetToken = getTokenAtPosition(newPosition);
    
    return {
      newPosition,
      willKill: targetToken ? canKillToken(token, targetToken) : false,
      targetToken,
      isOnPowerUp: gameState.powerUpCells.includes(newPosition),
      isOnTrap: gameState.trapCells.includes(newPosition),
      isSafe: isPositionSafe(newPosition)
    };
  }, [gameState, getTokenAtPosition, canKillToken]);

  const getPlayerStats = useCallback((player: Player) => {
    const tokensHome = player.tokens.filter(t => t.isFinished).length;
    const tokensOut = player.tokens.filter(t => !t.isInHome && !t.isFinished).length;
    const tokensInHome = player.tokens.filter(t => t.isInHome).length;
    
    return {
      tokensHome,
      tokensOut,
      tokensInHome,
      totalScore: calculateScore(player),
      kills: player.kills
    };
  }, []);

  const checkGameEndCondition = useCallback(() => {
    if (!gameState) return null;
    
    // Check for traditional win (all tokens home)
    for (const player of gameState.players) {
      if (player.tokens.every(token => token.isFinished)) {
        return { winner: player, winType: 'traditional' };
      }
    }
    
    // Check for points-based win (if enabled and game has gone long enough)
    const pointsRule = gameState.rules.find(r => r.id === 'pointsSystem');
    if (pointsRule?.enabled && gameState.turnCount > 200) {
      const sortedPlayers = [...gameState.players].sort((a, b) => calculateScore(b) - calculateScore(a));
      if (sortedPlayers[0] && sortedPlayers[1] && 
          calculateScore(sortedPlayers[0]) > calculateScore(sortedPlayers[1]) + 50) {
        return { winner: sortedPlayers[0], winType: 'points' };
      }
    }
    
    return null;
  }, [gameState]);

  const getTeleportOptions = useCallback(() => {
    if (!gameState) return [];
    return getAvailableTeleportPositions(gameState, playerId);
  }, [gameState, playerId]);

  const getSwapOptions = useCallback(() => {
    if (!gameState) return [];
    return getSwappableTokens(gameState, playerId);
  }, [gameState, playerId]);

  const canUsePowerUp = useCallback((powerUp: PowerUp) => {
    if (!gameState) return false;
    return canActivatePowerUp(powerUp, gameState, playerId);
  }, [gameState, playerId]);

  const selectToken = useCallback((token: Token) => {
    if (movableTokens.includes(token)) {
      setSelectedToken(token);
    }
  }, [movableTokens]);

  const clearSelection = useCallback(() => {
    setSelectedToken(null);
    setShowPowerUpModal(false);
    setAvailablePowerUp(null);
  }, []);

  const showPowerUpOptions = useCallback((powerUp: PowerUp) => {
    setAvailablePowerUp(powerUp);
    setShowPowerUpModal(true);
  }, []);

  return {
    currentPlayer,
    isMyTurn,
    movableTokens,
    selectedToken,
    showPowerUpModal,
    availablePowerUp,
    selectToken,
    clearSelection,
    showPowerUpOptions,
    setShowPowerUpModal,
    getTokenAtPosition,
    canKillToken,
    calculateMoveConsequences,
    getPlayerStats,
    checkGameEndCondition,
    getTeleportOptions,
    getSwapOptions,
    canUsePowerUp
  };
};