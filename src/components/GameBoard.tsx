import type { JSX } from "react";
import type { GameState, Player, Position } from "../types/game";
import { canTokenMove, getHomePositions, getPositionCoords } from "../utils/boardUtils";
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
    
    gameState.players.forEach(player => {
      player.tokens.forEach(token => {
        if (token.isFinished) return;
        
        let position: Position;
        
        if (token.position === -1) {
          // Token at home
          const homePositions = getHomePositions(player.color);
          const homeIndex = parseInt(token.id.split('_')[1]);
          position = homePositions[homeIndex];
        } else if (token.isInHomeRun) {
          // Token in home run (simplified positioning)
          const homeRunIndex = token.position - 56;
          position = { x: 7, y: 7 + homeRunIndex }; // Center area
        } else {
          // Token on main board
          position = getPositionCoords(token.position);
        }
        
        const isClickable = currentPlayer?.id === player.id && 
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
        <BoardCell
          key={i}
          position={i}
          onClick={() => onCellClick(i)}
        />
      );
    }
    
    return cells;
  };

  const renderHomeAreas = () => {
    const areas: JSX.Element[] = [];
    
    ['red', 'blue', 'green', 'yellow'].forEach(color => {
      const homePositions = getHomePositions(color);
      homePositions.forEach((pos, index) => {
        areas.push(
          <div
            key={`${color}-home-${index}`}
            className={`absolute w-8 h-8 border-2 border-${color}-600 bg-${color}-100 rounded`}
            style={{
              left: `${pos.x * 32}px`,
              top: `${pos.y * 32}px`,
            }}
          />
        );
      });
    });
    
    return areas;
  };

  return (
    <div className="relative w-[480px] h-[480px] bg-white border-4 border-gray-800 rounded-lg shadow-2xl">
      {renderBoard()}
      {renderHomeAreas()}
      {renderTokens()}
      
      {/* Center area */}
      {/* <div className="absolute w-24 h-24 bg-gradient-to-br from-yellow-300 to-orange-400 border-4 border-yellow-600 rounded-lg shadow-inner"
           style={{ left: '192px', top: '192px' }}>
        <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-yellow-800">
          LUDO
        </div>
      </div> */}
      
      {/* Kill Zone Indicator */}
      {gameState.isKillZoneActive && (
        <div className="absolute inset-0 bg-red-500 bg-opacity-20 animate-pulse rounded-lg pointer-events-none">
          <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-sm font-bold animate-bounce">
            ⚡ KILL ZONE ACTIVE ⚡
          </div>
        </div>
      )}
    </div>
  );
};