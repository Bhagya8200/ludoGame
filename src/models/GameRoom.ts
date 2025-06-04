import mongoose, { Schema, Document } from "mongoose";

export interface IToken extends Document {
  id: string;
  playerId: string;
  position: number;
  isInHomeRun: boolean;
  isFinished: boolean;
  hasShield: boolean;
  shieldTurns: number;
  isFrozen: boolean;
  frozenTurns: number;
}

export interface IPlayer extends Document {
  id: string;
  name: string;
  color: "red" | "blue" | "green" | "yellow";
  tokens: IToken[];
  kills: number;
  points: number;
  isReady: boolean;
  moveTimeLeft: number;
  socketId?: string;
  lastSeen: Date;
}

export interface IPowerUp extends Document {
  type: "shield" | "speed" | "teleport" | "swap";
  position: number;
  isActive: boolean;
  id: string;
  createdAt: Date;
}

export interface IGameMove extends Document {
  playerId: string;
  tokenId: string;
  fromPosition: number;
  toPosition: number;
  diceValue: number;
  timestamp: Date;
  moveType: "normal" | "kill" | "powerup" | "homerun";
  pointsEarned: number;
  killedTokenId?: string;
  powerUpUsed?: string;
}

export interface IGameRoom extends Document {
  roomId: string;
  players: IPlayer[];
  currentPlayerIndex: number;
  diceValue: number;
  canRollDice: boolean;
  gameStarted: boolean;
  gameEnded: boolean;
  winner: string | null;
  turnCount: number;
  powerUps: IPowerUp[];
  trapZones: number[];
  lastRollTime: Date;
  moves: IGameMove[];
  createdAt: Date;
  updatedAt: Date;
  settings: {
    timedMoves: boolean;
    moveTimeLimit: number;
    powerUpsEnabled: boolean;
    trapZonesEnabled: boolean;
    pointsSystemEnabled: boolean;
  };
}

const TokenSchema = new Schema<IToken>({
  id: { type: String, required: true },
  playerId: { type: String, required: true },
  position: { type: Number, default: -1 },
  isInHomeRun: { type: Boolean, default: false },
  isFinished: { type: Boolean, default: false },
  hasShield: { type: Boolean, default: false },
  shieldTurns: { type: Number, default: 0 },
  isFrozen: { type: Boolean, default: false },
  frozenTurns: { type: Number, default: 0 },
});

const PlayerSchema = new Schema<IPlayer>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  color: {
    type: String,
    enum: ["red", "blue", "green", "yellow"],
    required: true,
  },
  tokens: [TokenSchema],
  kills: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  isReady: { type: Boolean, default: false },
  moveTimeLeft: { type: Number, default: 0 },
  socketId: { type: String },
  lastSeen: { type: Date, default: Date.now },
});

const PowerUpSchema = new Schema<IPowerUp>({
  type: {
    type: String,
    enum: ["shield", "speed", "teleport", "swap"],
    required: true,
  },
  position: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  id: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const GameMoveSchema = new Schema<IGameMove>({
  playerId: { type: String, required: true },
  tokenId: { type: String, required: true },
  fromPosition: { type: Number, required: true },
  toPosition: { type: Number, required: true },
  diceValue: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  moveType: {
    type: String,
    enum: ["normal", "kill", "powerup", "homerun"],
    default: "normal",
  },
  pointsEarned: { type: Number, default: 0 },
  killedTokenId: { type: String },
  powerUpUsed: { type: String },
});

const GameRoomSchema = new Schema<IGameRoom>(
  {
    roomId: { type: String, required: true, unique: true },
    players: [PlayerSchema],
    currentPlayerIndex: { type: Number, default: 0 },
    diceValue: { type: Number, default: 0 },
    canRollDice: { type: Boolean, default: false },
    gameStarted: { type: Boolean, default: false },
    gameEnded: { type: Boolean, default: false },
    winner: { type: String, default: null },
    turnCount: { type: Number, default: 0 },
    powerUps: [PowerUpSchema],
    trapZones: [{ type: Number }],
    lastRollTime: { type: Date, default: Date.now },
    moves: [GameMoveSchema],
    settings: {
      timedMoves: { type: Boolean, default: true },
      moveTimeLimit: { type: Number, default: 15 },
      powerUpsEnabled: { type: Boolean, default: true },
      trapZonesEnabled: { type: Boolean, default: true },
      pointsSystemEnabled: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better performance
// GameRoomSchema.index({ roomId: 1 });
GameRoomSchema.index({ "players.id": 1 });
GameRoomSchema.index({ "players.socketId": 1 });
GameRoomSchema.index({ createdAt: 1 });

export const GameRoom = mongoose.model<IGameRoom>("GameRoom", GameRoomSchema);
