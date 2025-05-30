// utils.ts
import type { Position, Token, Player, PowerUp } from "../types/game";

export const BOARD_SIZE = 15;
export const COLORS = ["red", "blue", "green", "yellow"] as const;

// Coordinates mapped exactly to match the traditional Ludo board image
export const getPositionCoords = (position: number): Position => {
  const positions: Position[] = [
    // RED path starts from red arrow going LEFT across bottom of red section
    { x: 6, y: 8 }, // 0 - Red start (red arrow position)
    { x: 5, y: 8 }, // 1
    { x: 4, y: 8 }, // 2
    { x: 3, y: 8 }, // 3
    { x: 2, y: 8 }, // 4
    { x: 1, y: 8 }, // 5

    // Going UP the left edge
    { x: 1, y: 7 }, // 6
    { x: 1, y: 6 }, // 7 - Safe position (star)
    { x: 1, y: 5 }, // 8
    { x: 1, y: 4 }, // 9
    { x: 1, y: 3 }, // 10
    { x: 1, y: 2 }, // 11
    { x: 1, y: 1 }, // 12

    // GREEN path starts from green arrow going RIGHT across top of green section
    { x: 2, y: 1 }, // 13 - Green start (green arrow position)
    { x: 3, y: 1 }, // 14 - Safe position (star)
    { x: 4, y: 1 }, // 15
    { x: 5, y: 1 }, // 16
    { x: 6, y: 1 }, // 17
    { x: 7, y: 1 }, // 18
    { x: 8, y: 1 }, // 19
    { x: 9, y: 1 }, // 20
    { x: 10, y: 1 }, // 21 - Safe position (star)
    { x: 11, y: 1 }, // 22
    { x: 12, y: 1 }, // 23
    { x: 13, y: 1 }, // 24
    { x: 13, y: 2 }, // 25

    // YELLOW path starts from yellow arrow going DOWN right edge of yellow section
    { x: 13, y: 3 }, // 26 - Yellow start (yellow arrow position)
    { x: 13, y: 4 }, // 27 - Safe position (star)
    { x: 13, y: 5 }, // 28
    { x: 13, y: 6 }, // 29
    { x: 13, y: 7 }, // 30
    { x: 13, y: 8 }, // 31
    { x: 13, y: 9 }, // 32
    { x: 13, y: 10 }, // 33
    { x: 13, y: 11 }, // 34 - Safe position (star)
    { x: 13, y: 12 }, // 35
    { x: 13, y: 13 }, // 36
    { x: 12, y: 13 }, // 37
    { x: 11, y: 13 }, // 38

    // BLUE path starts from blue arrow going LEFT across bottom of blue section
    { x: 10, y: 13 }, // 39 - Blue start (blue arrow position)
    { x: 9, y: 13 }, // 40 - Safe position (star)
    { x: 8, y: 13 }, // 41
    { x: 7, y: 13 }, // 42
    { x: 6, y: 13 }, // 43
    { x: 5, y: 13 }, // 44
    { x: 4, y: 13 }, // 45
    { x: 3, y: 13 }, // 46
    { x: 2, y: 13 }, // 47 - Safe position (star)
    { x: 1, y: 13 }, // 48
    { x: 1, y: 12 }, // 49
    { x: 1, y: 11 }, // 50
    { x: 1, y: 10 }, // 51
    { x: 1, y: 9 }, // 52 - Completing the circle back to red

    // HOME RUN paths - colored columns/rows leading to center

    // RED home run - going RIGHT toward center (red colored column)
    { x: 2, y: 7 }, // 53 - First red home run square
    { x: 3, y: 7 }, // 54
    { x: 4, y: 7 }, // 55
    { x: 5, y: 7 }, // 56
    { x: 6, y: 7 }, // 57 - Red finish (center triangle area)

    // GREEN home run - going DOWN toward center (green colored row)
    { x: 7, y: 2 }, // 58 - First green home run square
    { x: 7, y: 3 }, // 59
    { x: 7, y: 4 }, // 60
    { x: 7, y: 5 }, // 61
    { x: 7, y: 6 }, // 62 - Green finish (center triangle area)

    // YELLOW home run - going LEFT toward center (yellow colored column)
    { x: 12, y: 7 }, // 63 - First yellow home run square
    { x: 11, y: 7 }, // 64
    { x: 10, y: 7 }, // 65
    { x: 9, y: 7 }, // 66
    { x: 8, y: 7 }, // 67 - Yellow finish (center triangle area)

    // BLUE home run - going UP toward center (blue colored row)
    { x: 7, y: 12 }, // 68 - First blue home run square
    { x: 7, y: 11 }, // 69
    { x: 7, y: 10 }, // 70
    { x: 7, y: 9 }, // 71
    { x: 7, y: 8 }, // 72 - Blue finish (center triangle area)
  ];

  return positions[position] || { x: 7, y: 7 };
};

// Home positions - the 2x2 squares in each colored corner
export const getHomePositions = (color: string): Position[] => {
  const homes = {
    // Red home area (bottom-left 2x2 square)
    red: [
      { x: 2, y: 10 },
      { x: 3, y: 10 }, // Top row of red home
      { x: 2, y: 11 },
      { x: 3, y: 11 }, // Bottom row of red home
    ],
    // Green home area (top-right 2x2 square)
    green: [
      { x: 11, y: 3 },
      { x: 12, y: 3 }, // Top row of green home
      { x: 11, y: 4 },
      { x: 12, y: 4 }, // Bottom row of green home
    ],
    // Yellow home area (bottom-right 2x2 square)
    yellow: [
      { x: 11, y: 10 },
      { x: 12, y: 10 }, // Top row of yellow home
      { x: 11, y: 11 },
      { x: 12, y: 11 }, // Bottom row of yellow home
    ],
    // Blue home area (top-left 2x2 square)
    blue: [
      { x: 2, y: 3 },
      { x: 3, y: 3 }, // Top row of blue home
      { x: 2, y: 4 },
      { x: 3, y: 4 }, // Bottom row of blue home
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
  isKillZoneActive: boolean
): boolean => {
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
