// src/utils/powerUps.ts
import { PowerUp, Token, Player, GameState } from '../types/game';

export const POWER_UP_CONFIGS: Record<string, PowerUp> = {
  shield: {
    type: 'shield',
    name: 'Shield',
    description: "Token can't be killed for 2 turns",
    icon: '🛡️'
  },
  speed: {
    type: 'speed',
    name: 'Speed Boost',
    description: 'Move 2x distance on next move',
    icon: '⚡'
  },
  teleport: {
    type: 'teleport',
    name: 'Teleport',
    description: 'Move to any unoccupied cell',
    icon: '🌀'
  },
  swap: {
    type: 'swap',
    name: 'Token Swap',
    description: 'Swap positions with any opponent token',
    icon: '🔄'
  }
};

export const activateShield = (token: Token): void => {
  token.shield = 2;
};

export const activateSpeedBoost = (token: Token): void => {
  token.speedBoost = true;
};

export const canUseTeleport = (gameState: GameState, playerId: string): boolean => {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return false;
  
  // Check if there are available positions to teleport to
  const occupiedPositions = new Set<number>();
  gameState.players.forEach(p => {
    p.tokens.forEach(t => {
      if (!t.isInHome && !t.isFinished) {
        occupiedPositions.add(t.position);
      }
    });
  });
  
  return occupiedPositions.size < 52; // Total board positions
};

export const getAvailableTeleportPositions = (gameState: GameState, playerId: string): number[] => {
  const occupiedPositions = new Set<number>();
  const player = gameState.players.find(p => p.id === playerId);
  
  if (!player) return [];
  
  // Get all occupied positions
  gameState.players.forEach(p => {
    p.tokens.forEach(t => {
      if (!t.isInHome && !t.isFinished) {
        occupiedPositions.add(t.position);
      }
    });
  });
  
  // Return positions that are not occupied and not in home paths of other players
  const availablePositions: number[] = [];
  for (let i = 0; i < 52; i++) {
    if (!occupiedPositions.has(i) && !isInOtherPlayerHomePath(i, player.color)) {
      availablePositions.push(i);
    }
  }
  
  return availablePositions;
};

export const isInOtherPlayerHomePath = (position: number, playerColor: string): boolean => {
  const homePaths: Record<string, number[]> = {
    red: [51, 52, 53, 54, 55, 56],
    blue: [12, 13, 20, 21, 28, 29],
    green: [25, 26, 33, 34, 41, 42],
    yellow: [38, 39, 46, 47, 4, 5]
  };
  
  for (const [color, path] of Object.entries(homePaths)) {
    if (color !== playerColor && path.includes(position)) {
      return true;
    }
  }
  
  return false;
};

export const getSwappableTokens = (gameState: GameState, playerId: string): Token[] => {
  const swappableTokens: Token[] = [];
  
  gameState.players.forEach(player => {
    if (player.id !== playerId) {
      player.tokens.forEach(token => {
        if (!token.isInHome && !token.isFinished && token.shield === 0) {
          swappableTokens.push(token);
        }
      });
    }
  });
  
  return swappableTokens;
};

export const executeTeleport = (token: Token, newPosition: number): boolean => {
  if (newPosition < 0 || newPosition > 51) return false;
  
  token.position = newPosition;
  return true;
};

export const executeSwap = (token1: Token, token2: Token): boolean => {
  if (token1.isInHome || token1.isFinished || token2.isInHome || token2.isFinished) {
    return false;
  }
  
  const temp = token1.position;
  token1.position = token2.position;
  token2.position = temp;
  
  return true;
};

export const getPowerUpByPosition = (position: number, powerUpCells: number[]): PowerUp | null => {
  const powerUpIndex = powerUpCells.indexOf(position);
  if (powerUpIndex === -1) return null;
  
  const powerUpTypes = Object.keys(POWER_UP_CONFIGS);
  const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
  
  return POWER_UP_CONFIGS[randomType];
};

export const canActivatePowerUp = (powerUp: PowerUp, gameState: GameState, playerId: string): boolean => {
  switch (powerUp.type) {
    case 'shield':
    case 'speed':
      return true;
    case 'teleport':
      return canUseTeleport(gameState, playerId);
    case 'swap':
      return getSwappableTokens(gameState, playerId).length > 0;
    default:
      return false;
  }
};

export const getPowerUpDescription = (powerUp: PowerUp): string => {
  return `${powerUp.icon} ${powerUp.name}: ${powerUp.description}`;
};

export const hasActivePowerUp = (token: Token): boolean => {
  return token.shield > 0 || token.speedBoost || token.frozen > 0;
};

export const getPowerUpStatus = (token: Token): string[] => {
  const statuses: string[] = [];
  
  if (token.shield > 0) {
    statuses.push(`🛡️ Shield (${token.shield} turns)`);
  }
  
  if (token.speedBoost) {
    statuses.push('⚡ Speed Boost');
  }
  
  if (token.frozen > 0) {
    statuses.push(`❄️ Frozen (${token.frozen} turns)`);
  }
  
  return statuses;
};

export const reducePowerUpDurations = (token: Token): void => {
  if (token.shield > 0) token.shield--;
  if (token.frozen > 0) token.frozen--;
  // Speed boost is consumed when used, not reduced over time
};