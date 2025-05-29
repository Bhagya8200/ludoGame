// src/utils/boardUtils.ts
import { Position } from '../types/game';

export const BOARD_SIZE = 15;

// Board layout mapping - each number represents a cell type
// 0 = empty, 1 = path, 2 = home area, 3 = start, 4 = finish, 5 = safe
export const BOARD_LAYOUT = [
  [2, 2, 2, 0, 0, 0, 1, 1, 1, 0, 0, 0, 2, 2, 2],
  [2, 2, 2, 0, 0, 0, 1, 1, 1, 0, 0, 0, 2, 2, 2],
  [2, 2, 2, 0, 0, 0, 1, 1, 1, 0, 0, 0, 2, 2, 2],
  [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 4, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0],
  [2, 2, 2, 0, 0, 0, 1, 1, 1, 0, 0, 0, 2, 2, 2],
  [2, 2, 2, 0, 0, 0, 1, 1, 1, 0, 0, 0, 2, 2, 2],
  [2, 2, 2, 0, 0, 0, 1, 1, 1, 0, 0, 0, 2, 2, 2]
];

// Convert linear position (0-51) to board coordinates
export const positionToCoordinates = (position: number): Position => {
  const positions: Position[] = [
    // Starting from red's start, going clockwise
    { x: 1, y: 6 },   // Red start
    { x: 2, y: 6 },
    { x: 3, y: 6 },
    { x: 4, y: 6 },
    { x: 5, y: 6 },
    { x: 6, y: 5 },
    { x: 6, y: 4 },
    { x: 6, y: 3 },
    { x: 6, y: 2 },
    { x: 6, y: 1 },
    { x: 6, y: 0 },
    { x: 7, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 1 },   // Blue start
    { x: 8, y: 2 },
    { x: 8, y: 3 },
    { x: 8, y: 4 },
    { x: 8, y: 5 },
    { x: 9, y: 6 },
    { x: 10, y: 6 },
    { x: 11, y: 6 },
    { x: 12, y: 6 },
    { x: 13, y: 6 },
    { x: 14, y: 6 },
    { x: 14, y: 7 },
    { x: 14, y: 8 },
    { x: 13, y: 8 },   // Green start
    { x: 12, y: 8 },
    { x: 11, y: 8 },
    { x: 10, y: 8 },
    { x: 9, y: 8 },
    { x: 8, y: 9 },
    { x: 8, y: 10 },
    { x: 8, y: 11 },
    { x: 8, y: 12 },
    { x: 8, y: 13 },
    { x: 8, y: 14 },
    { x: 7, y: 14 },
    { x: 6, y: 14 },
    { x: 6, y: 13 },   // Yellow start
    { x: 6, y: 12 },
    { x: 6, y: 11 },
    { x: 6, y: 10 },
    { x: 6, y: 9 },
    { x: 5, y: 8 },
    { x: 4, y: 8 },
    { x: 3, y: 8 },
    { x: 2, y: 8 },
    { x: 1, y: 8 },
    { x: 0, y: 8 },
    { x: 0, y: 7 },
    { x: 0, y: 6 }    // Back to red area
  ];
  
  return positions[position % positions.length] || { x: 0, y: 0 };
};

// Get home area positions for each color
export const getHomeAreaPositions = (color: string): Position[] => {
  const homeAreas: Record<string, Position[]> = {
    red: [
      { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 },
      { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 },
      { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }
    ],
    blue: [
      { x: 11, y: 1 }, { x: 12, y: 1 }, { x: 13, y: 1 },
      { x: 11, y: 2 }, { x: 12, y: 2 }, { x: 13, y: 2 },
      { x: 11, y: 3 }, { x: 12, y: 3 }, { x: 13, y: 3 }
    ],
    green: [
      { x: 11, y: 11 }, { x: 12, y: 11 }, { x: 13, y: 11 },
      { x: 11, y: 12 }, { x: 12, y: 12 }, { x: 13, y: 12 },
      { x: 11, y: 13 }, { x: 12, y: 13 }, { x: 13, y: 13 }
    ],
    yellow: [
      { x: 1, y: 11 }, { x: 2, y: 11 }, { x: 3, y: 11 },
      { x: 1, y: 12 }, { x: 2, y: 12 }, { x: 3, y: 12 },
      { x: 1, y: 13 }, { x: 2, y: 13 }, { x: 3, y: 13 }
    ]
  };
  
  return homeAreas[color] || [];
};

// Get finish line positions for each color
export const getFinishPositions = (color: string): Position[] => {
  const finishPaths: Record<string, Position[]> = {
    red: [
      { x: 7, y: 1 }, { x: 7, y: 2 }, { x: 7, y: 3 },
      { x: 7, y: 4 }, { x: 7, y: 5 }, { x: 7, y: 6 }
    ],
    blue: [
      { x: 9, y: 7 }, { x: 10, y: 7 }, { x: 11, y: 7 },
      { x: 12, y: 7 }, { x: 13, y: 7 }, { x: 14, y: 7 }
    ],
    green: [
      { x: 7, y: 9 }, { x: 7, y: 10 }, { x: 7, y: 11 },
      { x: 7, y: 12 }, { x: 7, y: 13 }, { x: 7, y: 14 }
    ],
    yellow: [
      { x: 1, y: 7 }, { x: 2, y: 7 }, { x: 3, y: 7 },
      { x: 4, y: 7 }, { x: 5, y: 7 }, { x: 6, y: 7 }
    ]
  };
  
  return finishPaths[color] || [];
};

// Check if a position is a safe spot
export const isSafePosition = (position: Position): boolean => {
  const safeSpots = [
    { x: 1, y: 6 },   // Red start
    { x: 8, y: 1 },   // Blue start  
    { x: 13, y: 8 },  // Green start
    { x: 6, y: 13 },  // Yellow start
    { x: 2, y: 6 },   // Red safe
    { x: 8, y: 2 },   // Blue safe
    { x: 12, y: 8 },  // Green safe
    { x: 6, y: 12 }   // Yellow safe
  ];
  
  return safeSpots.some(safe => safe.x === position.x && safe.y === position.y);
};

// Check if position is in central kill zone
export const isInKillZone = (position: Position): boolean => {
  return position.x >= 6 && position.x <= 8 && position.y >= 6 && position.y <= 8;
};

// Get cell style classes based on position and game state
export const getCellClasses = (
  x: number, 
  y: number, 
  isPowerUp: boolean = false, 
  isTrap: boolean = false,
  isKillZone: boolean = false
): string => {
  const cellType = BOARD_LAYOUT[y]?.[x] || 0;
  let classes = 'w-8 h-8 border border-gray-300 flex items-center justify-center relative ';
  
  switch (cellType) {
    case 0: // Empty
      classes += 'bg-gray-100';
      break;
    case 1: // Path
      classes += 'bg-white';
      break;
    case 2: // Home area
      if (y < 3) classes += x < 6 ? 'bg-red-200' : 'bg-blue-200';
      else classes += x < 6 ? 'bg-yellow-200' : 'bg-green-200';
      break;
    case 3: // Start
      classes += 'bg-orange-300';
      break;
    case 4: // Finish
      classes += 'bg-purple-300';
      break;
    case 5: // Safe
      classes += 'bg-cyan-300';
      break;
  }
  
  if (isPowerUp) classes += ' ring-2 ring-yellow-400';
  if (isTrap) classes += ' ring-2 ring-red-500';
  if (isKillZone) classes += ' ring-2 ring-purple-600 ring-opacity-50';
  
  return classes;
};