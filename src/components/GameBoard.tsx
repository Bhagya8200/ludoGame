// import type { JSX } from "react";
// import type { GameState, Player, Position } from "../types/game";
// import { canTokenMove, getHomePositions, getPositionCoords } from "../utils/boardUtils";
// import { TokenComponent } from "./Token";
// import { BoardCell } from "./BoardCell";

// export const GameBoard: React.FC<{
//   gameState: GameState;
//   currentPlayer: Player | null;
//   onTokenClick: (tokenId: string) => void;
//   onCellClick: (position: number) => void;
// }> = ({ gameState, currentPlayer, onTokenClick, onCellClick }) => {
//   const renderTokens = () => {
//     const tokens: JSX.Element[] = [];

//     gameState.players.forEach(player => {
//       player.tokens.forEach(token => {
//         if (token.isFinished) return;

//         let position: Position;

//         if (token.position === -1) {
//           // Token at home
//           const homePositions = getHomePositions(player.color);
//           const homeIndex = parseInt(token.id.split('_')[1]);
//           position = homePositions[homeIndex];
//         } else if (token.isInHomeRun) {
//           // Token in home run (simplified positioning)
//           const homeRunIndex = token.position - 56;
//           position = { x: 7, y: 7 + homeRunIndex }; // Center area
//         } else {
//           // Token on main board
//           position = getPositionCoords(token.position);
//         }

//         const isClickable = currentPlayer?.id === player.id &&
//           canTokenMove(token, gameState.diceValue, gameState) &&
//           !gameState.canRollDice;

//         tokens.push(
//           <TokenComponent
//             key={token.id}
//             token={token}
//             position={position}
//             color={player.color}
//             onClick={() => isClickable && onTokenClick(token.id)}
//             isClickable={isClickable}
//           />
//         );
//       });
//     });

//     return tokens;
//   };

//   const renderBoard = () => {
//     const cells: JSX.Element[] = [];

//     // Render main board path
//     for (let i = 0; i < 52; i++) {
//       cells.push(
//         <BoardCell
//           key={i}
//           position={i}
//           onClick={() => onCellClick(i)}
//         />
//       );
//     }

//     return cells;
//   };

//   const renderHomeAreas = () => {
//     const areas: JSX.Element[] = [];

//     ['red', 'blue', 'green', 'yellow'].forEach(color => {
//       const homePositions = getHomePositions(color);
//       homePositions.forEach((pos, index) => {
//         areas.push(
//           <div
//             key={`${color}-home-${index}`}
//             className={`absolute w-8 h-8 border-2 border-${color}-600 bg-${color}-100 rounded`}
//             style={{
//               left: `${pos.x * 32}px`,
//               top: `${pos.y * 32}px`,
//             }}
//           />
//         );
//       });
//     });

//     return areas;
//   };

//   return (
//     <div className="relative w-[480px] h-[480px] bg-white border-4 border-gray-800 rounded-lg shadow-2xl">
//       {renderBoard()}
//       {renderHomeAreas()}
//       {renderTokens()}

//       {/* Center area */}
//       {/* <div className="absolute w-24 h-24 bg-gradient-to-br from-yellow-300 to-orange-400 border-4 border-yellow-600 rounded-lg shadow-inner"
//            style={{ left: '192px', top: '192px' }}>
//         <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-yellow-800">
//           LUDO
//         </div>
//       </div> */}

//       {/* Kill Zone Indicator */}
//       {gameState.isKillZoneActive && (
//         <div className="absolute inset-0 bg-red-500 bg-opacity-20 animate-pulse rounded-lg pointer-events-none">
//           <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-sm font-bold animate-bounce">
//             ⚡ KILL ZONE ACTIVE ⚡
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

