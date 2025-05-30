import type { Player } from "../types/game";
import { formatTime } from "../utils/boardUtils";

export const PlayerInfo: React.FC<{
  player: Player;
  isCurrentPlayer: boolean;
  timeLeft?: number;
}> = ({ player, isCurrentPlayer, timeLeft }) => {
  const finishedTokens = player.tokens.filter(t => t.isFinished).length;
  
  return (
    <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${
      isCurrentPlayer 
        ? 'border-yellow-500 bg-yellow-50 shadow-lg transform scale-105' 
        : 'border-gray-300 bg-white'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`font-bold text-lg ${isCurrentPlayer ? 'text-yellow-700' : 'text-gray-700'}`}>
          {player.name}
        </h3>
        <div className={`w-4 h-4 rounded-full bg-${player.color}-500`}></div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>Tokens: {finishedTokens}/4</div>
        <div>Kills: {player.kills}</div>
        <div>Points: {player.points}</div>
        <div>
          {isCurrentPlayer && timeLeft && timeLeft > 0 && (
            <span className={`font-bold ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-blue-500'}`}>
              {formatTime(timeLeft)}
            </span>
          )}
        </div>
      </div>
      
      {!player.isReady && !isCurrentPlayer && (
        <div className="mt-2 text-xs text-gray-500">Waiting...</div>
      )}
    </div>
  );
};