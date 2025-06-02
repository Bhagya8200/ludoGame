import React from "react";
import type { GameState, Player, Token, Position } from "../types/game";

// Token Component
export const TokenComponent: React.FC<{
  token: Token;
  position: Position;
  color: string;
  onClick?: () => void;
  isClickable?: boolean;
}> = ({ token, position, color, onClick, isClickable }) => {
  const getTokenStyle = () => {
    let classes = `absolute w-8 h-8 rounded-full border-3 border-white transition-all duration-300 shadow-lg transform`;

    if (token.hasShield) {
      classes += ` ring-4 ring-blue-400 ring-opacity-75 animate-pulse`;
    }

    if (token.isFrozen) {
      classes += ` ring-4 ring-cyan-400 ring-opacity-75 animate-bounce`;
    }

    if (isClickable) {
      classes += ` cursor-pointer hover:scale-125 hover:shadow-2xl hover:z-30 hover:ring-4 hover:ring-yellow-400 hover:ring-opacity-50`;
    } else {
      classes += ` cursor-default`;
    }

    return classes;
  };

  const getTokenColor = () => {
    const colorMap: { [key: string]: string } = {
      red: "#ef4444",
      blue: "#3b82f6",
      green: "#22c55e",
      yellow: "#eab308",
    };
    return colorMap[color] || color;
  };

  return (
    <div
      className={getTokenStyle()}
      style={{
        left: `${position.x * 40 + 6}px`,
        top: `${position.y * 40 + 6}px`,
        backgroundColor: getTokenColor(),
        boxShadow: `0 4px 12px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.3)`,
        border: "3px solid rgba(255,255,255,0.9)",
      }}
      onClick={onClick}
    >
      {/* Inner highlight for 3D effect */}
      <div
        className="absolute inset-1 rounded-full opacity-40"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)",
        }}
      />

      {/* Shield indicator */}
      {token.hasShield && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full text-xs text-white flex items-center justify-center shadow-lg animate-pulse">
          🛡️
        </div>
      )}

      {/* Frozen indicator */}
      {token.isFrozen && (
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-cyan-400 rounded-full text-xs flex items-center justify-center shadow-lg animate-bounce">
          ❄️
        </div>
      )}

      {/* Clickable glow effect */}
      {isClickable && (
        <div className="absolute inset-0 rounded-full animate-ping bg-yellow-400 opacity-20" />
      )}
    </div>
  );
};
