import { getPositionCoords, isPositionSafe, isPowerUpPosition, isTrapPosition } from "../utils/boardUtils";

export const BoardCell: React.FC<{
  position: number;
  children?: React.ReactNode;
  onClick?: () => void;
}> = ({ position, children, onClick }) => {
  const coords = getPositionCoords(position);
  const isSafe = isPositionSafe(position);
  const isPowerUp = isPowerUpPosition(position);
  const isTrap = isTrapPosition(position);
  
  let cellClass = `absolute w-8 h-8 border border-gray-300 flex items-center justify-center text-xs transition-all duration-200`;
  
  if (isSafe) {
    cellClass += ` bg-green-200 border-green-400`;
  } else if (isPowerUp) {
    cellClass += ` bg-purple-200 border-purple-400 animate-pulse`;
  } else if (isTrap) {
    cellClass += ` bg-red-200 border-red-400`;
  } else {
    cellClass += ` bg-gray-100 hover:bg-gray-200`;
  }
  
  return (
    <div
      className={cellClass}
      style={{
        left: `${coords.x * 32}px`,
        top: `${coords.y * 32}px`,
      }}
      onClick={onClick}
    >
      {isPowerUp && <span className="text-purple-600">⚡</span>}
      {isTrap && <span className="text-red-600">⚠️</span>}
      {isSafe && <span className="text-green-600">🏠</span>}
      {children}
    </div>
  );
};
