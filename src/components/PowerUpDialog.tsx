import { useState } from "react";
import type { GameState, Player } from "../types/game";

export const PowerUpDialog: React.FC<{
  isOpen: boolean;
  powerUpType: string;
  onClose: () => void;
  onConfirm: (data: any) => void;
  gameState: GameState;
  currentPlayer: Player | null;
}> = ({ isOpen, powerUpType, onClose, onConfirm, gameState, currentPlayer }) => {
  const [selectedData, setSelectedData] = useState<any>({});

  if (!isOpen) return null;

  const renderPowerUpContent = () => {
    switch (powerUpType) {
      case 'teleport':
        return (
          <div>
            <h3 className="text-lg font-bold mb-4">Teleport Power-Up</h3>
            <p className="mb-4">Select a position to teleport your token:</p>
            <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
              {Array.from({ length: 52 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedData({ ...selectedData, position: i })}
                  className={`p-2 border rounded ${
                    selectedData.position === i ? 'bg-blue-500 text-white' : 'bg-gray-100'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
        );
      
      case 'swap':
        const allTokens = gameState.players
          .filter(p => p.id !== currentPlayer?.id)
          .flatMap(p => p.tokens.filter(t => !t.isFinished && t.position !== -1));
        
        return (
          <div>
            <h3 className="text-lg font-bold mb-4">Swap Power-Up</h3>
            <p className="mb-4">Select a token to swap positions with:</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {allTokens.map(token => {
                const owner = gameState.players.find(p => p.id === token.playerId)!;
                return (
                  <button
                    key={token.id}
                    onClick={() => setSelectedData({ ...selectedData, targetTokenId: token.id })}
                    className={`w-full p-2 border rounded text-left ${
                      selectedData.targetTokenId === token.id ? 'bg-blue-500 text-white' : 'bg-gray-100'
                    }`}
                  >
                    {owner.name}'s token at position {token.position}
                  </button>
                );
              })}
            </div>
          </div>
        );
      
      default:
        return (
          <div>
            <h3 className="text-lg font-bold mb-4">{powerUpType} Power-Up</h3>
            <p>This power-up will be automatically applied.</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        {renderPowerUpContent()}
        <div className="flex gap-4 mt-6">
          <button
            onClick={() => onConfirm(selectedData)}
            className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Use Power-Up
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