import type { JSX } from "react";
import type { GameState, Player, Position } from "../types/game";
import {
  canTokenMove,
  getHomePositions,
  getPositionCoords,
} from "../utils/boardUtils";
import { TokenComponent } from "./Token";
import { BoardCell } from "./BoardCell";

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
        if (token.isFinished) return;

        let position: Position;

        if (token.position === -1) {
          // Token at home
          const homePositions = getHomePositions(player.color);
          const homeIndex = parseInt(token.id.split("_")[1]);
          position = homePositions[homeIndex];
        } else if (token.isInHomeRun) {
          // Token in home run (simplified positioning)
          const homeRunIndex = token.position - 56;
          position = { x: 7, y: 7 + homeRunIndex }; // Center area
        } else {
          // Token on main board
          position = getPositionCoords(token.position);
        }

        const isClickable =
          currentPlayer?.id === player.id &&
          canTokenMove(token, gameState.diceValue, gameState) &&
          !gameState.canRollDice;

        tokens.push(
          <TokenComponent
            key={token.id}
            token={token}
            position={position}
            color={player.color}
            onClick={() => isClickable && onTokenClick(token.id)}
            isClickable={isClickable}
          />
        );
      });
    });

    return tokens;
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
            className={`absolute w-10 h-10 border-3 bg-gradient-to-br shadow-lg rounded-lg`}
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

  const renderColoredPaths = () => {
    const paths: JSX.Element[] = [];

    // Red home run path
    for (let i = 53; i <= 57; i++) {
      const coords = getPositionCoords(i);
      paths.push(
        <div
          key={`red-path-${i}`}
          className="absolute w-10 h-10 bg-gradient-to-r from-red-300 to-red-400 border-2 border-red-600 rounded-lg shadow-md"
          style={{
            left: `${coords.x * 40}px`,
            top: `${coords.y * 40}px`,
          }}
        />
      );
    }

    // Similar for other colors...
    const colorPaths = [
      { color: "green", start: 58, end: 62 },
      { color: "yellow", start: 63, end: 67 },
      { color: "blue", start: 68, end: 72 },
    ];

    colorPaths.forEach(({ color, start, end }) => {
      for (let i = start; i <= end; i++) {
        const coords = getPositionCoords(i);
        paths.push(
          <div
            key={`${color}-path-${i}`}
            className={`absolute w-10 h-10 bg-gradient-to-r from-${color}-300 to-${color}-400 border-2 border-${color}-600 rounded-lg shadow-md`}
            style={{
              left: `${coords.x * 40}px`,
              top: `${coords.y * 40}px`,
            }}
          />
        );
      }
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

      {renderColoredPaths()}
      {renderBoard()}
      {renderHomeAreas()}
      {renderTokens()}

      {/* Center area - Enhanced design */}
      {/* <div
        className="absolute bg-gradient-to-br from-yellow-300 via-orange-300 to-red-300 border-8 border-yellow-700 rounded-2xl shadow-2xl flex items-center justify-center"
        style={{
          left: "260px",
          top: "260px",
          width: "120px",
          height: "120px",
        }}
      >
        <div className="text-center">
          <div className="text-3xl font-bold text-yellow-900 mb-1">🎲</div>
          <div className="text-lg font-bold text-yellow-800">LUDO</div>
        </div>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
      </div> */}

      {/* Enhanced Kill Zone Indicator */}
      {gameState.isKillZoneActive && (
        <>
          <div className="absolute inset-0 bg-red-500 bg-opacity-30 animate-pulse rounded-2xl pointer-events-none border-4 border-red-700"></div>
          <div className="absolute top-4 left-4 bg-gradient-to-r from-red-600 to-red-800 text-white px-4 py-2 rounded-lg text-lg font-bold animate-bounce shadow-2xl">
            ⚡ KILL ZONE ACTIVE ⚡
          </div>
          <div className="absolute top-4 right-4 bg-gradient-to-r from-red-600 to-red-800 text-white px-4 py-2 rounded-lg text-lg font-bold animate-bounce shadow-2xl">
            ⚡ KILL ZONE ACTIVE ⚡
          </div>
        </>
      )}
    </div>
  );
};
