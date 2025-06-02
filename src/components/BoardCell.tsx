import {
  isPositionSafe,
  isPowerUpPosition,
  isTrapPosition,
} from "../utils/boardUtils";

export const BoardCell: React.FC<{
  position: number;
  children?: React.ReactNode;
  onClick?: () => void;
}> = ({ position, children, onClick }) => {
  const isSafe = isPositionSafe(position);
  const isPowerUp = isPowerUpPosition(position);
  const isTrap = isTrapPosition(position);

  let cellClass = `absolute w-10 h-10 border-2 flex items-center justify-center text-xs transition-all duration-300 cursor-pointer`;

  if (isSafe) {
    cellClass += ` bg-gradient-to-br from-green-300 to-green-400 border-green-600 shadow-lg`;
  } else if (isPowerUp) {
    cellClass += ` bg-gradient-to-br from-purple-400 to-purple-600 border-purple-800 animate-pulse shadow-lg`;
  } else if (isTrap) {
    cellClass += ` bg-gradient-to-br from-red-400 to-red-600 border-red-800 shadow-lg`;
  } else {
    cellClass += ` bg-gradient-to-br from-gray-200 to-gray-300 border-gray-400 hover:from-gray-300 hover:to-gray-400 shadow-md`;
  }

  return (
    <div
      className={cellClass}
      style={{
        left: `${0 * 40}px`,
        top: `${0 * 40}px`,
        borderRadius: "8px",
      }}
      onClick={onClick}
    >
      {isPowerUp && (
        <span className="text-purple-100 text-lg animate-bounce">⚡</span>
      )}
      {isTrap && <span className="text-red-100 text-lg animate-pulse">⚠️</span>}
      {isSafe && <span className="text-green-100 text-lg">🏠</span>}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
      {children}
    </div>
  );
};
