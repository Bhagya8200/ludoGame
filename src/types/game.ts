// File: src/types/game.ts
export enum PlayerColor {
  RED = 'red',
  GREEN = 'green',
  BLUE = 'blue',
  YELLOW = 'yellow'
}

export enum PowerUpType {
  SHIELD = 'shield',
  SPEED_BOOST = 'speed_boost',
  TELEPORT = 'teleport',
  SWAP = 'swap'
}

export enum CellType {
  NORMAL = 'normal',
  SAFE = 'safe',
  HOME = 'home',
  START = 'start',
  FINISH = 'finish',
  TRAP = 'trap',
  POWER_UP = 'power_up'
}

export interface Position {
  x: number;
  y: number;
}

export interface Token {
  id: string;
  color: PlayerColor;
  position: number; // -1 for home, 0-51 for board positions, 52+ for finish area
  isActive: boolean;
  powerUps: {
    shield: number; // turns remaining
    speedBoost: boolean;
    frozen: number; // turns remaining
  };
}

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  tokens: Token[];
  kills: number;
  points: number;
  isReady: boolean;
  timeLeft: number; // seconds for current turn
}

export interface Cell {
  position: number;
  type: CellType;
  color?: PlayerColor;
  powerUp?: PowerUpType;
  isTrap?: boolean;
  occupiedBy?: string[]; // token IDs
}

export interface GameRules {
  powerUps: boolean;
  reverseKill: boolean;
  timedMoves: boolean;
  trapZones: boolean;
  killZoneMode: boolean;
  pointsSystem: boolean;
  moveTimeLimit: number; // seconds
  killZoneInterval: number; // turns
}

export interface GameState {
  id: string;
  players: Player[];
  currentPlayerIndex: number;
  board: Cell[];
  dice: number;
  diceRolled: boolean;
  gameStarted: boolean;
  gameEnded: boolean;
  winner?: string;
  rules: GameRules;
  turnCount: number;
  killZoneActive: boolean;
  lastMove?: {
    playerId: string;
    tokenId: string;
    from: number;
    to: number;
    killed?: string[];
  };
}

export interface RoomState {
  id: string;
  players: Player[];
  maxPlayers: number;
  gameState?: GameState;
  ruleVotes: Record<keyof GameRules, Record<string, boolean>>; // playerId -> vote
  allPlayersReady: boolean;
}

// Socket Events
export interface ServerToClientEvents {
  roomJoined: (room: RoomState) => void;
  playerJoined: (player: Player) => void;
  playerLeft: (playerId: string) => void;
  gameStarted: (gameState: GameState) => void;
  gameUpdated: (gameState: GameState) => void;
  diceRolled: (dice: number, playerId: string) => void;
  tokenMoved: (move: {
    playerId: string;
    tokenId: string;
    from: number;
    to: number;
    killed?: string[];
  }) => void;
  playerTurnTimeout: (playerId: string) => void;
  gameEnded: (winner: Player, finalScores: Player[]) => void;
  ruleVoteUpdated: (votes: Record<keyof GameRules, Record<string, boolean>>) => void;
  error: (message: string) => void;
}

export interface ClientToServerEvents {
  createRoom: (playerName: string, callback: (roomId: string) => void) => void;
  joinRoom: (roomId: string, playerName: string, callback: (success: boolean) => void) => void;
  leaveRoom: () => void;
  rollDice: () => void;
  moveToken: (tokenId: string, targetPosition: number) => void;
  usePowerUp: (powerUp: PowerUpType, targetData?: any) => void;
  voteRule: (rule: keyof GameRules, vote: boolean) => void;
  playerReady: () => void;
  startGame: () => void;
}

// File: src/types/board.ts
export interface BoardPosition {
  x: number;
  y: number;
  isCorner: boolean;
  isSafe: boolean;
  color?: PlayerColor;
}

export const BOARD_SIZE = 15;
export const CELL_SIZE = 40;

