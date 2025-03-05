/**
 * Game Actions
 * Handles player actions during the game
 */

class GameActions {
    constructor(gameManager) {
      this.gameManager = gameManager;
    }
  
    /**
     * Handle check action
     * @param {Object} room - Room object
     * @param {Object} player - Player object
     * @returns {Object} Result of the action
     */
    handleCheckAction(room, player) {
      // Check if check is valid
      if (room.gameState.currentBet > 0 && player.bet < room.gameState.currentBet) {
        return { success: false, error: 'Cannot check when there is a bet' };
      }
      
      return { success: true };
    }
  
    /**
     * Handle fold action
     * @param {Object} room - Room object
     * @param {Object} player - Player object
     * @returns {Object} Result of the action
     */
    handleFoldAction(room, player) {
      player.folded = true;
      player.active = false;
      
      return { success: true };
    }
  
    /**
     * Handle call action
     * @param {Object} room - Room object
     * @param {Object} player - Player object
     * @returns {Object} Result of the action
     */
    handleCallAction(room, player) {
      const callAmount = Math.min(room.gameState.currentBet - player.bet, player.stack);
      
      player.stack -= callAmount;
      room.gameState.pot += callAmount;
      player.bet += callAmount;
      player.totalBet += callAmount;
      
      // Check for all-in
      if (player.stack === 0) {
        player.allIn = true;
      }
      
      return { success: true, amount: callAmount };
    }
  
    /**
     * Handle bet action
     * @param {Object} room - Room object
     * @param {Object} player - Player object
     * @param {number} betAmount - Amount to bet
     * @returns {Object} Result of the action
     */
    handleBetAction(room, player, betAmount) {
      // Validate bet amount
      if (betAmount <= 0) {
        return { success: false, error: 'Invalid bet amount' };
      }
      
      if (betAmount > player.stack) {
        return { success: false, error: 'Not enough chips' };
      }
      
      player.stack -= betAmount;
      room.gameState.pot += betAmount;
      player.bet = betAmount;
      player.totalBet += betAmount;
      room.gameState.currentBet = betAmount;
      room.gameState.lastRaiser = player.id;
      
      // Reset players acted this round, except the current player
      room.gameState.playersActedThisRound = [player.id];
      
      return { success: true, amount: betAmount };
    }
  
    /**
     * Handle raise action
     * @param {Object} room - Room object
     * @param {Object} player - Player object
     * @param {number} raiseAmount - Additional amount above current bet
     * @returns {Object} Result of the action
     */
    handleRaiseAction(room, player, raiseAmount) {
      // Calculate total bet (current bet + raise)
      const totalBet = room.gameState.currentBet + raiseAmount;
      
      // Validate raise
      if (raiseAmount <= 0) {
        return { success: false, error: 'Invalid raise amount' };
      }
      
      if (totalBet > (player.stack + player.bet)) {
        return { success: false, error: 'Not enough chips' };
      }
      
      const actualAmount = totalBet - player.bet;
      
      player.stack -= actualAmount;
      room.gameState.pot += actualAmount;
      player.bet = totalBet;
      player.totalBet += actualAmount;
      room.gameState.currentBet = totalBet;
      room.gameState.lastRaiser = player.id;
      
      // Reset players acted this round, except the current player
      room.gameState.playersActedThisRound = [player.id];
      
      return { success: true, amount: totalBet };
    }
  
    /**
     * Handle all-in action
     * @param {Object} room - Room object
     * @param {Object} player - Player object
     * @returns {Object} Result of the action
     */
    handleAllInAction(room, player) {
      const allInAmount = player.stack;
      const totalBet = player.bet + allInAmount;
      
      room.gameState.pot += allInAmount;
      player.bet = totalBet;
      player.totalBet += allInAmount;
      player.stack = 0;
      player.allIn = true;
      
      // Update current bet if this all-in is a raise
      if (totalBet > room.gameState.currentBet) {
        room.gameState.currentBet = totalBet;
        room.gameState.lastRaiser = player.id;
        
        // Reset players acted this round, except the current player
        room.gameState.playersActedThisRound = [player.id];
      }
      
      return { success: true, amount: totalBet };
    }
  
    /**
     * Check if betting round is complete
     * @param {Object} room - Room object
     * @returns {boolean} True if betting round is complete
     */
    isBettingRoundComplete(room) {
      const gameState = room.gameState;
      const activePlayers = gameState.players.filter(p => !p.folded && !p.allIn);
      
      // If no active players (all folded or all-in), betting is complete
      if (activePlayers.length === 0) {
        return true;
      }
      
      // Check if all players have acted and matched the current bet
      const allActed = activePlayers.every(p => 
        gameState.playersActedThisRound.includes(p.id)
      );
      
      const allMatched = activePlayers.every(p => 
        p.bet === gameState.currentBet || p.allIn
      );
      
      return allActed && allMatched;
    }
  }
  
  module.exports = GameActions;