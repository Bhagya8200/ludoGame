// src/types/game.ts
export interface Position {
  x: number;
  y: number;
}

export interface Token {
  id: string;
  playerId: string;
  position: number; // 0-56 for board positions, -1 for home
  isInHome: boolean;
  isFinished: boolean;
  shield: number; // turns remaining
  speedBoost: boolean;
  frozen: number; // turns remaining
}

export interface PowerUp {
  type: 'shield' | 'speed' | 'teleport' | 'swap';
  name: string;
  description: string;
  icon: string;
}

export interface Player {
  id: string;
  name: string;
  color: 'red' | 'blue' | 'green' | 'yellow';
  tokens: Token[];
  score: number;
  kills: number;
  isOnline: boolean;
}

export interface GameRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  votes: number;
}

export interface GameState {
  id: string;
  players: Player[];
  currentPlayer: number;
  dice: number;
  turnCount: number;
  gamePhase: 'waiting' | 'voting' | 'playing' | 'finished';
  rules: GameRule[];
  powerUpCells: number[];
  trapCells: number[];
  killZoneActive: boolean;
  timeLeft: number;
  winner?: string;
}

export interface GameAction {
  type: 'MOVE_TOKEN' | 'ROLL_DICE' | 'USE_POWER_UP' | 'VOTE_RULE' | 'JOIN_GAME' | 'START_GAME' | 'TIME_UP';
  payload: any;
  playerId: string;
}

export interface TrapZone {
  position: number;
  type: 'stepBack' | 'freeze';
}

export const POWER_UPS: PowerUp[] = [
  {
    type: 'shield',
    name: 'Shield',
    description: "Token can't be killed for 2 turns",
    icon: '🛡️'
  },
  {
    type: 'speed',
    name: 'Speed Boost',
    description: 'Move 2x on your next move',
    icon: '⚡'
  },
  {
    type: 'teleport',
    name: 'Teleport',
    description: 'Move to any unoccupied cell',
    icon: '🌀'
  },
  {
    type: 'swap',
    name: 'Swap',
    description: 'Swap positions with opponent',
    icon: '🔄'
  }
];

export const GAME_RULES: GameRule[] = [
  {
    id: 'powerUps',
    name: 'Power-Ups',
    description: 'Enable special abilities from dice rolls',
    enabled: true,
    votes: 0
  },
  {
    id: 'reverseKill',
    name: 'Reverse Kill',
    description: 'Killing when behind sends you home instead',
    enabled: true,
    votes: 0
  },
  {
    id: 'timedMoves',
    name: 'Timed Moves',
    description: '10 seconds per move',
    enabled: true,
    votes: 0
  },
  {
    id: 'trapZones',
    name: 'Trap Zones',
    description: 'Dangerous cells that hinder movement',
    enabled: true,
    votes: 0
  },
  {
    id: 'killZone',
    name: 'Kill Zone Mode',
    description: 'Central area becomes dangerous every 15 turns',
    enabled: true,
    votes: 0
  },
  {
    id: 'pointsSystem',
    name: 'Points System',
    description: 'Score points for kills and completions',
    enabled: true,
    votes: 0
  }
];

export const BOARD_POSITIONS = {
  HOME_AREAS: {
    red: [0, 1, 6, 7],
    blue: [8, 9, 14, 15],
    green: [64, 65, 70, 71],
    yellow: [56, 57, 62, 63]
  },
  START_POSITIONS: {
    red: 1,
    blue: 14,
    green: 27,
    yellow: 40
  },
  HOME_PATHS: {
    red: [51, 52, 53, 54, 55, 56],
    blue: [12, 13, 20, 21, 28, 29],
    green: [25, 26, 33, 34, 41, 42],
    yellow: [38, 39, 46, 47, 4, 5]
  }
};