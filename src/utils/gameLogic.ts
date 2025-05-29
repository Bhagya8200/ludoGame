// src/utils/gameLogic.ts
import { Position, Token, Player } from '../types/game';

export const getBoardPosition = (index: number): Position => {
  // Convert board index to x,y coordinates
  const boardSize = 15;
  
  // Define the path around the board
  const path: Position[] = [];
  
  // Top row (left to right)
  for (let i = 0; i < 6; i++) {
    path.push({ x: i, y: 0 });
  }
  
  // Right column (top to bottom)
  for (let i = 1; i < 6; i++) {
    path.push({ x: 5, y: i });
  }
  
  // And so on... This is a simplified version
  // You'd need to complete the full Ludo board path
  
  return path[index % path.length] || { x: 0, y: 0 };
};

export const getHomePositions = (color: string): Position[] => {
  const positions: Record<string, Position[]> = {
    red: [
      { x: 1, y: 1 }, { x: 2, y: 1 },
      { x: 1, y: 2 }, { x: 2, y: 2 }
    ],
    blue: [
      { x: 12, y: 1 }, { x: 13, y: 1 },
      { x: 12, y: 2 }, { x: 13, y: 2 }
    ],
    green: [
      { x: 12, y: 12 }, { x: 13, y: 12 },
      { x: 12, y: 13 }, { x: 13, y: 13 }
    ],
    yellow: [
      { x: 1, y: 12 }, { x: 2, y: 12 },
      { x: 1, y: 13 }, { x: 2, y: 13 }
    ]
  };
  
  return positions[color] || [];
};

export const getStartPosition = (color: string): Position => {
  const positions: Record<string, Position> = {
    red: { x: 1, y: 6 },
    blue: { x: 8, y: 1 },
    green: { x: 13, y: 8 },
    yellow: { x: 6, y: 13 }
  };
  
  return positions[color] || { x: 0, y: 0 };
};

export const canTokenMove = (token: Token, diceValue: number): boolean => {
  if (token.isFinished || token.frozen > 0) return false;
  
  if (token.isInHome) {
    return diceValue === 6;
  }
  
  return true;
};

export const calculateNewPosition = (currentPosition: number, steps: number, isSpeedBoost: boolean): number => {
  const actualSteps = isSpeedBoost ? steps * 2 : steps;
  return (currentPosition + actualSteps) % 52;
};

export const isPositionSafe = (position: number): boolean => {
  // Define safe positions (star positions in traditional Ludo)
  const safePositions = [1, 9, 14, 22, 27, 35, 40, 48];
  return safePositions.includes(position);
};

export const getPlayerByColor = (players: Player[], color: string): Player | undefined => {
  return players.find(player => player.color === color);
};

export const isInCentralArea = (position: number): boolean => {
  // Define central area positions for kill zone mode
  const centralPositions = [24, 25, 26, 31, 32, 33, 38, 39, 40];
  return centralPositions.includes(position);
};

export const formatTime = (seconds: number): string => {
  return `${seconds}s`;
};

export const calculateScore = (player: Player): number => {
  let score = player.score;
  
  // Add bonus for finished tokens
  const finishedTokens = player.tokens.filter(t => t.isFinished).length;
  score += finishedTokens * 5;
  
  // Add bonus for tokens out of home
  const tokensOutOfHome = player.tokens.filter(t => !t.isInHome && !t.isFinished).length;
  score += tokensOutOfHome * 2;
  
  return score;
};

export const getWinMessage = (winner: Player, isPointsWin: boolean): string => {
  if (isPointsWin) {
    return `🎉 ${winner.name} wins with ${winner.score} points!`;
  } else {
    return `🎉 ${winner.name} wins by getting all tokens home!`;
  }
};

export const shouldActivateKillZone = (turnCount: number): boolean => {
  return turnCount > 0 && turnCount % 15 === 0;
};