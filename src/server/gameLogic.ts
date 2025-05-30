// File: src/server/gameLogic.ts
import type { 
  GameState, 
  Player, 
  Token, 
  Cell, 
  GameRules, 
  PlayerColor, 
  CellType, 
  PowerUpType 
} from '../types/game.js';
import { SAFE_POSITIONS } from '../types/board.js';

export class GameLogic {
  static initializeGame(players: Player[], rules: GameRules): GameState {
    const board = this.createBoard(rules);
    
    return {
      id: Math.random().toString(36).substring(2, 15),
      players: players.map(p => ({ ...p, points: 0, kills: 0 })),
      currentPlayerIndex: 0,
      board,
      dice: 0,
      diceRolled: false,
      gameStarted: true,
      gameEnded: false,
      rules,
      turnCount: 0,
      killZoneActive: false
    };
  }

  static createBoard(rules: GameRules): Cell[] {
    const board: Cell[] = [];
    
    for (let i = 0; i < 52; i++) {
      const cell: Cell = {
        position: i,
        type: SAFE_POSITIONS.includes(i) ? CellType.SAFE : CellType.NORMAL,
        occupiedBy: []
      };
      
      // Add power-ups randomly if enabled
      if (rules.powerUps && Math.random() < 0.1) {
        cell.type = CellType.POWER_UP;
        cell.powerUp = this.getRandomPowerUp();
      }
      
      // Add trap zones randomly if enabled
      if (rules.trapZones && Math.random() < 0.08 && cell.type === CellType.NORMAL) {
        cell.type = CellType.TRAP;
        cell.isTrap = true;
      }
      
      board.push(cell);
    }
    
    return board;
  }

  static getRandomPowerUp(): PowerUpType {
    const powerUps = [PowerUpType.SHIELD, PowerUpType.SPEED_BOOST, PowerUpType.TELEPORT, PowerUpType.SWAP];
    return powerUps[Math.floor(Math.random() * powerUps.length)];
  }

  static hasValidMoves(gameState: GameState, player: Player): boolean {
    if (!gameState.diceRolled) return false;
    
    return player.tokens.some(token => this.canMoveToken(gameState, token, gameState.dice));
  }

  static canMoveToken(gameState: GameState, token: Token, steps: number): boolean {
    // Token frozen
    if (token.powerUps.frozen > 0) return false;
    
    // Token at home needs 6 to start
    if (token.position === -1) return steps === 6;
    
    // Token in finish area
    if (token.position >= 52) {
      const finishPosition = token.position - 52;
      return finishPosition + steps <= 5;
    }
    
    // Regular board position
    const newPosition = token.position + steps;
    return newPosition <= 51 || (newPosition > 51 && newPosition - 52 <= 5);
  }

  static moveToken(
    gameState: GameState, 
    playerId: string, 
    tokenId: string, 
    targetPosition: number
  ): { success: boolean; moveData?: any; killedTokens?: string[] } {
    const player = gameState.players.find(p => p.id === playerId);
    const token = player?.tokens.find(t => t.id === tokenId);
    
    if (!player || !token || !gameState.diceRolled) {
      return { success: false };
    }

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) {
      return { success: false };
    }

    let steps = gameState.dice;
    if (token.powerUps.speedBoost) {
      steps *= 2;
      token.powerUps.speedBoost = false;
    }

    if (!this.canMoveToken(gameState, token, steps)) {
      return { success: false };
    }

    const oldPosition = token.position;
    let newPosition: number;

    // Moving from home
    if (token.position === -1) {
      newPosition = this.getStartPosition(token.color);
      token.isActive = true;
    } else {
      newPosition = this.calculateNewPosition(token, steps, gameState);
    }

    // Update token position
    token.position = newPosition;

    // Remove from old cell
    if (oldPosition >= 0 && oldPosition < 52) {
      const oldCell = gameState.board[oldPosition];
      oldCell.occupiedBy = oldCell.occupiedBy?.filter(id => id !== tokenId) || [];
    }

    // Handle cell effects and conflicts
    const killedTokens = this.handleCellEffects(gameState, token, player, newPosition);

    // Update dice rolled state
    gameState.diceRolled = false;

    // Check win condition
    if (this.checkWinCondition(player)) {
      gameState.gameEnded = true;
      gameState.winner = playerId;
    }

    const moveData = {
      playerId,
      tokenId,
      from: oldPosition,
      to: newPosition,
      killed: killedTokens
    };

