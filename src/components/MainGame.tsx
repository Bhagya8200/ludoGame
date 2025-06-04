import React, { useState } from "react";
import {
  useSocket,
  useGame,
  useAudioEffects,
  usePowerUpSelection,
} from "../hooks/useGameLogic";
import { GameBoard } from "./GameBoard";
import { PlayerInfo } from "./PlayerInfo";
import { Dice } from "./Dice";
import { PowerUpDialog } from "./PowerUpDialog";

const LudoGame: React.FC = () => {
  const [roomId, setRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [isRolling, setIsRolling] = useState(false);

  const { socket, connected } = useSocket("http://localhost:3001");
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
    usePowerUp,
  } = useGame(socket);

  const { playDiceRoll, playTokenMove, playKill, playPowerUp } =
    useAudioEffects();
  const {
    selectedPowerUp,
    showPowerUpDialog,
    powerUpData,
    selectPowerUp,
    closePowerUpDialog,
  } = usePowerUpSelection();

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
    if (selectedPowerUp === "teleport") {
      selectPowerUp("teleport", { position });
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

  // Login/Join Room Screen
  if (!isJoined || !gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
            🎲 Ludo Game
          </h1>

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
                onKeyPress={(e) => e.key === "Enter" && handleJoinRoom()}
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
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main Game Screen
  const isCurrentPlayerTurn =
    currentPlayer &&
    gameState.players[gameState.currentPlayerIndex]?.id === currentPlayer.id;
  const canShowDice = gameState.gameStarted && isCurrentPlayerTurn;
  const availablePowerUps = gameState.powerUps.filter((p) => p.isActive);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">🎲 Ludo Game</h1>
          <div className="text-white">
            Room:{" "}
            <span className="font-mono bg-black bg-opacity-20 px-2 py-1 rounded">
              {gameState.id}
            </span>
          </div>
          {gameState.gameEnded && gameState.winner && (
            <div className="mt-4 p-4 bg-yellow-400 text-yellow-900 rounded-lg font-bold text-xl">
              🎉{" "}
              {gameState.players.find((p) => p.id === gameState.winner)?.name}{" "}
              Wins! 🎉
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Players Info */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Players</h2>
            {gameState.players.map((player, index) => (
              <PlayerInfo
                key={player.id}
                player={player}
                isCurrentPlayer={
                  gameState.players[gameState.currentPlayerIndex]?.id ===
                  player.id
                }
                timeLeft={
                  gameState.players[gameState.currentPlayerIndex]?.id ===
                  player.id
                    ? player.moveTimeLeft
                    : undefined
                }
              />
            ))}

            {/* Game Controls */}
            <div className="bg-white p-4 rounded-lg shadow-lg">
              {!gameState.gameStarted && (
                <div className="text-center">
                  <p className="mb-4 text-gray-600">
                    Waiting for{" "}
                    {gameState.players.filter((p) => !p.isReady).length}{" "}
                    player(s) to ready up...
                  </p>
                  {currentPlayer && !currentPlayer.isReady && (
                    <button
                      onClick={handleReady}
                      className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors"
                    >
                      Ready!
                    </button>
                  )}
                </div>
              )}

              {canShowDice && (
                <div className="text-center">
                  <p className="mb-4 text-gray-700 font-medium">Your Turn!</p>
                  <div className="flex justify-center mb-4">
                    <Dice
                      value={gameState.diceValue}
                      canRoll={gameState.canRollDice}
                      onRoll={handleRollDice}
                      isRolling={isRolling}
                    />
                  </div>
                  {!gameState.canRollDice && gameState.diceValue > 0 && (
                    <p className="text-sm text-gray-600">
                      Select a token to move {gameState.diceValue} steps
                    </p>
                  )}
                </div>
              )}

              {gameState.gameStarted && !isCurrentPlayerTurn && (
                <div className="text-center text-gray-600">
                  <p>
                    Waiting for{" "}
                    {gameState.players[gameState.currentPlayerIndex]?.name}'s
                    turn...
                  </p>
                </div>
              )}
            </div>

            {/* Power-ups */}
            {availablePowerUps.length > 0 && (
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-4 rounded-xl shadow-lg border-2 border-purple-300">
                <h3 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  Available Power-ups
                </h3>
                <div className="space-y-3">
                  {availablePowerUps.map((powerUp, index) => (
                    <button
                      key={index}
                      onClick={() => selectPowerUp(powerUp.type)}
                      disabled={!isCurrentPlayerTurn}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all transform hover:scale-105 ${
                        isCurrentPlayerTurn
                          ? "bg-gradient-to-r from-purple-200 to-purple-300 hover:from-purple-300 hover:to-purple-400 border-purple-400 shadow-md hover:shadow-lg cursor-pointer"
                          : "bg-gray-200 border-gray-300 cursor-not-allowed opacity-60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-purple-800 capitalize flex items-center gap-2">
                            {powerUp.type === "shield" && "🛡️"}
                            {powerUp.type === "teleport" && "⚡"}
                            {powerUp.type === "swap" && "🔄"}
                            {powerUp.type === "speed" && "🚀"}
                            {/* {powerUp.type === 'freeze' && '❄️'} */}
                            {powerUp.type}
                          </span>
                          <div className="text-xs text-purple-600 mt-1">
                            {powerUp.type === "shield" &&
                              "Protect your token from attacks"}
                            {powerUp.type === "teleport" &&
                              "Move to any position instantly"}
                            {powerUp.type === "swap" &&
                              "Exchange positions with opponent"}
                            {powerUp.type === "speed" && "Move extra spaces"}
                            {/* {powerUp.type === 'freeze' && 'Freeze opponent token'} */}
                          </div>
                        </div>
                        <div className="text-purple-600 text-xl">
                          {powerUp.type === "shield" && "🛡️"}
                          {powerUp.type === "teleport" && "⚡"}
                          {powerUp.type === "swap" && "🔄"}
                          {powerUp.type === "speed" && "🚀"}
                          {/* {powerUp.type === 'freeze' && '❄️'} */}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Game Board */}
          <div className="lg:col-span-3 flex justify-center">
            <GameBoard
              gameState={gameState}
              currentPlayer={currentPlayer}
              onTokenClick={handleTokenClick}
              onCellClick={handleCellClick}
            />
          </div>
        </div>

        {/* Notifications */}
        {notification && (
          <div className="fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
            {notification}
          </div>
        )}

        {error && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            {error}
          </div>
        )}

        {timeWarning > 0 && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white text-6xl font-bold px-8 py-4 rounded-lg shadow-2xl z-50 animate-pulse">
            {timeWarning}
          </div>
        )}

        {/* Power-up Dialog */}
        <PowerUpDialog
          isOpen={showPowerUpDialog}
          powerUpType={selectedPowerUp || ""}
          onClose={closePowerUpDialog}
          onConfirm={handlePowerUpConfirm}
          gameState={gameState}
          currentPlayer={currentPlayer}
        />

        {/* Game Stats */}
        <div className="mt-6 bg-white bg-opacity-20 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-white text-center">
            <div>
              <div className="text-2xl font-bold">{gameState.turnCount}</div>
              <div className="text-sm">Turns Played</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {gameState.players.length}
              </div>
              <div className="text-sm">Players</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {availablePowerUps.length}
              </div>
              <div className="text-sm">Power-ups</div>
            </div>
            {/* <div>
              <div className="text-2xl font-bold">
                {gameState.isKillZoneActive ? '⚡' : '🛡️'}
              </div>
              <div className="text-sm">
                {gameState.isKillZoneActive ? 'Kill Zone' : 'Safe Zone'}
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LudoGame;
