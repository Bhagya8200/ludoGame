// utils.ts
import type { Position, Token, Player, PowerUp } from '../types/game';

export const BOARD_SIZE = 15;
export const COLORS = ['red', 'blue', 'green', 'yellow'] as const;
export const SAFE_POSITIONS = [1, 9, 14, 22, 27, 35, 40, 48];
export const POWER_UP_POSITIONS = [5, 17, 31, 43];
export const TRAP_POSITIONS = [11, 25, 38, 52];

// Board position calculations
export const getPositionCoords = (position: number): Position => {
  const positions: Position[] = [
    // Bottom row (0-5)
    { x: 6, y: 14 }, { x: 5, y: 14 }, { x: 4, y: 14 }, { x: 3, y: 14 }, { x: 2, y: 14 }, { x: 1, y: 14 },
    // Left column (6-11)
    { x: 0, y: 13 }, { x: 0, y: 12 }, { x: 0, y: 11 }, { x: 0, y: 10 }, { x: 0, y: 9 }, { x: 0, y: 8 },
    // Top left to center (12-17)
    { x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 },
    // Top row (18-23)
    { x: 8, y: 6 }, { x: 9, y: 6 }, { x: 10, y: 6 }, { x: 11, y: 6 }, { x: 12, y: 6 }, { x: 13, y: 6 },
    // Right column (24-29)
    { x: 14, y: 8 }, { x: 14, y: 9 }, { x: 14, y: 10 }, { x: 14, y: 11 }, { x: 14, y: 12 }, { x: 14, y: 13 },
    // Bottom right to center (30-35)
    { x: 13, y: 14 }, { x: 12, y: 14 }, { x: 11, y: 14 }, { x: 10, y: 14 }, { x: 9, y: 14 }, { x: 8, y: 14 },
    // Right column up (36-41)
    { x: 8, y: 13 }, { x: 8, y: 12 }, { x: 8, y: 11 }, { x: 8, y: 10 }, { x: 8, y: 9 }, { x: 8, y: 8 },
    // Top row left (42-47)
    { x: 6, y: 8 }, { x: 5, y: 8 }, { x: 4, y: 8 }, { x: 3, y: 8 }, { x: 2, y: 8 }, { x: 1, y: 8 },
    // Left column down (48-51)
    { x: 6, y: 9 }, { x: 6, y: 10 }, { x: 6, y: 11 }, { x: 6, y: 12 },
  ];
  
  return positions[position] || { x: 0, y: 0 };
};

export const getHomePositions = (color: string): Position[] => {
  const homes = {
    red: [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
    blue: [{ x: 12, y: 1 }, { x: 13, y: 1 }, { x: 12, y: 2 }, { x: 13, y: 2 }],
    green: [{ x: 12, y: 12 }, { x: 13, y: 12 }, { x: 12, y: 13 }, { x: 13, y: 13 }],
    yellow: [{ x: 1, y: 12 }, { x: 2, y: 12 }, { x: 1, y: 13 }, { x: 2, y: 13 }]
  };
  return homes[color as keyof typeof homes] || [];
};

export const getStartPosition = (color: string): number => {
  const starts = { red: 0, blue: 13, green: 26, yellow: 39 };
  return starts[color as keyof typeof starts] || 0;
};

export const getHomeRunStart = (color: string): number => {
  const homeRuns = { red: 51, blue: 12, green: 25, yellow: 38 };
  return homeRuns[color as keyof typeof homeRuns] || 51;
};

export const canTokenMove = (token: Token, diceValue: number, gameState: any): boolean => {
  if (token.isFinished || token.isFrozen) return false;
  
  // Token at home can only move with 6
  if (token.position === -1 && diceValue !== 6) return false;
  
  // Check if move would exceed home run
  if (token.isInHomeRun) {
    const homeRunPosition = token.position - 56;
    return homeRunPosition + diceValue <= 5;
  }
  
  return true;
};

export const calculateNewPosition = (token: Token, diceValue: number, playerColor: string): number => {
  if (token.position === -1) {
    return getStartPosition(playerColor);
  }
  
  if (token.isInHomeRun) {
    return token.position + diceValue;
  }
  
  const homeRunStart = getHomeRunStart(playerColor);
  const newPos = (token.position + diceValue) % 52;
  
  // Check if entering home run
  if (token.position <= homeRunStart && newPos > homeRunStart) {
    const excess = newPos - homeRunStart;
    return 56 + excess; // Home run positions start at 56
  }
  
  return newPos;
};

export const isPositionSafe = (position: number): boolean => {
  return SAFE_POSITIONS.includes(position);
};

export const isPowerUpPosition = (position: number): boolean => {
  return POWER_UP_POSITIONS.includes(position);
};

export const isTrapPosition = (position: number): boolean => {
  return TRAP_POSITIONS.includes(position);
};

export const generatePowerUp = (): PowerUp => {
  const types = ['shield', 'speed', 'teleport', 'swap'] as const;
  const positions = POWER_UP_POSITIONS;
  
  return {
    type: types[Math.floor(Math.random() * types.length)],
    position: positions[Math.floor(Math.random() * positions.length)],
    isActive: true
  };
};

export const calculatePoints = (action: string, context: any = {}): number => {
  switch (action) {
    case 'kill':
      return 10;
    case 'finish_token':
      return 5;
    case 'complete_round':
      return 2;
    case 'get_killed':
      return -5;
    default:
      return 0;
  }
};

export const checkWinCondition = (player: Player): boolean => {
  return player.tokens.every(token => token.isFinished);
};

export const getTokensAtPosition = (players: Player[], position: number): Token[] => {
  const tokens: Token[] = [];
  players.forEach(player => {
    player.tokens.forEach(token => {
      if (token.position === position && !token.isFinished) {
        tokens.push(token);
      }
    });
  });
  return tokens;
};

export const canKillToken = (attackerToken: Token, defenderToken: Token, isKillZoneActive: boolean): boolean => {
  // Can't kill if defender has shield
  if (defenderToken.hasShield) return false;
  
  // Can't kill if on safe position (unless kill zone is active)
  if (isPositionSafe(defenderToken.position) && !isKillZoneActive) return false;
  
  // Different players (unless kill zone allows team kills)
  return attackerToken.playerId !== defenderToken.playerId;
};

export const formatTime = (seconds: number): string => {
  return `${seconds}s`;
};

export const rollDice = (): number => {
  return Math.floor(Math.random() * 6) + 1;
};

export const createToken = (id: string, playerId: string): Token => {
  return {
    id,
    playerId,
    position: -1,
    isInHomeRun: false,
    isFinished: false,
    hasShield: false,
    shieldTurns: 0,
    isFrozen: false,
    frozenTurns: 0
  };
};

export const createPlayer = (id: string, name: string, color: string): Player => {
  return {
    id,
    name,
    color: color as any,
    tokens: Array.from({ length: 4 }, (_, i) => createToken(`${id}_${i}`, id)),
    kills: 0,
    points: 0,
    isReady: false,
    moveTimeLeft: 0
  };
};