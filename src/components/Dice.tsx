export const Dice: React.FC<{
  value: number;
  canRoll: boolean;
  onRoll: () => void;
  isRolling?: boolean;
}> = ({ value, canRoll, onRoll, isRolling }) => {
  const getDiceFace = (num: number) => {
    const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    return faces[num - 1] || '?';
  };

  return (
    <button
      onClick={onRoll}
      disabled={!canRoll}
      className={`w-16 h-16 text-4xl bg-white border-4 border-gray-800 rounded-lg shadow-lg transition-all duration-200 ${
        canRoll 
          ? 'hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer' 
          : 'opacity-50 cursor-not-allowed'
      } ${isRolling ? 'animate-spin' : ''}`}
    >
      {getDiceFace(value)}
    </button>
  );
};
