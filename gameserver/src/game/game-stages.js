/**
 * Game Stages
 * Manages game stage progression and transitions
 */

class GameStages {
    constructor(gameManager) {
      this.gameManager = gameManager;
    }
  
    /**
     * Advance to the next game stage
     * @param {string} roomCode - Room code
     * @returns {Object} Result of stage advancement
     */
    advanceGameStage(roomCode) {
      const room = this.gameManager.roomManager.getRoom(roomCode);
      if (!room || !room.gameState) return { success: false, error: 'Game not found' };
      
      const gameState = room.gameState;
      
      // Reset bets for the new round
      gameState.players.forEach(player => {
        player.bet = 0;
      });
      
      // Reset betting variables
      gameState.currentBet = 0;
      gameState.playersActedThisRound = [];
      gameState.lastRaiser = null;
      
      let stageResult = null;
      
      // Determine the next stage
      switch (gameState.currentStage) {
        case 'preflop':
          // Deal arena card (community card)
          stageResult = this.dealArenaCard(roomCode);
          gameState.currentStage = 'arena';
          break;
        case 'arena':
          // Deal first power card
          stageResult = this.dealPowerCard(roomCode);
          gameState.currentStage = 'power1';
          break;
        case 'power1':
          // Deal second power card
          stageResult = this.dealPowerCard(roomCode);
          gameState.currentStage = 'power2';
          break;
        case 'power2':
          // Deal third power card
          stageResult = this.dealPowerCard(roomCode);
          gameState.currentStage = 'power3';
          break;
        case 'power3':
          // Go to showdown
          return this.showdown(roomCode);
      }
      
      // Set active player for the new round (first active player after dealer)
      gameState.activePlayerIndex = (gameState.dealerPosition + 1) % gameState.players.length;
      
      // Skip folded and all-in players
      let loopCount = 0;
      while (
        gameState.players[gameState.activePlayerIndex].folded || 
        gameState.players[gameState.activePlayerIndex].allIn
      ) {
        gameState.activePlayerIndex = (gameState.activePlayerIndex + 1) % gameState.players.length;
        loopCount++;
        
        // If all players are folded or all-in, go to showdown
        if (loopCount >= gameState.players.length) {
          return this.showdown(roomCode);
        }
      }
      
      room.activePlayerIndex = gameState.activePlayerIndex;
      
      return {
        success: true,
        stage: gameState.currentStage,
        stageResult,
        nextPlayer: {
          id: gameState.players[gameState.activePlayerIndex].id,
          name: gameState.players[gameState.activePlayerIndex].name
        },
        gameState: this.gameManager.getGameStateForBroadcast(roomCode)
      };
    }
  
    /**
     * Deal arena card (community card)
     * @param {string} roomCode - Room code
     * @returns {Object} Arena card info
     */
    dealArenaCard(roomCode) {
      const room = this.gameManager.roomManager.getRoom(roomCode);
      if (!room || !room.gameState) return null;
      
      // Create arena card
      const arenaCard = this.gameManager.deckManager.generateArenaCard();
      room.gameState.arenaCard = arenaCard;
      
      return arenaCard;
    }
  
    /**
     * Deal power card (community card)
     * @param {string} roomCode - Room code
     * @returns {Object} Power card info
     */
    dealPowerCard(roomCode) {
      const room = this.gameManager.roomManager.getRoom(roomCode);
      if (!room || !room.gameState) return null;
      
      // Create power card
      const powerCard = this.gameManager.deckManager.generatePowerCard();
      room.gameState.powerCards.push(powerCard);
      
      return {
        card: powerCard,
        stage: room.gameState.currentStage
      };
    }
  
    /**
     * Showdown - evaluate hands and determine winner
     * @param {string} roomCode - Room code
     * @returns {Object} Showdown results
     */
    showdown(roomCode) {
      const room = this.gameManager.roomManager.getRoom(roomCode);
      if (!room || !room.gameState) return { success: false, error: 'Game not found' };
      
      room.gameState.currentStage = 'showdown';
      
      // For simplicity in this POC, evaluate hands based on summing card values
      // In a real implementation, you'd use proper poker hand evaluation
      const results = room.gameState.players.map(player => {
        if (player.folded) {
          return { player, value: -1 };
        }
        
        // Calculate hand value (sum of card values)
        const handValue = player.hand.reduce((sum, card) => sum + card.value, 0);
        
        return { player, value: handValue };
      });
      
      // Sort by hand value (highest first)
      results.sort((a, b) => b.value - a.value);
      
      // Find winner(s)
      const winners = results.filter(r => r.value === results[0].value && r.value >= 0);
      
      // Split pot if there are multiple winners
      const potPerWinner = Math.floor(room.gameState.pot / winners.length);
      
      // Award pot
      winners.forEach(winner => {
        winner.player.stack += potPerWinner;
      });
      
      return {
        success: true,
        winners: winners.map(w => ({
          id: w.player.id,
          name: w.player.name,
          handValue: w.value,
          potWon: potPerWinner
        })),
        hands: room.gameState.players.map(p => ({
          id: p.id,
          name: p.name,
          hand: p.hand,
          folded: p.folded
        }))
      };
    }
  
    /**
     * End a hand when only one player remains
     * @param {Object} winner - Winning player
     * @param {Object} room - Room object
     * @returns {Object} Hand end result
     */
    endHand(winner, room) {
      // Award pot to winner
      winner.stack += room.gameState.pot;
      
      // Set game stage to showdown
      room.gameState.currentStage = 'showdown';
      
      return {
        success: true,
        winners: [{
          id: winner.id,
          name: winner.name,
          handValue: 'N/A',
          potWon: room.gameState.pot
        }],
        message: `${winner.name} wins as the only remaining player!`
      };
    }
  
    /**
     * End the current game
     * @param {string} roomCode - Room code
     * @returns {Object} Game end result
     */
    endGame(roomCode) {
      const room = this.gameManager.roomManager.getRoom(roomCode);
      if (!room) return { success: false, error: 'Room not found' };
      
      // End the current game
      room.gameInProgress = false;
      room.gameState = null;
      
      // Reset player ready status
      Object.values(room.players).forEach(player => {
        player.ready = false;
      });
      
      return {
        success: true,
        message: 'Hand complete. Ready up for the next hand!'
      };
    }
  }
  
  module.exports = GameStages;