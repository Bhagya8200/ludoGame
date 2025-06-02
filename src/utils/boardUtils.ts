// utils.ts
import { LeafyGreen } from "lucide-react";
import type { Position, Token, Player, PowerUp } from "../types/game";

export const BOARD_SIZE = 15;
export const COLORS = ["red", "blue", "green", "yellow"] as const;

// White grid positions on both sides of home run paths
export const getWhiteGridPositions = (): Position[] => {
  return [
    // White grids around RED home run path (horizontal row 7)
    // Above red home run (row 6)

    { x: 2, y: 6 },
    { x: 3, y: 6 },
    { x: 4, y: 6 },
    { x: 5, y: 6 },
    { x: 6, y: 6 },

    // Below red home run (row 8)
    { x: 1, y: 8 },
    { x: 2, y: 8 },
    { x: 3, y: 8 },
    { x: 4, y: 8 },
    { x: 5, y: 8 },
    { x: 6, y: 8 },

    // White grids around GREEN home run path (vertical column 7)
    // Left of green home run (column 6)
    { x: 6, y: 1 },
    { x: 6, y: 2 },
    { x: 6, y: 3 },
    { x: 6, y: 4 },
    { x: 6, y: 5 },
    { x: 6, y: 6 },

    // Right of green home run (column 8)

    { x: 8, y: 2 },
    { x: 8, y: 3 },
    { x: 8, y: 4 },
    { x: 8, y: 5 },
    { x: 8, y: 6 },

    // White grids around YELLOW home run path (horizontal row 7)
    // Above yellow home run (row 6)
    { x: 8, y: 6 },
    { x: 9, y: 6 },
    { x: 10, y: 6 },
    { x: 11, y: 6 },
    { x: 12, y: 6 },
    { x: 13, y: 6 },

    // Below yellow home run (row 8)
    { x: 8, y: 8 },
    { x: 9, y: 8 },
    { x: 10, y: 8 },
    { x: 11, y: 8 },
    { x: 12, y: 8 },

    // White grids around BLUE home run path (vertical column 7)
    // Left of blue home run (column 6)
    { x: 6, y: 8 },
    { x: 6, y: 9 },
    { x: 6, y: 10 },
    { x: 6, y: 11 },
    { x: 6, y: 12 },

    // Right of blue home run (column 8)
    { x: 8, y: 8 },
    { x: 8, y: 9 },
    { x: 8, y: 10 },
    { x: 8, y: 11 },
    { x: 8, y: 12 },
    { x: 8, y: 13 },
  ];
};

// Home run paths - colored according to their respective colors
export const getHomeRunPositions = () => {
  return {
    // Red home run path (horizontal)
    red: [
      { x: 1, y: 6 },
      { x: 1, y: 7 },
      { x: 2, y: 7 },
      { x: 3, y: 7 },
      { x: 4, y: 7 },
      { x: 5, y: 7 },
      { x: 6, y: 7 },
    ],
    // Green home run path (vertical)
    green: [
      { x: 8, y: 1 },
      { x: 7, y: 1 },
      { x: 7, y: 2 },
      { x: 7, y: 3 },
      { x: 7, y: 4 },
      { x: 7, y: 5 },
      { x: 7, y: 6 },
    ],
    // Yellow home run path (horizontal)
    yellow: [
      { x: 13, y: 8 },
      { x: 8, y: 7 },
      { x: 9, y: 7 },
      { x: 10, y: 7 },
      { x: 11, y: 7 },
      { x: 12, y: 7 },
      { x: 13, y: 7 },
    ],
    // Blue home run path (vertical)
    blue: [
      { x: 6, y: 13 },
      { x: 7, y: 8 },
      { x: 7, y: 9 },
      { x: 7, y: 10 },
      { x: 7, y: 11 },
      { x: 7, y: 12 },
      { x: 7, y: 13 },
    ],
  };
};

// Home positions - the 2x2 squares in each colored corner
export const getHomePositions = (color: string): Position[] => {
  const homes = {
    // Red home area (bottom-left 2x2 square)
    red: [
      { x: 2, y: 10 },
      { x: 3.5, y: 10 }, // Top row of red home
      { x: 2, y: 11.5 },
      { x: 3.5, y: 11.5 }, // Bottom row of red home
    ],
    // Green home area (top-right 2x2 square)
    green: [
      { x: 11, y: 3 },
      { x: 12.5, y: 3 }, // Top row of green home
      { x: 11, y: 4.5 },
      { x: 12.5, y: 4.5 }, // Bottom row of green home
    ],
    // Yellow home area (bottom-right 2x2 square)
    yellow: [
      { x: 11, y: 10 },
      { x: 12.5, y: 10 }, // Top row of yellow home
      { x: 11, y: 11.5 },
      { x: 12.5, y: 11.5 }, // Bottom row of yellow home
    ],
    // Blue home area (top-left 2x2 square)
    blue: [
      { x: 2, y: 3 },
      { x: 3.5, y: 3 }, // Top row of blue home
      { x: 2, y: 4.5 },
      { x: 3.5, y: 4.5 }, // Bottom row of blue home
    ],
  };
  return homes[color as keyof typeof homes] || [];
};

