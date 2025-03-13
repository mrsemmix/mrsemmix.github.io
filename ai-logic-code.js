/**
 * ai-player.js
 * Improved AI logic for offline mode with personality traits
 */

class AIPlayer {
  constructor(id, name, gameManager) {
    this.id = id;
    this.name = name;
    this.gameManager = gameManager;
    
    // AI personality traits (0-1 range)
    this.traits = {
      aggression: Math.random() * 0.6 + 0.2, // 0.2-0.8 range
      bluffing: Math.random() * 0.5 + 0.2,   // 0.2-0.7 range
      consistency: Math.random() * 0.4 + 0.4, // 0.4-0.8 range
      tightness: Math.random() * 0.4 + 0.3    // 0.3-0.7 range
    };
    
    // AI memory
    this.memory = {
      lastAction: null,
      roundsPlayed: 0,
      handsWon: 0,
      largestPot: 0,
      lastPlayerActions: {},  // Track actions of other players
      elementPreference: this.selectRandomElementPreference()
    };
    
    console.log(`AI ${name} created with traits:`, this.traits);
  }
  
  /**
   * Select a random element preference for this AI
   * @returns {String} Preferred element
   */
  selectRandomElementPreference() {
    const elements = ["Fire", "Water", "Earth", "Air"];
    return elements[Math.floor(Math.random() * elements.length)];
  }
  
  /**
   * Make an AI decision
   * @returns {Object} Action object with type and amount
   */
  makeDecision() {
    // Get current game state
    const gameState = this.gameManager.state;
    
    // AI player object
    const player = gameState.players.find(p => p.id === this.id);
    if (!player || player.folded || player.allIn) {
      return { type: 'check' }; // Default if player can't act (shouldn't happen)
    }
    
    // Evaluate hand strength
    const handStrength = this.evaluateHandStrength(player, gameState);
    
    // Current betting situation
    const callAmount = gameState.currentBet - player.bet;
    const potSize = gameState.pot;
    const stackRatio = player.stack / this.gameManager.config.startingStack;
    
    // Calculate effective pot odds
    const potOdds = callAmount > 0 ? callAmount / (potSize + callAmount) : 0;
    
    // Game stage
    const isEarlyStage = gameState.currentStage === 'preflop' || gameState.currentStage === 'arena';
    const isLateStage = gameState.currentStage === 'power3';
    
    // Position advantage
    const positionAdvantage = this.getPositionAdvantage(gameState);
    
    // Adjust hand strength based on various factors
    let adjustedStrength = handStrength;
    
    // Adjust for position
    adjustedStrength += positionAdvantage * 0.1;
    
    // Adjust for stack size (more conservative when short-stacked)
    if (stackRatio < 0.3) {
      adjustedStrength *= (0.7 + (stackRatio * 0.3));
    }
    
    // Adjust for stage (more careful in early stages)
    if (isEarlyStage) {
      adjustedStrength *= 0.9;
    } else if (isLateStage) {
      adjustedStrength *= 1.1;
    }
    
    // Adjust for personality traits
    adjustedStrength += (this.traits.aggression - 0.5) * 0.2;
    
    // Should we bluff?
    const shouldBluff = Math.random() < this.traits.bluffing * (1 - handStrength);
    
    // Decision making
    if (callAmount === 0) {
      // No bet to call - decide whether to check or bet
      if (adjustedStrength > 0.7 || (adjustedStrength > 0.5 && Math.random() < this.traits.aggression)) {
        // Strong hand or medium with aggression - bet
        const betSize = this.calculateBetSize(adjustedStrength, potSize, player.stack);
        return { type: 'bet', amount: betSize };
      } else if (shouldBluff && isLateStage) {
        // Weak hand but bluffing in late stage
        const bluffSize = this.calculateBluffSize(potSize, player.stack);
        return { type: 'bet', amount: bluffSize };
      } else {
        // Otherwise check
        return { type: 'check' };
      }
    } else {
      // There's a bet to call
      if (adjustedStrength > 0.8 || (adjustedStrength > 0.65 && Math.random() < this.traits.aggression)) {
        // Very strong hand or strong with aggression - raise
        const raiseAmount = this.calculateRaiseAmount(adjustedStrength, gameState.currentBet, potSize, player.stack, player.bet);
        return { type: 'raise', amount: raiseAmount };
      } else if (adjustedStrength > 0.5 || (adjustedStrength > potOdds * 1.2)) {
        // Medium hand or odds favor calling
        return { type: 'call' };
      } else if (shouldBluff && callAmount < player.stack * 0.15) {
        // Weak hand but bluffing and call is small
        return { type: 'call' };
      } else if (callAmount >= player.stack * 0.7) {
        // Facing a large bet with a weak hand - all in or fold based on strength
        return adjustedStrength > 0.4 ? { type: 'allIn' } : { type: 'fold' };
      } else {
        // Otherwise fold
        return { type: 'fold' };
      }
    }
  }
  
