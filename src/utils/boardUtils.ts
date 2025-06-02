// utils/boardUtils.ts
import type { Position, Token, Player, PowerUp } from "../types/game";

export const BOARD_SIZE = 15;
export const COLORS = ["red", "blue", "green", "yellow"] as const;

// White grid positions on both sides of home run paths
export const getWhiteGridPositions = (): Position[] => {
  return [
    { x: 1, y: 6 },
    { x: 2, y: 6 },
    { x: 3, y: 6 },
    { x: 4, y: 6 },
    { x: 5, y: 6 },
    { x: 6, y: 6 },

    { x: 1, y: 8 },
    { x: 2, y: 8 },
    { x: 3, y: 8 },
    { x: 4, y: 8 },
    { x: 5, y: 8 },
    { x: 6, y: 8 },

    { x: 6, y: 1 },
    { x: 6, y: 2 },
    { x: 6, y: 3 },
    { x: 6, y: 4 },
    { x: 6, y: 5 },
    { x: 6, y: 6 },

    { x: 8, y: 1 },
    { x: 8, y: 2 },
    { x: 8, y: 3 },
    { x: 8, y: 4 },
    { x: 8, y: 5 },
    { x: 8, y: 6 },

    { x: 8, y: 6 },
    { x: 9, y: 6 },
    { x: 10, y: 6 },
    { x: 11, y: 6 },
    { x: 12, y: 6 },
    { x: 13, y: 6 },

    { x: 8, y: 8 },
    { x: 9, y: 8 },
    { x: 10, y: 8 },
    { x: 11, y: 8 },
    { x: 12, y: 8 },
    { x: 13, y: 8 },

    { x: 6, y: 8 },
    { x: 6, y: 9 },
    { x: 6, y: 10 },
    { x: 6, y: 11 },
    { x: 6, y: 12 },
    { x: 6, y: 13 },

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
    // Red home run path (going up from bottom)
    red: [
      { x: 7, y: 13 },
      { x: 7, y: 12 },
      { x: 7, y: 11 },
      { x: 7, y: 10 },
      { x: 7, y: 9 },
      { x: 7, y: 8 },
      // { x: 7, y: 7 }, // Center finish
    ],
    // Blue home run path (going right from left)
    blue: [
      { x: 1, y: 7 },
      { x: 2, y: 7 },
      { x: 3, y: 7 },
      { x: 4, y: 7 },
      { x: 5, y: 7 },
      { x: 6, y: 7 },
      // { x: 7, y: 7 }, // Center finish
    ],
    // Green home run path (going down from top)
    green: [
      { x: 7, y: 1 },
      { x: 7, y: 2 },
      { x: 7, y: 3 },
      { x: 7, y: 4 },
      { x: 7, y: 5 },
      { x: 7, y: 6 },
      // { x: 7, y: 7 }, // Center finish
    ],
    // Yellow home run path (going left from right)
    yellow: [
      { x: 13, y: 7 },
      { x: 12, y: 7 },
      { x: 11, y: 7 },
      { x: 10, y: 7 },
      { x: 9, y: 7 },
      { x: 8, y: 7 },
      // { x: 7, y: 7 }, // Center finish
    ],
  };
};

// Home positions - the 2x2 squares in each colored corner
export const getHomePositions = (color: string): Position[] => {
  const homes = {
    red: [
      { x: 2, y: 10 },
      { x: 3.5, y: 10 },
      { x: 2, y: 11.5 },
      { x: 3.5, y: 11.5 },
    ],
    green: [
      { x: 11, y: 3 },
      { x: 12.5, y: 3 },
      { x: 11, y: 4.5 },
      { x: 12.5, y: 4.5 },
    ],
    yellow: [
      { x: 11, y: 10 },
      { x: 12.5, y: 10 },
      { x: 11, y: 11.5 },
      { x: 12.5, y: 11.5 },
    ],
    blue: [
      { x: 2, y: 3 },
      { x: 3.5, y: 3 },
      { x: 2, y: 4.5 },
      { x: 3.5, y: 4.5 },
    ],
  };
  return homes[color as keyof typeof homes] || [];
};