// Board layout constants
export const HOME_POSITIONS: Record<PlayerColor, Position[]> = {
  [PlayerColor.RED]: [
    { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }
  ],
  [PlayerColor.GREEN]: [
    { x: 12, y: 1 }, { x: 13, y: 1 }, { x: 12, y: 2 }, { x: 13, y: 2 }
  ],
  [PlayerColor.YELLOW]: [
    { x: 12, y: 12 }, { x: 13, y: 12 }, { x: 12, y: 13 }, { x: 13, y: 13 }
  ],
  [PlayerColor.BLUE]: [
    { x: 1, y: 12 }, { x: 2, y: 12 }, { x: 1, y: 13 }, { x: 2, y: 13 }
  ]
};

export const START_POSITIONS: Record<PlayerColor, Position> = {
  [PlayerColor.RED]: { x: 1, y: 6 },
  [PlayerColor.GREEN]: { x: 8, y: 1 },
  [PlayerColor.YELLOW]: { x: 13, y: 8 },
  [PlayerColor.BLUE]: { x: 6, y: 13 }
};

export const FINISH_POSITIONS: Record<PlayerColor, Position[]> = {
  [PlayerColor.RED]: [
    { x: 2, y: 7 }, { x: 3, y: 7 }, { x: 4, y: 7 }, { x: 5, y: 7 }, { x: 6, y: 7 }
  ],
  [PlayerColor.GREEN]: [
    { x: 7, y: 2 }, { x: 7, y: 3 }, { x: 7, y: 4 }, { x: 7, y: 5 }, { x: 7, y: 6 }
  ],
  [PlayerColor.YELLOW]: [
    { x: 12, y: 7 }, { x: 11, y: 7 }, { x: 10, y: 7 }, { x: 9, y: 7 }, { x: 8, y: 7 }
  ],
  [PlayerColor.BLUE]: [
    { x: 7, y: 12 }, { x: 7, y: 11 }, { x: 7, y: 10 }, { x: 7, y: 9 }, { x: 7, y: 8 }
  ]
};

// Path positions for each color (52 positions total per color)
export const BOARD_PATH: Position[] = [
  // Starting from red start, going clockwise
  { x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 },
  { x: 6, y: 5 }, { x: 6, y: 4 }, { x: 6, y: 3 }, { x: 6, y: 2 }, { x: 6, y: 1 },
  { x: 6, y: 0 }, { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 8, y: 1 }, { x: 8, y: 2 },
  { x: 8, y: 3 }, { x: 8, y: 4 }, { x: 8, y: 5 }, { x: 9, y: 6 }, { x: 10, y: 6 },
  { x: 11, y: 6 }, { x: 12, y: 6 }, { x: 13, y: 6 }, { x: 14, y: 6 }, { x: 14, y: 7 },
  { x: 14, y: 8 }, { x: 13, y: 8 }, { x: 12, y: 8 }, { x: 11, y: 8 }, { x: 10, y: 8 },
  { x: 9, y: 8 }, { x: 8, y: 9 }, { x: 8, y: 10 }, { x: 8, y: 11 }, { x: 8, y: 12 },
  { x: 8, y: 13 }, { x: 8, y: 14 }, { x: 7, y: 14 }, { x: 6, y: 14 }, { x: 6, y: 13 },
  { x: 6, y: 12 }, { x: 6, y: 11 }, { x: 6, y: 10 }, { x: 6, y: 9 }, { x: 5, y: 8 },
  { x: 4, y: 8 }, { x: 3, y: 8 }, { x: 2, y: 8 }, { x: 1, y: 8 }, { x: 0, y: 8 },
  { x: 0, y: 7 }, { x: 0, y: 6 }, { x: 1, y: 6 } // Back to start
];

export const SAFE_POSITIONS = [0, 8, 13, 21, 26, 34, 39, 47]; // Safe spots on the board