  /**
   * Evaluate hand strength (0-1 range)
   * @param {Object} player - Player object
   * @param {Object} gameState - Game state
   * @returns {Number} Hand strength
   */
  evaluateHandStrength(player, gameState) {
    if (!player.hand || player.hand.length === 0) return 0;
    
    // Get the total hand value with bonuses
    let totalValue = 0;
    player.hand.forEach(card => {
      totalValue += this.gameManager.calculateCardValue(card);
    });
    
    // Determine maximum possible value based on current stage
    let maxPossibleValue = 0;
    
    // Base maximum for two monster cards (13x2=26)
    let baseMax = 26;
    
    // Add arena bonus (maximum +8 if both cards match arena)
    if (gameState.currentStage !== 'preflop' && gameState.arenaCard) {
      baseMax += 8;
    }
    
    // Add power card bonuses
    if (gameState.currentStage === 'power1' || gameState.currentStage === 'power2' || gameState.currentStage === 'power3') {
      // Maximum +5 per matching power card
      baseMax += gameState.powerCards.length * 5;
    }
    
    // Calculate strength ratio (0-1)
    let strength = totalValue / baseMax;
    
    // Adjust for element preference
    if (player.hand.some(card => card.element === this.memory.elementPreference)) {
      strength += 0.05;
    }
    
    // Ensure strength is in 0-1 range
    return Math.max(0, Math.min(1, strength));
  }
  
  /**
   * Calculate position advantage
   * @param {Object} gameState - Game state
   * @returns {Number} Position advantage (0-1)
   */
  getPositionAdvantage(gameState) {
    const playerCount = gameState.players.filter(p => !p.folded).length;
    if (playerCount <= 1) return 0;
    
    // Later positions have more advantage
    const playerIndex = gameState.players.findIndex(p => p.id === this.id);
    const dealerIndex = gameState.dealerPosition;
    
    // Calculate positions after dealer
    let positionFromDealer = (playerIndex - dealerIndex + gameState.players.length) % gameState.players.length;
    
    // Normalize to 0-1 range (late position = higher value)
    return positionFromDealer / (gameState.players.length - 1);
  }
  
  /**
   * Calculate bet size based on hand strength and pot
   * @param {Number} strength - Hand strength
   * @param {Number} potSize - Current pot size
   * @param {Number} stack - Player stack
   * @returns {Number} Bet amount
   */
  calculateBetSize(strength, potSize, stack) {
    // Base bet on pot size and hand strength
    let betRatio = 0.3 + (strength * 0.5); // 30-80% of pot based on strength
    
    // Adjust by aggression
    betRatio *= (0.7 + (this.traits.aggression * 0.6)); // 70-130% adjustment
    
    // Calculate raw bet amount
    let betAmount = Math.floor(potSize * betRatio);
    
    // Ensure bet is between big blind and stack size
    betAmount = Math.max(10, Math.min(betAmount, stack));
    
    // Round to a "nice" number
    return this.roundBetToNiceNumber(betAmount);
  }
  
  /**
   * Calculate raise amount
   * @param {Number} strength - Hand strength
   * @param {Number} currentBet - Current bet
   * @param {Number} potSize - Current pot size
   * @param {Number} stack - Player stack
   * @param {Number} playerBet - Player's current bet
   * @returns {Number} Raise to amount
   */
  calculateRaiseAmount(strength, currentBet, potSize, stack, playerBet) {
    // Base raise on current bet and pot size
    let raiseRatio = 0.5 + (strength * 0.8); // 50-130% of current bet based on strength
    
    // Adjust by aggression
    raiseRatio *= (0.8 + (this.traits.aggression * 0.4)); // 80-120% adjustment
    
    // Calculate raw raise amount
    let raiseToAmount = Math.floor(currentBet * (1 + raiseRatio));
    
    // Ensure raise is valid (at least min raise and at most stack size)
    const callAmount = currentBet - playerBet;
    const maxRaise = stack + playerBet;
    raiseToAmount = Math.max(currentBet + 10, Math.min(raiseToAmount, maxRaise));
    
    // Round to a "nice" number
    return this.roundBetToNiceNumber(raiseToAmount);
  }
  
  /**
   * Calculate bluff size
   * @param {Number} potSize - Current pot size
   * @param {Number} stack - Player stack
   * @returns {Number} Bluff amount
   */
  calculateBluffSize(potSize, stack) {
    // Bluff is smaller with low bluffing trait, larger with high
    let bluffRatio = 0.2 + (this.traits.bluffing * 0.4); // 20-60% of pot
    
    // Calculate raw bluff amount
    let bluffAmount = Math.floor(potSize * bluffRatio);
    
    // Ensure bluff is between big blind and 30% of stack
    bluffAmount = Math.max(10, Math.min(bluffAmount, stack * 0.3));
    
    // Round to a "nice" number
    return this.roundBetToNiceNumber(bluffAmount);
  }
  
  /**
   * Round bet to a "nice" number
   * @param {Number} amount - Raw amount
   * @returns {Number} Rounded amount
   */
  roundBetToNiceNumber(amount) {
    // Round to multiples of 5 or 10 based on size
    if (amount < 50) {
      return Math.ceil(amount / 5) * 5;
    } else if (amount < 200) {
      return Math.ceil(amount / 10) * 10;
    } else {
      return Math.ceil(amount / 25) * 25;
    }
  }
  
  /**
   * Record game result for learning
   * @param {Boolean} won - Whether AI won
   * @param {Number} finalPot - Final pot size
   */
  recordGameResult(won, finalPot) {
    this.memory.roundsPlayed++;
    if (won) {
      this.memory.handsWon++;
    }
    if (finalPot > this.memory.largestPot) {
      this.memory.largestPot = finalPot;
    }
  }
}

// Export in browser environment
if (typeof window !== 'undefined') {
  window.AIPlayer = AIPlayer;
}
