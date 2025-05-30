
import React from 'react';
import type { GameState, Player, Token, Position } from '../types/game';

// Token Component
export const TokenComponent: React.FC<{
  token: Token;
  position: Position;
  color: string;
  onClick?: () => void;
  isClickable?: boolean;
}> = ({ token, position, color, onClick, isClickable }) => {
  const getTokenStyle = () => {
    let classes = `absolute w-6 h-6 rounded-full border-2 border-white transition-all duration-300 cursor-pointer transform hover:scale-110 shadow-lg`;
    
    if (token.hasShield) {
      classes += ` ring-4 ring-blue-400 ring-opacity-75 animate-pulse`;
    }
    
    if (token.isFrozen) {
      classes += ` ring-4 ring-cyan-400 ring-opacity-75`;
    }
    
    if (isClickable) {
      classes += ` hover:shadow-xl hover:z-10`;
    }
    
    return classes;
  };

  return (
    <div
      className={getTokenStyle()}
      style={{
        left: `${position.x * 32 + 4}px`,
        top: `${position.y * 32 + 4}px`,
        backgroundColor: color,
      }}
      onClick={onClick}
    >
      {token.hasShield && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full text-xs text-white flex items-center justify-center">
          🛡️
        </div>
      )}
      {token.isFrozen && (
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-cyan-400 rounded-full text-xs flex items-center justify-center">
          ❄️
        </div>
      )}
    </div>
  );
};