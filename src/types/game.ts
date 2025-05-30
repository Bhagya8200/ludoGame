// types.ts
export interface Position {
  x: number;
  y: number;
}

export interface Token {
  id: string;
  playerId: string;
  position: number; // -1 for home, 0-55 for board positions, 56+ for home path
  isInHomeRun: boolean;
  isFinished: boolean;
  hasShield: boolean;
  shieldTurns: number;
  isFrozen: boolean;
  frozenTurns: number;
}

export interface PowerUp {
  type: 'shield' | 'speed' | 'teleport' | 'swap';
  position: number;
  isActive: boolean;
}

export interface Player {
  id: string;
  name: string;
  color: 'red' | 'blue' | 'green' | 'yellow';
  tokens: Token[];
  kills: number;
  points: number;
  isReady: boolean;
  moveTimeLeft: number;
}

export interface GameState {
  id: string;
  players: Player[];
  currentPlayerIndex: number;
  diceValue: number;
  canRollDice: boolean;
  gameStarted: boolean;
  gameEnded: boolean;
  winner: string | null;
  turnCount: number;
  isKillZoneActive: boolean;
  powerUps: PowerUp[];
  trapZones: number[];
  lastRollTime: number;
}

export interface GameSettings {
  timedMoves: boolean;
  moveTimeLimit: number; // seconds
  powerUpsEnabled: boolean;
  trapZonesEnabled: boolean;
  reverseKillEnabled: boolean;
  pointsSystemEnabled: boolean;
}

export interface MoveResult {
  success: boolean;
  killedToken?: Token;
  powerUpActivated?: PowerUp;
  pointsEarned: number;
  message?: string;
}

export interface SocketEvents {
  // Client to Server
  joinRoom: (roomId: string, playerName: string) => void;
  rollDice: (roomId: string) => void;
  moveToken: (roomId: string, tokenId: string) => void;
  usePowerUp: (roomId: string, powerUpType: string, targetData: any) => void;
  playerReady: (roomId: string) => void;
  
  // Server to Client
  gameStateUpdate: (gameState: GameState) => void;
  playerJoined: (player: Player) => void;
  playerLeft: (playerId: string) => void;
  diceRolled: (value: number, playerId: string) => void;
  tokenMoved: (result: MoveResult) => void;
  gameStarted: () => void;
  gameEnded: (winner: Player) => void;
  timeWarning: (timeLeft: number) => void;
  turnSkipped: (playerId: string) => void;
  killZoneActivated: () => void;
  powerUpSpawned: (powerUp: PowerUp) => void;
  error: (message: string) => void;
}