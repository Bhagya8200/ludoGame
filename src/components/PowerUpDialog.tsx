import { useState } from "react";
import type { GameState, Player } from "../types/game";

export const PowerUpDialog: React.FC<{
  isOpen: boolean;
  powerUpType: string;
  onClose: () => void;
  onConfirm: (data: any) => void;
  gameState: GameState;
  currentPlayer: Player | null;
}> = ({
  isOpen,
  powerUpType,
  onClose,
  onConfirm,
  gameState,
  currentPlayer,
}) => {
  const [selectedData, setSelectedData] = useState<any>({});

  if (!isOpen) return null;

  const renderPowerUpContent = () => {
    switch (powerUpType) {
      case "teleport":
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-6xl mb-2">⚡</div>
              <h3 className="text-2xl font-bold text-purple-700 mb-2">
                Teleport Power-Up
              </h3>
              <p className="text-gray-600 mb-4">
                Instantly move any of your tokens to any position on the board!
              </p>
            </div>

            {/* Token Selection */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Select Token to Teleport:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {currentPlayer?.tokens
                  .filter((token) => !token.isFinished && token.position !== -1)
                  .map((token) => (
                    <button
                      key={token.id}
                      onClick={() =>
                        setSelectedData({ ...selectedData, tokenId: token.id })
                      }
                      className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                        selectedData.tokenId === token.id
                          ? "bg-purple-500 text-white border-purple-600 shadow-lg"
                          : "bg-white text-gray-700 border-gray-300 hover:border-purple-400"
                      }`}
                    >
                      Token {token.id.split("_")[1]} (Pos: {token.position})
                    </button>
                  ))}
              </div>
            </div>

            {/* Position Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Select Destination Position:
              </label>
              <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                {Array.from({ length: 52 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setSelectedData({ ...selectedData, position: i })
                    }
                    className={`p-2 border rounded text-xs font-medium transition-all ${
                      selectedData.position === i
                        ? "bg-purple-500 text-white border-purple-600 shadow-md"
                        : "bg-white text-gray-700 border-gray-300 hover:border-purple-400 hover:bg-purple-50"
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case "swap":
        const allTokens = gameState.players
          .filter((p) => p.id !== currentPlayer?.id)
          .flatMap((p) =>
            p.tokens.filter((t) => !t.isFinished && t.position !== -1)
          );

        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-6xl mb-2">🔄</div>
              <h3 className="text-2xl font-bold text-blue-700 mb-2">
                Swap Power-Up
              </h3>
              <p className="text-gray-600 mb-4">
                Swap positions with any opponent's token!
              </p>
            </div>

            {/* Your Token Selection */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Select Your Token:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {currentPlayer?.tokens
                  .filter((token) => !token.isFinished && token.position !== -1)
                  .map((token) => (
                    <button
                      key={token.id}
                      onClick={() =>
                        setSelectedData({
                          ...selectedData,
                          yourTokenId: token.id,
                        })
                      }
                      className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                        selectedData.yourTokenId === token.id
                          ? "bg-blue-500 text-white border-blue-600 shadow-lg"
                          : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      Your Token {token.id.split("_")[1]} (Pos: {token.position}
                      )
                    </button>
                  ))}
              </div>
            </div>

            {/* Opponent Token Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Select Opponent's Token:
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {allTokens.map((token) => {
                  const owner = gameState.players.find(
                    (p) => p.id === token.playerId
                  )!;
                  return (
                    <button
                      key={token.id}
                      onClick={() =>
                        setSelectedData({
                          ...selectedData,
                          targetTokenId: token.id,
                        })
                      }
                      className={`w-full p-3 border-2 rounded-lg text-left text-sm font-medium transition-all ${
                        selectedData.targetTokenId === token.id
                          ? "bg-blue-500 text-white border-blue-600 shadow-lg"
                          : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>
                          {owner.name}'s Token {token.id.split("_")[1]}
                        </span>
                        <span className="text-xs opacity-75">
                          Position: {token.position}
                        </span>
                      </div>
                    </button>
                  );
                })}
                {allTokens.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No opponent tokens available
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case "shield":
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-6xl mb-2">🛡️</div>
              <h3 className="text-2xl font-bold text-green-700 mb-2">
                Shield Power-Up
              </h3>
              <p className="text-gray-600 mb-4">
                Protect one of your tokens from being killed for 3 turns!
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Select Token to Shield:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {currentPlayer?.tokens
                  .filter(
                    (token) =>
                      !token.isFinished &&
                      token.position !== -1 &&
                      !token.hasShield
                  )
                  .map((token) => (
                    <button
                      key={token.id}
                      onClick={() =>
                        setSelectedData({ ...selectedData, tokenId: token.id })
                      }
                      className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                        selectedData.tokenId === token.id
                          ? "bg-green-500 text-white border-green-600 shadow-lg"
                          : "bg-white text-gray-700 border-gray-300 hover:border-green-400"
                      }`}
                    >
                      Token {token.id.split("_")[1]} (Pos: {token.position})
                    </button>
                  ))}
              </div>
              {currentPlayer?.tokens.filter(
                (t) => !t.isFinished && t.position !== -1 && !t.hasShield
              ).length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No tokens available for shielding
                </p>
              )}
            </div>
          </div>
        );

      case "speed":
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-6xl mb-2">🚀</div>
              <h3 className="text-2xl font-bold text-orange-700 mb-2">
                Speed Power-Up
              </h3>
              <p className="text-gray-600 mb-4">
                Move one of your tokens an extra 3 spaces on your next turn!
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Select Token to Boost:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {currentPlayer?.tokens
                  .filter((token) => !token.isFinished && token.position !== -1)
                  .map((token) => (
                    <button
                      key={token.id}
                      onClick={() =>
                        setSelectedData({ ...selectedData, tokenId: token.id })
                      }
                      className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                        selectedData.tokenId === token.id
                          ? "bg-orange-500 text-white border-orange-600 shadow-lg"
                          : "bg-white text-gray-700 border-gray-300 hover:border-orange-400"
                      }`}
                    >
                      Token {token.id.split("_")[1]} (Pos: {token.position})
                    </button>
                  ))}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center space-y-4">
            <div className="text-6xl mb-2">✨</div>
            <h3 className="text-2xl font-bold text-purple-700 mb-2">
              {powerUpType} Power-Up
            </h3>
            <p className="text-gray-600">
              This power-up will be automatically applied.
            </p>
          </div>
        );
    }
  };

  const isValidSelection = () => {
    switch (powerUpType) {
      case "teleport":
        return selectedData.tokenId && selectedData.position !== undefined;
      case "swap":
        return selectedData.yourTokenId && selectedData.targetTokenId;
      case "shield":
      case "speed":
        return selectedData.tokenId;
      default:
        return true;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          {renderPowerUpContent()}

          <div className="flex gap-4 mt-8">
            <button
              onClick={() => onConfirm(selectedData)}
              disabled={!isValidSelection()}
              className={`flex-1 py-3 px-6 rounded-lg font-bold text-lg transition-all ${
                isValidSelection()
                  ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg hover:from-purple-600 hover:to-purple-700 hover:shadow-xl transform hover:scale-105"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Use Power-Up ✨
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gradient-to-r from-gray-400 to-gray-500 text-white py-3 px-6 rounded-lg font-bold text-lg hover:from-gray-500 hover:to-gray-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