// Main board path positions - following the exact paths from your images
export const getBoardPositions = (): Position[] => {
  return [
    // Red starting area and path (positions 0-12)
    { x: 6, y: 13 }, // 0 - Red start (bottom arrow)
    { x: 6, y: 12 }, // 1
    { x: 6, y: 11 }, // 2
    { x: 6, y: 10 }, // 3
    { x: 6, y: 9 }, // 4
    { x: 6, y: 8 }, // 5
    { x: 5, y: 8 }, // 6 - Turn left
    { x: 4, y: 8 }, // 7
    { x: 3, y: 8 }, // 8
    { x: 2, y: 8 }, // 9
    { x: 1, y: 8 }, // 10
    { x: 1, y: 7 }, // 11 - Turn up
    { x: 1, y: 6 }, // 12 - Blue start area

    // Green starting area and path (positions 13-25)
    { x: 1, y: 6 }, // 13 - Blue start (left arrow)
    { x: 2, y: 6 }, // 14
    { x: 3, y: 6 }, // 15
    { x: 4, y: 6 }, // 16
    { x: 5, y: 6 }, // 17
    { x: 6, y: 6 }, // 18
    { x: 6, y: 5 }, // 19 - Turn up
    { x: 6, y: 4 }, // 20
    { x: 6, y: 3 }, // 21
    { x: 6, y: 2 }, // 22
    { x: 6, y: 1 }, // 23
    { x: 7, y: 1 }, // 24 - Turn right
    { x: 8, y: 1 }, // 25 - Green start area

    // Yellow starting area and path (positions 26-38)
    { x: 8, y: 1 }, // 26 - Green start (top arrow)
    { x: 8, y: 2 }, // 27
    { x: 8, y: 3 }, // 28
    { x: 8, y: 4 }, // 29
    { x: 8, y: 5 }, // 30
    { x: 8, y: 6 }, // 31
    { x: 9, y: 6 }, // 32 - Turn right
    { x: 10, y: 6 }, // 33
    { x: 11, y: 6 }, // 34
    { x: 12, y: 6 }, // 35
    { x: 13, y: 6 }, // 36
    { x: 13, y: 7 }, // 37 - Turn down
    { x: 13, y: 8 }, // 38 - Yellow start area

    // Blue starting area and path (positions 39-51)
    { x: 13, y: 8 }, // 39 - Yellow start (right arrow)
    { x: 12, y: 8 }, // 40
    { x: 11, y: 8 }, // 41
    { x: 10, y: 8 }, // 42
    { x: 9, y: 8 }, // 43
    { x: 8, y: 8 }, // 44
    { x: 8, y: 9 }, // 45 - Turn down
    { x: 8, y: 10 }, // 46
    { x: 8, y: 11 }, // 47
    { x: 8, y: 12 }, // 48
    { x: 8, y: 13 }, // 49
    { x: 7, y: 13 }, // 50 - Turn left
    { x: 6, y: 13 }, // 51 - Back to red start (completes loop)
  ];
};

// Starting positions - where each color starts their journey
export const getStartPosition = (color: string): number => {
  const starts = {
    red: 0, // Red starts at position 0 (bottom)
    blue: 13, // Blue starts at position 13 (left)
    green: 26, // Green starts at position 26 (top)
    yellow: 39, // Yellow starts at position 39 (right)
  };
  return starts[color as keyof typeof starts] || 0;
};

// Home run entrance positions - where tokens enter their home run
export const getHomeRunStart = (color: string): number => {
  const homeRuns = {
    red: 51, // Red enters home run after completing the loop
    blue: 12, // Blue enters home run at position 12
    green: 25, // Green enters home run at position 25
    yellow: 38, // Yellow enters home run at position 38
  };
  return homeRuns[color as keyof typeof homeRuns] || 51;
};

// Safe positions (traditionally marked with stars)
export const SAFE_POSITIONS = [1, 9, 14, 22, 27, 35, 40, 48];

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
    const homeRunPosition = token.position - 56;
    return homeRunPosition + diceValue <= 6; // 7 positions in home run (0-6)
  }

  return true;
};

// export const calculateNewPosition = (
//   token: Token,
//   diceValue: number,
//   playerColor: string
// ): number => {
//   if (token.position === -1) {
//     // Token leaving home
//     return getStartPosition(playerColor);
//   }

//   if (token.isInHomeRun) {
//     // Token moving in home run
//     return token.position + diceValue;
//   }

//   const homeRunStart = getHomeRunStart(playerColor);
//   let newPos = token.position + diceValue;

//   // Handle wrapping around the main track (52 positions: 0-51)
//   if (newPos > 51) {
//     newPos = newPos - 52; // Wrap around
//   }

//   // Check if entering home run
//   if (token.position <= homeRunStart && newPos >= homeRunStart) {
//     // Enter home run
//     const excess = newPos - homeRunStart;
//     return 56 + excess; // Home run starts at position 56
//   }

//   return newPos;
// };

export const calculateNewPosition = (
  token: Token,
  diceValue: number,
  playerColor: string
): number => {
  if (token.position === -1) {
    // Token leaving home
    return getStartPosition(playerColor);
  }

  if (token.isInHomeRun) {
    // Token moving in home run
    return token.position + diceValue;
  }

  const homeRunStart = getHomeRunStart(playerColor);
  let newPos = token.position + diceValue;

  // Check if token has completed a full circuit and should enter home run
  // This is the key fix - we need to check if the token has passed its home run entrance
  if (token.position < homeRunStart && newPos >= homeRunStart) {
    // Token is entering home run for the first time
    const excess = newPos - homeRunStart;
    return 56 + excess; // Home run starts at position 56
  }

  // Handle wrapping around the main track only if not entering home run
  if (newPos > 51) {
    // Check if this wrap-around would cross the home run entrance
    const wrappedPos = newPos - 52;

    // If the wrapped position would be at or past the home run entrance,
    // and the token started before the home run entrance, enter home run
    if (wrappedPos >= homeRunStart && token.position < homeRunStart) {
      const excess = wrappedPos - homeRunStart;
      return 56 + excess;
    }

    // Otherwise, just wrap around normally
    return wrappedPos;
  }

  return newPos;
};

// Helper function to get board position for rendering
export const getBoardPosition = (boardPosition: number): Position => {
  const boardPositions = getBoardPositions();
  return boardPositions[boardPosition] || { x: 7, y: 7 };
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
  defenderToken: Token
): boolean => {
  if (defenderToken.hasShield) return false;
  if (isPositionSafe(defenderToken.position)) return false;
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
