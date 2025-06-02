import type { JSX } from "react";
import type { GameState, Player, Position } from "../types/game";
import {
  canTokenMove,
  getHomePositions,
  getWhiteGridPositions,
  getHomeRunPositions, // Import the new home run function
} from "../utils/boardUtils";
import { BoardCell } from "./BoardCell";
import { TokenComponent } from "./Token"; // Import the Token component

export const GameBoard: React.FC<{
  gameState: GameState;
  currentPlayer: Player | null;
  onTokenClick: (tokenId: string) => void;
  onCellClick: (position: number) => void;
}> = ({ gameState, currentPlayer, onTokenClick, onCellClick }) => {
  const renderTokens = () => {
    const tokens: JSX.Element[] = [];

    gameState.players.forEach((player) => {
      player.tokens.forEach((token) => {
        if (token.isFinished) return; // Skip finished tokens

        let position: Position;

        if (token.position === -1) {
          // Token at home
          const homePositions = getHomePositions(player.color);
          const homeIndex = parseInt(token.id.split("_")[1]);
          position = homePositions[homeIndex];
        } else if (token.isInHomeRun) {
          // Token in home run - use getHomeRunPositions for proper positioning
          const homeRunPositions = getHomeRunPositions();
          const colorPositions =
            homeRunPositions[player.color as keyof typeof homeRunPositions];
          const homeRunIndex = token.position - 56;
          if (homeRunIndex >= 0 && homeRunIndex < colorPositions.length) {
            position = colorPositions[homeRunIndex];
          } else {
            position = { x: 7, y: 7 }; // fallback to center
          }
        } else {
          // Token on main board - you'll need to implement getBoardPosition
          // For now, using a simple calculation - you should replace this with proper board positioning
          position = getBoardPosition(token.position);
        }

        // Check if token is clickable (current player's turn and can move)
        const isClickable =
          currentPlayer?.id === player.id &&
          canTokenMove(token, gameState.diceValue, gameState);

        // Add the token to the array
        tokens.push(
          <TokenComponent
            key={token.id}
            token={token}
            position={position}
            color={player.color}
            onClick={() => onTokenClick(token.id)}
            isClickable={isClickable}
          />
        );
      });
    });

    return tokens;
  };

  // Helper function to get board position - you'll need to implement this based on your board layout
  const getBoardPosition = (boardPosition: number): Position => {
    // This is a simplified version - you should implement proper board positioning
    // based on your actual board layout. For now, returning a simple grid position.

    // Example board positions (you'll need to adjust these based on your actual board)
    const boardPositions: Position[] = [
      // Starting positions for each color (you'll need to define all 52 positions)
      { x: 6, y: 1 }, // position 0
      { x: 6, y: 2 }, // position 1
      { x: 6, y: 3 }, // position 2
      { x: 6, y: 4 }, // position 3
      { x: 6, y: 5 }, // position 4
      { x: 6, y: 6 }, // position 5
      { x: 7, y: 6 }, // position 6
      { x: 8, y: 6 }, // position 7
      { x: 9, y: 6 }, // position 8
      { x: 10, y: 6 }, // position 9
      { x: 11, y: 6 }, // position 10
      { x: 12, y: 6 }, // position 11
      { x: 13, y: 6 }, // position 12
      { x: 13, y: 7 }, // position 13
      { x: 13, y: 8 }, // position 14
      // ... continue for all 52 positions
    ];

    // Return the position if it exists, otherwise return center
    return boardPositions[boardPosition] || { x: 7, y: 7 };
  };

  const renderBoard = () => {
    const cells: JSX.Element[] = [];

    // Render main board path
    for (let i = 0; i < 52; i++) {
      cells.push(
        <BoardCell key={i} position={i} onClick={() => onCellClick(i)} />
      );
    }

    return cells;
  };

  const renderHomeAreas = () => {
    const areas: JSX.Element[] = [];

    const colorMap = {
      red: "red",
      blue: "blue",
      green: "green",
      yellow: "yellow",
    };

    ["red", "blue", "green", "yellow"].forEach((color) => {
      const homePositions = getHomePositions(color);
      homePositions.forEach((pos, index) => {
        areas.push(
          <div
            key={`${color}-home-${index}`}
            className={`absolute w-15 h-15 border-3 bg-gradient-to-br shadow-lg rounded-lg -m-5 `}
            style={{
              left: `${pos.x * 40}px`,
              top: `${pos.y * 40}px`,
              backgroundColor: `var(--${color}-200)`,
              borderColor: `var(--${color}-600)`,
              boxShadow: `0 4px 8px rgba(0,0,0,0.2)`,
            }}
          />
        );
      });
    });

    return areas;
  };

  // NEW FUNCTION: Render white/grey grid positions
  const renderWhiteGrids = () => {
    const grids: JSX.Element[] = [];
    const whitePositions = getWhiteGridPositions();

    whitePositions.forEach((pos, index) => {
      grids.push(
        <div
          key={`white-grid-${index}`}
          className="absolute w-10 h-10 border-2 flex items-center justify-center text-xs transition-all duration-300 cursor-pointer bg-gradient-to-br from-gray-200 to-gray-300 border-gray-400 hover:from-gray-300 hover:to-gray-400 shadow-md"
          style={{
            left: `${pos.x * 40}px`,
            top: `${pos.y * 40}px`,
            borderRadius: "8px",
          }}
        >
          <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
        </div>
      );
    });

    return grids;
  };

  // NEW FUNCTION: Render colored home run paths
  const renderHomeRunPaths = () => {
    const paths: JSX.Element[] = [];
    const homeRunPositions = getHomeRunPositions();

    // Define color styles for each color
    const colorStyles = {
      red: {
        background: "bg-gradient-to-br from-red-400 to-red-600",
        border: "border-red-800",
        hover: "hover:from-red-500 hover:to-red-700",
      },
      green: {
        background: "bg-gradient-to-br from-green-400 to-green-600",
        border: "border-green-800",
        hover: "hover:from-green-500 hover:to-green-700",
      },
      yellow: {
        background: "bg-gradient-to-br from-yellow-400 to-yellow-600",
        border: "border-yellow-800",
        hover: "hover:from-yellow-500 hover:to-yellow-700",
      },
      blue: {
        background: "bg-gradient-to-br from-blue-400 to-blue-600",
        border: "border-blue-800",
        hover: "hover:from-blue-500 hover:to-blue-700",
      },
    };

    // Render each color's home run path
    Object.entries(homeRunPositions).forEach(([color, positions]) => {
      const style = colorStyles[color as keyof typeof colorStyles];

      positions.forEach((pos, index) => {
        paths.push(
          <div
            key={`${color}-homerun-${index}`}
            className={`absolute w-10 h-10 border-2 flex items-center justify-center text-xs transition-all duration-300 cursor-pointer ${style.background} ${style.border} ${style.hover} shadow-lg`}
            style={{
              left: `${pos.x * 40}px`,
              top: `${pos.y * 40}px`,
              borderRadius: "8px",
            }}
          >
            {/* Add an arrow or indicator to show direction */}
            <div className="text-white text-lg font-bold">
              {(() => {
                if (index >= 1) {
                  switch (color) {
                    case "red":
                      return "↑";
                    case "green":
                      return "↓";
                    case "blue":
                      return "→";
                    case "yellow":
                      return "←";
                    default:
                      return "";
                  }
                }
              })()}
            </div>

            <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
          </div>
        );
      });
    });

    return paths;
  };

  return (
    <div
      className="relative bg-gradient-to-br from-amber-100 to-orange-200 border-8 border-amber-800 rounded-2xl shadow-2xl p-4"
      style={{ width: "640px", height: "640px" }}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-10 bg-repeat rounded-2xl"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='%23000' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)' /%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* RENDER WHITE GRIDS FIRST (so they appear behind other elements) */}
      {renderWhiteGrids()}

      {/* RENDER COLORED HOME RUN PATHS */}
      {renderHomeRunPaths()}

      {renderBoard()}
      {renderHomeAreas()}

      {/* RENDER TOKENS - This was missing the actual rendering! */}
      {renderTokens()}

      {/* Center area - Enhanced design */}
      {/* <div
        className="absolute bg-gradient-to-br from-yellow-300 via-orange-300 to-red-300 border-8 border-yellow-700 rounded-2xl shadow-2xl flex items-center justify-center"
        style={{
          left: "-10px",
          bottom: "530px",
          width: "100px",
          height: "100px",
        }}
      >
        <div className="text-center">
          <div className="text-3xl font-bold text-yellow-900 mb-1">🎲</div>
          <div className="text-lg font-bold text-yellow-800">LUDO</div>
        </div>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
      </div> */}
    </div>
  );
};
