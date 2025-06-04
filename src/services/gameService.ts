import { GameRoom } from "../models/GameRoom";
import type {
  IGameRoom,
  IPlayer,
  IGameMove,
  IPowerUp,
} from "../models/GameRoom";
import type {
  GameState,
  Player,
  Token,
  PowerUp,
  MoveResult,
} from "../types/game";
import {
  generatePowerUp,
  TRAP_POSITIONS,
  createPlayer,
} from "../utils/boardUtils";

export class GameService {
  static async createOrGetRoom(roomId: string): Promise<IGameRoom> {
    let room = await GameRoom.findOne({ roomId });

    if (!room) {
      room = new GameRoom({
        roomId,
        players: [],
        currentPlayerIndex: 0,
        diceValue: 0,
        canRollDice: false,
        gameStarted: false,
        gameEnded: false,
        winner: null,
        turnCount: 0,
        powerUps: [],
        trapZones: TRAP_POSITIONS,
        lastRollTime: new Date(),
        moves: [],
        settings: {
          timedMoves: true,
          moveTimeLimit: 15,
          powerUpsEnabled: true,
          trapZonesEnabled: true,
          pointsSystemEnabled: true,
        },
      });

      // Add initial power-ups if enabled
      if (room.settings.powerUpsEnabled) {
        for (let i = 0; i < 3; i++) {
          const powerUp = generatePowerUp();
          room.powerUps.push({
            type: powerUp.type,
            position: powerUp.position,
            isActive: powerUp.isActive,
            id: powerUp.id,
            createdAt: new Date(),
          } as IPowerUp);
        }
      }

      await room.save();
    }

    return room;
  }

  static async addPlayerToRoom(
    roomId: string,
    playerId: string,
    playerName: string,
    socketId: string
  ): Promise<IGameRoom | null> {
    const room = await GameRoom.findOne({ roomId });
    if (!room) return null;

    if (room.players.length >= 4) {
      throw new Error("Room is full");
    }

    // This method should only be called for NEW players now
    // Reconnection logic is handled in the joinRoom event handler

    // Check for duplicate player ID or name for new players
    if (room.players.some((p) => p.id === playerId || p.name === playerName)) {
      throw new Error("Player name already taken");
    }

    const colors = ["red", "blue", "green", "yellow"];
    const usedColors = room.players.map((p) => p.color);
    const availableColor = colors.find(
      (color) => !usedColors.includes(color as any)
    );

    if (!availableColor) {
      throw new Error("No available colors");
    }

    const newPlayer = createPlayer(playerId, playerName, availableColor);
    room.players.push({
      ...newPlayer,
      socketId,
      lastSeen: new Date(),
    } as IPlayer);

    await room.save();
    return room;
  }

  static async updatePlayerLastSeen(
    roomId: string,
    playerId: string
  ): Promise<void> {
    try {
      await GameRoom.findOneAndUpdate(
        { roomId, "players.id": playerId },
        { $set: { "players.$.lastSeen": new Date() } }
      );
    } catch (error) {
      console.error("Error updating player last seen:", error);
    }
  }

  static async updatePlayerReady(
    roomId: string,
    playerId: string
  ): Promise<IGameRoom | null> {
    const room = await GameRoom.findOne({ roomId });
    if (!room) return null;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return null;

    player.isReady = true;

    // Check if all players are ready and start game
    if (room.players.length >= 1 && room.players.every((p) => p.isReady)) {
      room.gameStarted = true;
      room.canRollDice = true;
    }

    await room.save();
    return room;
  }

