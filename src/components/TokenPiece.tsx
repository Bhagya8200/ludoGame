// src/components/TokenPiece.tsx
import React from 'react';
import { Token } from '../types/game';
import { getPowerUpStatus } from '../utils/powerUps';

interface TokenPieceProps {
  token: Token;
  isSelected?: boolean;
  isMovable?: boolean;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const TokenPiece: React.FC<TokenPieceProps> = ({
  token,
  isSelected = false,
  isMovable = false,
  onClick,
  size = 'medium'
}) => {
  const getColorClasses = (color: string): string => {
    const colorMap: Record<string, string> = {
      red: 'bg-red-500 border-red-700',
      blue: 'bg-blue-500 border-blue-700',
      green: 'bg-green-500 border-green-700',
      yellow: 'bg-yellow-500 border-yellow-700'
    };
    return colorMap[color] || 'bg-gray-500 border-gray-700';
  };

  const getSizeClasses = (): string => {
    const sizeMap =