    gameState.lastMove = moveData;

    return { success: true, moveData, killedTokens };
  }

  static handleCellEffects(
    gameState: GameState, 
    token: Token, 
    player: Player, 
    position: number
  ): string[] {
    const killedTokens: string[] = [];

    if (position >= 0 && position < 52) {
      const cell = gameState.board[position];
      
      // Handle power-up collection
      if (cell.type === CellType.POWER_UP && cell.powerUp) {
        this.applyPowerUp(token, cell.powerUp);
        cell.powerUp = undefined;
        cell.type = CellType.NORMAL;
      }

      // Handle trap effects
      if (cell.type === CellType.TRAP) {
        if (Math.random() < 0.5) {
          // Move back 3 steps
          const newPos = Math.max(0, position - 3);
          token.position = newPos;
        } else {
          // Freeze for 1 turn
          token.powerUps.frozen = 1;
        }
      }

      // Handle token conflicts (killing)
      const conflictingTokens = this.findConflictingTokens(gameState, token, position);
      for (const conflictToken of conflictingTokens) {
        if (this.shouldKillToken(gameState, token, conflictToken)) {
          this.killToken(gameState, conflictToken, player);
          killedTokens.push(conflictToken.id);
        }
      }

      // Add token to cell
      if (!cell.occupiedBy) cell.occupiedBy = [];
      cell.occupiedBy.push(token.id);
    }

    return killedTokens;
  }

  static findConflictingTokens(gameState: GameState, movingToken: Token, position: number): Token[] {
    const conflictingTokens: Token[] = [];
    
    for (const player of gameState.players) {
      for (const token of player.tokens) {
        if (token.id !== movingToken.id && token.position === position && token.isActive) {
          conflictingTokens.push(token);
        }
      }
    }
    
    return conflictingTokens;
  }

  static shouldKillToken(gameState: GameState, attackingToken: Token, defendingToken: Token): boolean {
    // Same color tokens can't kill each other (unless kill zone mode)
    if (attackingToken.color === defendingToken.color && !gameState.killZoneActive) {
      return false;
    }

    // Safe positions protect tokens
    if (SAFE_POSITIONS.includes(defendingToken.position)) {
      return false;
    }

    // Shield protects token
    if (defendingToken.powerUps.shield > 0) {
      defendingToken.powerUps.shield--;
      return false;
    }

    return true;
  }

  static killToken(gameState: GameState, token: Token, killerPlayer: Player): void {
    // Find the owner of the killed token
    const tokenPlayer = gameState.players.find(p => 
      p.tokens.some(t => t.id === token.id)
    );

    if (!tokenPlayer) return;

    // Handle reverse kill rule
    if (gameState.rules.reverseKill && tokenPlayer.kills > killerPlayer.kills) {
      // Killer's token goes home instead
      const killerToken = killerPlayer.tokens.find(t => t.position === token.position);
      if (killerToken) {
        this.sendTokenHome(gameState, killerToken);
        return;
      }
    }

    // Normal kill
    this.sendTokenHome(gameState, token);
    killerPlayer.kills++;
    
    if (gameState.rules.pointsSystem) {
      killerPlayer.points += 10;
      tokenPlayer.points -= 5;
    }
  }

  static sendTokenHome(gameState: GameState, token: Token): void {
    // Remove from current cell
    if (token.position >= 0 && token.position < 52) {
      const cell = gameState.board[token.position];
      cell.occupiedBy = cell.occupiedBy?.filter(id => id !== token.id) || [];
    }

    token.position = -1;
    token.isActive = false;
    token.powerUps = { shield: 0, speedBoost: false, frozen: 0 };
  }

  static calculateNewPosition(token: Token, steps: number, gameState: GameState): number {
    const startPosition = this.getStartPosition(token.color);
    let currentPosition = token.position;
    
    // Handle finish area
    if (currentPosition >= 52) {
      return Math.min(57, currentPosition + steps);
    }
    
    // Calculate new position on main board
    let newPosition = currentPosition + steps;
    
    // Check if entering finish area
    const distanceFromStart = this.getDistanceFromStart(currentPosition, startPosition);
    if (distanceFromStart + steps >= 51) {
      const finishSteps = (distanceFromStart + steps) - 51;
      return 52 + finishSteps;
    }
    
    // Wrap around the board
    if (newPosition > 51) {
      newPosition = newPosition - 52;
    }
    
    return newPosition;
  }

  static getStartPosition(color: PlayerColor): number {
    const starts = {
      [PlayerColor.RED]: 0,
      [PlayerColor.GREEN]: 13,
      [PlayerColor.YELLOW]: 26,
      [PlayerColor.BLUE]: 39
    };
    return starts[color];
  }

  static getDistanceFromStart(position: number, startPosition: number): number {
    if (position >= startPosition) {
      return position - startPosition;
    } else {
      return (52 - startPosition) + position;
    }
  }

  static applyPowerUp(token: Token, powerUp: PowerUpType): void {
    switch (powerUp) {
      case PowerUpType.SHIELD:
        token.powerUps.shield = 2;
        break;
      case PowerUpType.SPEED_BOOST:
        token.powerUps.speedBoost = true;
        break;
      // TELEPORT and SWAP are handled differently
    }
  }

  static usePowerUp(
    gameState: GameState, 
    playerId: string, 
    powerUp: PowerUpType, 
    targetData?: any
  ): boolean {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return false;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return false;

    switch (powerUp) {
      case PowerUpType.TELEPORT:
        return this.handleTeleport(gameState, player, targetData);
      case PowerUpType.SWAP:
        return this.handleSwap(gameState, player, targetData);
      default:
        return false;
    }
  }

  static handleTeleport(gameState: GameState, player: Player, targetData: any): boolean {
    const { tokenId, targetPosition } = targetData;
    const token = player.tokens.find(t => t.id === tokenId);
    
    if (!token || !token.isActive || targetPosition < 0 || targetPosition >= 52) {
      return false;
    }

    // Check if target position is occupied by own tokens
    const cell = gameState.board[targetPosition];
    const hasOwnToken = cell.occupiedBy?.some(id => 
      player.tokens.some(t => t.id === id)
    );
    
    if (hasOwnToken) return false;

    // Remove from old position
    if (token.position >= 0 && token.position < 52) {
      const oldCell = gameState.board[token.position];
      oldCell.occupiedBy = oldCell.occupiedBy?.filter(id => id !== tokenId) || [];
    }

    // Move to new position
    token.position = targetPosition;
    cell.occupiedBy = cell.occupiedBy || [];
    cell.occupiedBy.push(tokenId);

    return true;
  }

  static handleSwap(gameState: GameState, player: Player, targetData: any): boolean {
    const { tokenId, targetTokenId } = targetData;
    const ownToken = player.tokens.find(t => t.id === tokenId);
    
    if (!ownToken || !ownToken.isActive) return false;

    // Find target token
    let targetToken: Token | undefined;
    let targetPlayer: Player | undefined;
    
    for (const p of gameState.players) {
      const token = p.tokens.find(t => t.id === targetTokenId);
      if (token) {
        targetToken = token;
        targetPlayer = p;
        break;
      }
    }

    if (!targetToken || !targetToken.isActive || !targetPlayer) return false;

    // Swap positions
    const ownPos = ownToken.position;
    const targetPos = targetToken.position;

    // Update board cells
    if (ownPos >= 0 && ownPos < 52) {
      const cell = gameState.board[ownPos];
      cell.occupiedBy = cell.occupiedBy?.filter(id => id !== tokenId) || [];
      cell.occupiedBy.push(targetTokenId);
    }

    if (targetPos >= 0 && targetPos < 52) {
      const cell = gameState.board[targetPos];
      cell.occupiedBy = cell.occupiedBy?.filter(id => id !== targetTokenId) || [];
      cell.occupiedBy.push(tokenId);
    }

    ownToken.position = targetPos;
    targetToken.position = ownPos;

    return true;
  }

  static nextTurn(gameState: GameState): void {
    // Update power-up durations
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    for (const token of currentPlayer.tokens) {
      if (token.powerUps.shield > 0) token.powerUps.shield--;
      if (token.powerUps.frozen > 0) token.powerUps.frozen--;
    }

    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    gameState.turnCount++;

    // Check for kill zone activation
    if (gameState.rules.killZoneMode && gameState.turnCount % gameState.rules.killZoneInterval === 0) {
      gameState.killZoneActive = !gameState.killZoneActive;
    }

    // Award round completion points
    if (gameState.rules.pointsSystem && gameState.currentPlayerIndex === 0) {
      for (const player of gameState.players) {
        player.points += 2;
      }
    }
  }

  static checkWinCondition(player: Player): boolean {
    return player.tokens.every(token => token.position >= 57);
  }
}