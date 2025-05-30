import { useState } from "react";

const LudoGame: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  
  const { socket, connected } = useSocket('http://localhost:3001');
  const { 
    gameState, 
    currentPlayer, 
    error, 
    notification, 
    timeWarning,
    joinRoom, 
    setReady, 
    rollDice, 
    moveToken, 
    usePowerUp 
  } = useGame(socket);
  
  const { playDiceRoll, playTokenMove, playKill, playPowerUp } = useAudioEffects();
  const { selectedPowerUp, showPowerUpDialog, powerUpData, selectPowerUp, closePowerUpDialog } = usePowerUpSelection();

  const handleJoinRoom = () => {
    if (roomId.trim() && playerName.trim()) {
      joinRoom(roomId, playerName);
      setIsJoined(true);
    }
  };

  const handleRollDice = () => {
    if (gameState && currentPlayer) {
      setIsRolling(true);
      rollDice(gameState.id);
      playDiceRoll();
      setTimeout(() => setIsRolling(false), 500);
    }
  };

  const handleTokenClick = (tokenId: string) => {
    if (gameState && currentPlayer) {
      moveToken(gameState.id, tokenId);
      playTokenMove();
    }
  };

  const handleCellClick = (position: number) => {
    // Handle teleport power-up
    if (selectedPowerUp === 'teleport') {
      selectPowerUp('teleport', { position });
    }
  };

  const handlePowerUpConfirm = (data: any) => {
    if (gameState && selectedPowerUp) {
      usePowerUp(gameState.id, selectedPowerUp, data);
      playPowerUp();
      closePowerUpDialog();
    }
  };

  const handleReady = () => {
    if (gameState) {
      setReady(gameState.id);
    }
  };

  // Join Room UI
  if (!isJoined || !gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">🎲 Ludo Game</h1>
          
          {!connected && (
            <div className="text-center text-red-500 mb-4">
              Connecting to server...
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room ID
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter room ID"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your name"
              />
            </div>
            
            <button
              onClick={handleJoinRoom}
              disabled={!connected || !roomId.trim() || !playerName.trim()}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Join Game
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounde