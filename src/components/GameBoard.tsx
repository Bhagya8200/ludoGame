// File: src/components/GameBoard.tsx
import React from 'react';
import { PlayerColor, Token, Cell, CellType } from '../types/game.js';
import { BOARD_PATH, HOME_POSITIONS, START_POSITIONS, FINISH_POSITIONS } from '../types/board.js';

interface GameBoardProps {
  board: Cell[];
  players: any[];
  onTokenClick: (tokenId: string) => void;
  onCellClick: (position: number) => void;
  selectedToken?: string;
}

export const GameBoard: React.FC<GameBoardProps> = ({ 
  board, 
  players, 
  onTokenClick, 
  onCellClick, 
  selectedToken 
}) => {
  const getBoardCellColor = (x: number, y: number): string => {
    // Home areas
    if (x >= 1 && x <= 2 && y >= 1 && y <= 2) return 'bg-red-500';
    if (x >= 12 && x <= 13 && y >= 1 && y <= 2) return 'bg-green-500';
    if (x >= 12 && x <= 13 && y >= 12 && y <= 13) return 'bg-yellow-500';
    if (x >= 1 && x <= 2 && y >= 12 && y <= 13) return 'bg-blue-500';
    
    // Start positions
    if ((x === 1 && y === 6) || (x === 8 && y === 1) || 
        (x === 13 && y === 8) || (x === 6 && y === 13)) {
      return 'bg-gray-300 border-4 border-black';
    }
    
    // Center area
    if (x >= 6 && x <= 8 && y >= 6 && y <= 8) {
      return 'bg-gradient-to-br from-red-300 via-green-300 via-yellow-300 to-blue-300';
    }
    
    // Safe positions
    const position = getBoardPosition(x, y);
    if (position !== -1 && board[position]?.type === CellType.SAFE) {
      return 'bg-gray-200 border-2 border-blue-400';
    }
    
    // Trap positions
    if (position !== -1 && board[position]?.type === CellType.TRAP) {
      return 'bg-red-200 border-2 border-red-600';
    }
    
    // Power-up positions
    if (position !== -1 && board[position]?.type === CellType.POWER_UP) {
      return 'bg-purple-200 border-2 border-purple-600';
    }
    
    // Regular path
    if (position !== -1) {
      return 'bg-white border border-gray-300';
    }
    
    return 'bg-gray-100';
  };

  const getBoardPosition = (x: number, y: number): number => {
    return BOARD_PATH.findIndex(pos => pos.x === x && pos.y === y);
  };

  const getTokensAtPosition = (x: number, y: number): Token[] => {
    const tokens: Token[] = [];
    
    // Check home positions
    Object.entries(HOME_POSITIONS).forEach(([color, positions]) => {
      const homeIndex = positions.findIndex(pos => pos.x === x && pos.y === y);
      if (homeIndex !== -1) {
        const player = players.find(p => p.color === color);
        if (player) {
          const homeToken = player.tokens.find((t: Token) => t.position === -1);
          if (homeToken) tokens.push(homeToken);
        }
      }
    });
    
    // Check board positions
    const boardPos = getBoardPosition(x, y);
    if (boardPos !== -1) {
      players.forEach(player => {
        player.tokens.forEach((token: Token) => {
          if (token.position === boardPos && token.isActive) {
            tokens.push(token);
          }
        });
      });
    }
    
    // Check finish positions
    Object.entries(FINISH_POSITIONS).forEach(([color, positions]) => {
      const finishIndex = positions.findIndex(pos => pos.x === x && pos.y === y);
      if (finishIndex !== -1) {
        const player = players.find(p => p.color === color);
        if (player) {
          const finishToken = player.tokens.find((t: Token) => t.position === 52 + finishIndex);
          if (finishToken) tokens.push(finishToken);
        }
      }
    });
    
    return tokens;
  };

  const getCellContent = (x: number, y: number) => {
    const position = getBoardPosition(x, y);
    const cell = position !== -1 ? board[position] : null;
    
    // Show power-up icon
    if (cell?.type === CellType.POWER_UP && cell.powerUp) {
      const powerUpIcons = {
        shield: '🛡️',
        speed_boost: '⚡',
        teleport: '🌀',
        swap: '🔄'
      };
      return powerUpIcons[cell.powerUp] || '✨';
    }
    
    // Show trap icon
    if (cell?.type === CellType.TRAP) {
      return '⚠️';
    }
    
    return null;
  };

  const renderCell = (x: number, y: number) => {
    const tokens = getTokensAtPosition(x, y);
    const position = getBoardPosition(x, y);
    const cellContent = getCellContent(x, y);
    
    return (
      <div
        key={`${x}-${y}`}
        className={`w-8 h-8 flex items-center justify-center relative cursor-pointer ${getBoardCellColor(x, y)}`}
        onClick={() => position !== -1 && onCellClick(position)}
      >
        {cellContent && (
          <span className="text-xs absolute top-0 right-0">{cellContent}</span>
        )}
        
        {tokens.map((token, index) => (
          <div
            key={token.id}
            className={`w-4 h-4 rounded-full border-2 border-white cursor-pointer transform transition-transform hover:scale-110 ${
              token.color === PlayerColor.RED ? 'bg-red-600' :
              token.color === PlayerColor.GREEN ? 'bg-green-600' :
              token.color === PlayerColor.BLUE ? 'bg-blue-600' :
              'bg-yellow-600'
            } ${selectedToken === token.id ? 'ring-2 ring-black' : ''} ${
              token.powerUps.shield > 0 ? 'ring-2 ring-blue-400' : ''
            } ${
              token.powerUps.frozen > 0 ? 'opacity-50' : ''
            }`}
            style={{
              position: 'absolute',
              left: `${index * 3}px`,
              top: `${