// Starting positions - where arrows point (entrance to main track)
export const getStartPosition = (color: string): number => {
  const starts = {
    red: 0, // Red arrow at position 0
    green: 13, // Green arrow at position 13
    yellow: 26, // Yellow arrow at position 26
    blue: 39, // Blue arrow at position 39
  };
  return starts[color as keyof typeof starts] || 0;
};

// Home run entrance positions
export const getHomeRunStart = (color: string): number => {
  const homeRuns = {
    red: 51, // Red enters home run after completing lap
    green: 12, // Green enters home run after position 12
    yellow: 38, // Yellow enters home run after position 38
    blue: 51, // Blue enters home run after position 51
  };
  return homeRuns[color as keyof typeof homeRuns] || 51;
};

// Safe positions (traditionally marked with stars)
export const SAFE_POSITIONS = [7, 14, 21, 27, 34, 40, 47];

// Power-up positions
export const POWER_UP_POSITIONS = [5, 17, 31, 43];

// Trap positions
export const TRAP_POSITIONS = [11, 25, 37, 50];

export const canTokenMove = (
  token: Token,
  diceValue: number,
  gameState: any
): boolean => {
  if (token.isFinished || token.isFrozen) return false;

  // Token at home can only move with 6
  if (token.position === -1 && diceValue !== 6) return false;

  // Check if move would exceed home run
  if (token.isInHomeRun) {
    const homeRunPosition = token.position - 53; // Home runs start at 53
    return homeRunPosition + diceValue <= 5;
  }

  return true;
};

export const calculateNewPosition = (
  token: Token,
  diceValue: number,
  playerColor: string
): number => {
  if (token.position === -1) {
    return getStartPosition(playerColor);
  }

  if (token.isInHomeRun) {
    return token.position + diceValue;
  }

  const homeRunStart = getHomeRunStart(playerColor);
  let newPos = token.position + diceValue;

  // Handle wrapping around the main track (53 positions: 0-52)
  if (newPos > 52) {
    newPos = newPos - 53; // Wrap around
  }

  // Check if entering home run
  if (token.position <= homeRunStart && newPos > homeRunStart) {
    const excess = newPos - homeRunStart - 1;
    const homeRunStartPos =
      playerColor === "red"
        ? 53
        : playerColor === "green"
        ? 58
        : playerColor === "yellow"
        ? 63
        : 68;
    return homeRunStartPos + excess;
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
  const types = ["shield", "speed", "teleport", "swap"] as const;
  const positions = POWER_UP_POSITIONS;

  return {
    type: types[Math.floor(Math.random() * types.length)],
    position: positions[Math.floor(Math.random() * positions.length)],
    isActive: true,
  };
};

export const calculatePoints = (action: string, context: any = {}): number => {
  switch (action) {
    case "kill":
      return 10;
    case "finish_token":
      return 5;
    case "complete_round":
      return 2;
    case "get_killed":
      return -5;
    default:
      return 0;
  }
};

export const checkWinCondition = (player: Player): boolean => {
  return player.tokens.every((token) => token.isFinished);
};

export const getTokensAtPosition = (
  players: Player[],
  position: number
): Token[] => {
  const tokens: Token[] = [];
  players.forEach((player) => {
    player.tokens.forEach((token) => {
      if (token.position === position && !token.isFinished) {
        tokens.push(token);
      }
    });
  });
  return tokens;
};

export const canKillToken = (
  attackerToken: Token,
  defenderToken: Token,
): boolean => {
  // Can't kill if defender has shield
  if (defenderToken.hasShield) return false;

  // Can't kill if on safe position (unless kill zone is active)
  if (isPositionSafe(defenderToken.position)) return false;

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
    frozenTurns: 0,
  };
};

export const createPlayer = (
  id: string,
  name: string,
  color: string
): Player => {
  return {
    id,
    name,
    color: color as any,
    tokens: Array.from({ length: 4 }, (_, i) => createToken(`${id}_${i}`, id)),
    kills: 0,
    points: 0,
    isReady: false,
    moveTimeLeft: 0,
  };
};
