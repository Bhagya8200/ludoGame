export const Dice: React.FC<{
  value: number;
  canRoll: boolean;
  onRoll: () => void;
  isRolling?: boolean;
}> = ({ value, canRoll, onRoll, isRolling }) => {
  const getDiceFace = (num: number) => {
    const faces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    return faces[num - 1] || "?";
  };


  return (
    <button
      onClick={onRoll}
      disabled={!canRoll}
      className={`w-20 h-20 text-7xl font-semibold flex items-center justify-center 
        bg-gradient-to-br from-white to-gray-200 
        border-[3px] border-gray-700 rounded-2xl 
        shadow-md transition-all duration-200 
        ${
          canRoll
            ? "hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
            : "opacity-40 cursor-not-allowed"
        } 
        ${isRolling ? "animate-bounce" : ""}
      `}
    >
      <span className="drop-shadow-sm">{getDiceFace(value)}</span>
    </button>
  );
};