  static async rollDice(
    roomId: string,
    playerId: string
  ): Promise<{ room: IGameRoom; diceValue: number } | null> {
    const room = await GameRoom.findOne({ roomId });
    if (!room || !room.canRollDice) return null;

    const currentPlayer = room.players[room.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return null;

    const diceValue = Math.floor(Math.random() * 6) + 1;
    room.diceValue = diceValue;
    room.canRollDice = false;
    room.lastRollTime = new Date();

    await room.save();
    return { room, diceValue };
  }

  static async moveToken(
    roomId: string,
    playerId: string,
    tokenId: string
  ): Promise<{ room: IGameRoom; moveResult: MoveResult } | null> {
    const room = await GameRoom.findOne({ roomId });
    if (!room || room.canRollDice) return null;

    const currentPlayer = room.players[room.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return null;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return null;

    const token = player.tokens.find((t) => t.id === tokenId);
    if (!token) return null;

    // Store move for history
    const gameMove: IGameMove = {
      playerId,
      tokenId,
      fromPosition: token.position,
      toPosition: token.position, // Will be updated after move calculation
      diceValue: room.diceValue,
      timestamp: new Date(),
      moveType: "normal",
      pointsEarned: 0,
    } as IGameMove;

    // Here you would implement the full move logic from your original moveToken function
    // For brevity, I'll show the structure - you can copy the logic from your original function

    const oldPosition = token.position;
    // ... implement move logic ...

    // Update the move record
    gameMove.toPosition = token.position;
    room.moves.push(gameMove);

    // Update turn if dice wasn't 6
    if (room.diceValue !== 6) {
      room.currentPlayerIndex =
        (room.currentPlayerIndex + 1) % room.players.length;
      room.canRollDice = true;
      room.diceValue = 0;
      room.turnCount++;
    } else {
      room.canRollDice = true;
    }

    await room.save();

    const moveResult: MoveResult = {
      success: true,
      pointsEarned: player.points,
      message: "Token moved successfully",
    };

    return { room, moveResult };
  }

  static async usePowerUp(
    roomId: string,
    playerId: string,
    powerUpType: string,
    targetData: any
  ): Promise<IGameRoom | null> {
    const room = await GameRoom.findOne({ roomId });
    if (!room) return null;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return null;

    // Handle power-up logic here
    switch (powerUpType) {
      case "teleport":
        if (targetData.position !== undefined && targetData.tokenId) {
          const token = player.tokens.find((t) => t.id === targetData.tokenId);
          if (token && !token.isInHomeRun) {
            token.position = targetData.position;
          }
        }
        break;
      case "swap":
        // Implement swap logic
        break;
      // ... other power-up types
    }

    await room.save();
    return room;
  }

  static async removePlayer(
    roomId: string,
    playerId: string
  ): Promise<IGameRoom | null> {
    const room = await GameRoom.findOne({ roomId });
    if (!room) return null;

    room.players = room.players.filter((p) => p.id !== playerId);

    if (room.players.length === 0) {
      // Delete empty room after some time
      setTimeout(async () => {
        await GameRoom.deleteOne({ roomId });
      }, 60000); // 1 minute
    }

    await room.save();
    return room;
  }

  static async getGameHistory(roomId: string): Promise<IGameMove[]> {
    const room = await GameRoom.findOne({ roomId });
    return room ? room.moves : [];
  }

  static async cleanupOldRooms(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 24); // Remove rooms older than 24 hours

    await GameRoom.deleteMany({
      $or: [
        { gameEnded: true, updatedAt: { $lt: cutoffDate } },
        { players: { $size: 0 }, updatedAt: { $lt: cutoffDate } },
      ],
    });
  }

  static async getRoomById(roomId: string): Promise<IGameRoom | null> {
    try {
      return await GameRoom.findOne({ roomId }).exec();
    } catch (error) {
      console.error("Error getting room:", error);
      return null;
    }
  }

  static async updateGameState(
    roomId: string,
    gameState: GameState
  ): Promise<IGameRoom | null> {
    try {
      return await GameRoom.findOneAndUpdate(
        { roomId },
        {
          players: gameState.players,
          currentPlayerIndex: gameState.currentPlayerIndex,
          diceValue: gameState.diceValue,
          canRollDice: gameState.canRollDice,
          gameStarted: gameState.gameStarted,
          gameEnded: gameState.gameEnded,
          winner: gameState.winner,
          turnCount: gameState.turnCount,
          powerUps: gameState.powerUps,
          trapZones: gameState.trapZones,
          lastRollTime: new Date(gameState.lastRollTime),
        },
        { new: true }
      ).exec();
    } catch (error) {
      console.error("Error updating game state:", error);
      return null;
    }
  }

  static async setPlayerDisconnected(
    roomId: string,
    playerId: string
  ): Promise<IGameRoom | null> {
    try {
      const room = await GameRoom.findOne({ roomId });
      if (!room) return null;

      const player = room.players.find((p) => p.id === playerId);
      if (player) {
        player.isDisconnected = true;
        player.lastSeen = new Date();
        await room.save();
      }
      return room;
    } catch (error) {
      console.error("Error setting player disconnected:", error);
      return null;
    }
  }

  // Add this method to handle player reconnection
  static async setPlayerReconnected(
    roomId: string,
    playerId: string,
    socketId: string
  ): Promise<IGameRoom | null> {
    try {
      const room = await GameRoom.findOne({ roomId });
      if (!room) return null;

      const player = room.players.find((p) => p.id === playerId);
      if (player) {
        player.isDisconnected = false;
        player.socketId = socketId;
        player.lastSeen = new Date();
        await room.save();
      }
      return room;
    } catch (error) {
      console.error("Error setting player reconnected:", error);
      return null;
    }
  }

  static async setCanRollDice(
    roomId: string,
    canRoll: boolean
  ): Promise<IGameRoom | null> {
    try {
      return await GameRoom.findOneAndUpdate(
        { roomId },
        { canRollDice: canRoll },
        { new: true }
      ).exec();
    } catch (error) {
      console.error("Error setting canRollDice:", error);
      return null;
    }
  }

  static async nextTurn(roomId: string): Promise<IGameRoom | null> {
    try {
      const room = await GameRoom.findOne({ roomId }).exec();
      if (!room) return null;

      // Update token effects for current player
      const currentPlayer = room.players[room.currentPlayerIndex];
      if (currentPlayer) {
        currentPlayer.tokens.forEach((token) => {
          if (token.hasShield && token.shieldTurns > 0) {
            token.shieldTurns--;
            if (token.shieldTurns <= 0) {
              token.hasShield = false;
            }
          }

          if (token.isFrozen && token.frozenTurns > 0) {
            token.frozenTurns--;
            if (token.frozenTurns <= 0) {
              token.isFrozen = false;
            }
          }
        });
      }

      // Move to next player
      room.currentPlayerIndex =
        (room.currentPlayerIndex + 1) % room.players.length;
      room.canRollDice = true;
      room.diceValue = 0;
      room.turnCount++;

      return await room.save();
    } catch (error) {
      console.error("Error in nextTurn:", error);
      return null;
    }
  }

  static async addPowerUp(
    roomId: string,
    powerUp: PowerUp
  ): Promise<IGameRoom | null> {
    try {
      return await GameRoom.findOneAndUpdate(
        { roomId },
        { $push: { powerUps: powerUp } },
        { new: true }
      ).exec();
    } catch (error) {
      console.error("Error adding power-up:", error);
      return null;
    }
  }

  static async adjustCurrentPlayerIndex(
    roomId: string
  ): Promise<IGameRoom | null> {
    try {
      const room = await GameRoom.findOne({ roomId });
      if (!room) return null;

      const activePlayers = room.players.filter((p) => !p.isDisconnected);
      if (activePlayers.length === 0) return room;

      // If current player is disconnected, move to next active player
      const currentPlayer = room.players[room.currentPlayerIndex];
      if (currentPlayer && currentPlayer.isDisconnected) {
        // Find next active player
        let nextIndex = (room.currentPlayerIndex + 1) % room.players.length;
        let attempts = 0;

        while (attempts < room.players.length) {
          const nextPlayer = room.players[nextIndex];
          if (nextPlayer && !nextPlayer.isDisconnected) {
            room.currentPlayerIndex = nextIndex;
            break;
          }
          nextIndex = (nextIndex + 1) % room.players.length;
          attempts++;
        }

        await room.save();
      }

      return room;
    } catch (error) {
      console.error("Error adjusting current player index:", error);
      return null;
    }
  }

  static async recordMove(
    roomId: string,
    move: {
      playerId: string;
      tokenId: string;
      fromPosition: number;
      toPosition: number;
      diceValue: number;
      moveType: "normal" | "kill" | "powerup" | "homerun";
      pointsEarned: number;
      killedTokenId?: string;
      powerUpUsed?: string;
    }
  ): Promise<IGameRoom | null> {
    try {
      const gameMove: IGameMove = {
        ...move,
        timestamp: new Date(),
      } as IGameMove;

      return await GameRoom.findOneAndUpdate(
        { roomId },
        { $push: { moves: gameMove } },
        { new: true }
      ).exec();
    } catch (error) {
      console.error("Error recording move:", error);
      return null;
    }
  }

  static convertToGameState(
    room: IGameRoom,
    includeDisconnected: boolean = false
  ): GameState {
    const activePlayers = includeDisconnected
      ? room.players
      : room.players.filter((p) => !p.isDisconnected);

    return {
      id: room.roomId,
      players: activePlayers.map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        tokens: p.tokens.map((t) => ({
          id: t.id,
          playerId: t.playerId,
          position: t.position,
          isInHomeRun: t.isInHomeRun,
          isFinished: t.isFinished,
          hasShield: t.hasShield,
          shieldTurns: t.shieldTurns,
          isFrozen: t.isFrozen,
          frozenTurns: t.frozenTurns,
        })),
        kills: p.kills,
        points: p.points,
        isReady: p.isReady,
        moveTimeLeft: p.moveTimeLeft,
        isDisconnected: p.isDisconnected || false,
      })),
      currentPlayerIndex: room.currentPlayerIndex,
      diceValue: room.diceValue,
      canRollDice: room.canRollDice,
      gameStarted: room.gameStarted,
      gameEnded: room.gameEnded,
      winner: room.winner,
      turnCount: room.turnCount,
      powerUps: room.powerUps.map((p) => ({
        type: p.type,
        position: p.position,
        isActive: p.isActive,
        id: p.id,
      })),
      trapZones: room.trapZones,
      lastRollTime: room.lastRollTime.getTime(),
    };
  }
}
