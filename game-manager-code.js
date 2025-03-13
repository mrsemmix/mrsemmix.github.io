/**
 * game-manager.js
 * Core game logic that works in both client (offline) and server (online) environments
 */

class GameManager {
  constructor(config = {}) {
    // Configuration with defaults
    this.config = {
      startingStack: 1000,
      smallBlind: 5,
      bigBlind: 10,
      elements: ["Fire", "Water", "Earth", "Air"],
      ...config
    };
    
    // Game state
    this.state = {
      deck: [],
      players: [],
      arenaCard: null,
      powerCards: [],
      currentStage: "preflop", // preflop, arena, power1, power2, power3, showdown
      dealerPosition: 0,
      activePlayerIndex: 0,
      currentBet: 0,
      pot: 0,
      minRaise: this.config.bigBlind,
      lastRaiseAmount: 0,
      lastRaiser: null,
      bettingRoundComplete: false,
      hasBettingStarted: false,
      playersActedThisRound: [],
      gameStarted: false
    };
    
    // Event handlers
    this.eventHandlers = {};
    
    // Constants - element matrix based on config
    this.ARENA_BONUS_MATRIX = {
      Fire: { Fire: 4, Water: -4, Earth: -2, Air: 2 },
      Water: { Fire: -4, Water: 4, Earth: 2, Air: -2 },
      Earth: { Fire: -2, Water: 2, Earth: 4, Air: -4 },
      Air: { Fire: 2, Water: -2, Earth: -4, Air: 4 }
    };
  }
  
  /**
   * Initialize a new game
   * @param {Array} players - Array of player objects
   * @param {Boolean} isOnline - Whether this is an online game
   * @returns {Object} Initial game state
   */
  initGame(players, isOnline = false) {
    // Create fresh deck
    this.state.deck = this.createShuffledDeck();
    
    // Initialize players with provided data
    this.state.players = players.map(player => ({
      id: player.id,
      name: player.name,
      hand: [],
      isHuman: player.isHuman || false,
      isOnline: isOnline,
      active: true,
      bet: 0,
      totalBet: 0,
      stack: this.config.startingStack,
      folded: false,
      allIn: false
    }));
    
    // Reset game state
    this.state.arenaCard = null;
    this.state.powerCards = [];
    this.state.currentStage = "preflop";
    this.state.pot = 0;
    this.state.currentBet = 0;
    this.state.minRaise = this.config.bigBlind;
    this.state.bettingRoundComplete = false;
    this.state.hasBettingStarted = false;
    this.state.playersActedThisRound = [];
    this.state.gameStarted = true;
    
    // Emit game initialized event
    this.emit('gameInitialized', this.getPublicState());
    
    return this.getPublicState();
  }
  
  /**
   * Create and shuffle a deck
   * @returns {Array} Shuffled deck
   */
  createShuffledDeck() {
    let deck = [];
    
    // Create monster cards for each element (1-13)
    for (let element of this.config.elements) {
      for (let value = 1; value <= 13; value++) {
        deck.push({
          type: "monster",
          element: element,
          value: value,
          name: this.getMonsterName(element, value)
        });
      }
    }
    
    // Shuffle deck
    return this.shuffle(deck);
  }
  
  /**
   * Shuffle array using Fisher-Yates algorithm
   * @param {Array} array - Array to shuffle
   * @returns {Array} Shuffled array
   */
  shuffle(array) {
    const shuffled = [...array];
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }
  
  /**
   * Deal initial cards to all players
   * @returns {Object} Updated game state
   */
  dealInitialCards() {
    // Deal 2 cards to each player
    for (let i = 0; i < 2; i++) {
      for (let player of this.state.players) {
        const card = this.state.deck.pop();
        player.hand.push(card);
      }
    }
    
    // Emit cards dealt event
    this.emit('cardDealt', { stage: 'preflop' });
    
    return this.getPublicState();
  }
  
  /**
   * Post blinds
   * @returns {Object} Updated game state
   */
  postBlinds() {
    // Find small blind and big blind players
    const sbPosition = (this.state.dealerPosition + 1) % this.state.players.length;
    const bbPosition = (this.state.dealerPosition + 2) % this.state.players.length;
    
    // Small blind
    const sbPlayer = this.state.players[sbPosition];
    const sbAmount = Math.min(this.config.smallBlind, sbPlayer.stack);
    sbPlayer.bet = sbAmount;
    sbPlayer.totalBet = sbAmount;
    sbPlayer.stack -= sbAmount;
    this.state.pot += sbAmount;
    
    // Big blind
    const bbPlayer = this.state.players[bbPosition];
    const bbAmount = Math.min(this.config.bigBlind, bbPlayer.stack);
    bbPlayer.bet = bbAmount;
    bbPlayer.totalBet = bbAmount;
    bbPlayer.stack -= bbAmount;
    this.state.pot += bbAmount;
    
    // Set current bet to big blind
    this.state.currentBet = bbAmount;
    
    // Emit blinds posted event
    this.emit('blindsPosted', {
      smallBlind: { player: sbPlayer.name, position: sbPosition, amount: sbAmount },
      bigBlind: { player: bbPlayer.name, position: bbPosition, amount: bbAmount }
    });
    
    // Action starts with player after big blind (UTG)
    this.state.activePlayerIndex = (bbPosition + 1) % this.state.players.length;
    
    return this.getPublicState();
  }
  
  /**
   * Process player action
   * @param {String} playerId - ID of player taking action
   * @param {String} action - Action type (check, call, bet, raise, fold, allIn)
   * @param {Number} amount - Amount for bet/raise (optional)
   * @returns {Object} Result of action
   */
  processPlayerAction(playerId, action, amount = 0) {
    // Find player
    const playerIndex = this.state.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return { success: false, error: 'Player not found' };
    }
    
    // Verify it's player's turn
    if (playerIndex !== this.state.activePlayerIndex) {
      return { success: false, error: 'Not your turn' };
    }
    
    const player = this.state.players[playerIndex];
    let result = { success: false, error: 'Invalid action' };
    
    // Process action
    switch (action) {
      case 'check':
        result = this.handleCheck(player);
        break;
      case 'call':
        result = this.handleCall(player);
        break;
      case 'bet':
        result = this.handleBet(player, amount);
        break;
      case 'raise':
        result = this.handleRaise(player, amount);
        break;
      case 'fold':
        result = this.handleFold(player);
        break;
      case 'allIn':
        result = this.handleAllIn(player);
        break;
    }
    
    if (result.success) {
      // Mark this player as having acted this round
      if (!this.state.playersActedThisRound.includes(player.id)) {
        this.state.playersActedThisRound.push(player.id);
      }
      
      // Emit action event
      this.emit('playerAction', {
        playerId: player.id,
        playerName: player.name,
        action: action,
        amount: result.amount || 0
      });
    }
    
    return result;
  }
  
  /**
   * Handle check action
   * @param {Object} player - Player object
   * @returns {Object} Result of action
   */
  handleCheck(player) {
    // Check is valid when no bet or player has matched current bet
    if (this.state.currentBet > 0 && player.bet < this.state.currentBet) {
      return { success: false, error: 'Cannot check when there is a bet' };
    }
    
    return { success: true };
  }
  
  /**
   * Handle call action
   * @param {Object} player - Player object
   * @returns {Object} Result of action
   */
  handleCall(player) {
    // Calculate call amount
    const callAmount = Math.min(this.state.currentBet - player.bet, player.stack);
    
    // Process call
    player.stack -= callAmount;
    this.state.pot += callAmount;
    player.bet += callAmount;
    player.totalBet += callAmount;
    
    // Check for all-in
    if (player.stack === 0) {
      player.allIn = true;
    }
    
    return { success: true, amount: player.bet };
  }
  
  /**
   * Handle bet action
   * @param {Object} player - Player object
   * @param {Number} amount - Bet amount
   * @returns {Object} Result of action
   */
  handleBet(player, amount) {
    // Validate bet amount
    if (amount < this.config.bigBlind) {
      return { success: false, error: `Minimum bet is ${this.config.bigBlind}` };
    }
    
    if (amount > player.stack) {
      return { success: false, error: 'Not enough chips' };
    }
    
    // Process bet
    player.stack -= amount;
    this.state.pot += amount;
    player.bet = amount;
    player.totalBet += amount;
    this.state.currentBet = amount;
    this.state.minRaise = amount;
    this.state.lastRaiser = player.id;
    
    // Reset players who have acted (except current player)
    this.state.playersActedThisRound = [player.id];
    
    return { success: true, amount: amount };
  }
  
  /**
   * Handle raise action
   * @param {Object} player - Player object
   * @param {Number} amount - New total bet amount
   * @returns {Object} Result of action
   */
  handleRaise(player, amount) {
    // Validate raise
    if (amount <= this.state.currentBet) {
      return { success: false, error: 'Raise must be higher than current bet' };
    }
    
    const raiseAmount = amount - this.state.currentBet;
    if (raiseAmount < this.state.minRaise) {
      return { success: false, error: `Minimum raise is ${this.state.minRaise}` };
    }
    
    const callAmount = this.state.currentBet - player.bet;
    const totalCost = callAmount + raiseAmount;
    
    if (totalCost > player.stack) {
      return { success: false, error: 'Not enough chips' };
    }
    
    // Process raise
    player.stack -= totalCost;
    this.state.pot += totalCost;
    player.bet = amount;
    player.totalBet += totalCost;
    this.state.currentBet = amount;
    this.state.minRaise = raiseAmount;
    this.state.lastRaiser = player.id;
    
    // Reset players who have acted (except current player)
    this.state.playersActedThisRound = [player.id];
    
    return { success: true, amount: amount };
  }
  
  /**
   * Handle fold action
   * @param {Object} player - Player object
   * @returns {Object} Result of action
   */
  handleFold(player) {
    player.folded = true;
    player.active = false;
    
    return { success: true };
  }
  
  /**
   * Handle all-in action
   * @param {Object} player - Player object
   * @returns {Object} Result of action
   */
  handleAllIn(player) {
    const allInAmount = player.stack;
    const totalBet = player.bet + allInAmount;
    
    // Process all-in
    player.stack = 0;
    this.state.pot += allInAmount;
    player.bet = totalBet;
    player.totalBet += allInAmount;
    player.allIn = true;
    
    // If all-in is a raise, update current bet and reset acted players
    if (totalBet > this.state.currentBet) {
      const raiseAmount = totalBet - this.state.currentBet;
      
      // Only count as a raise if it meets minimum raise requirement
      if (raiseAmount >= this.state.minRaise) {
        this.state.currentBet = totalBet;
        this.state.minRaise = raiseAmount;
        this.state.lastRaiser = player.id;
        this.state.playersActedThisRound = [player.id];
      }
    }
    
    return { success: true, amount: totalBet };
  }
  
  /**
   * Move to next player
   * @returns {Object} Next player info
   */
  moveToNextPlayer() {
    // Mark current player as having acted
    const currentPlayer = this.state.players[this.state.activePlayerIndex];
    if (!this.state.playersActedThisRound.includes(currentPlayer.id)) {
      this.state.playersActedThisRound.push(currentPlayer.id);
    }
    
    // Check if betting round is complete
    if (this.isBettingRoundComplete()) {
      return this.advanceGameStage();
    }
    
    // Move to next player
    this.state.activePlayerIndex = (this.state.activePlayerIndex + 1) % this.state.players.length;
    
    // Skip folded or all-in players
    while (
      this.state.players[this.state.activePlayerIndex].folded || 
      this.state.players[this.state.activePlayerIndex].allIn
    ) {
      this.state.activePlayerIndex = (this.state.activePlayerIndex + 1) % this.state.players.length;
      
      // If we've gone through all players, betting must be complete
      if (this.state.activePlayerIndex === this.state.activePlayerIndex) {
        return this.advanceGameStage();
      }
    }
    
    const nextPlayer = this.state.players[this.state.activePlayerIndex];
    
    // Emit next player event
    this.emit('playerTurn', {
      playerId: nextPlayer.id,
      playerName: nextPlayer.name,
      stage: this.state.currentStage
    });
    
    return {
      success: true,
      playerId: nextPlayer.id,
      playerName: nextPlayer.name
    };
  }
  
  /**
   * Check if betting round is complete
   * @returns {Boolean} True if betting round is complete
   */
  isBettingRoundComplete() {
    // Get active players (not folded or all-in)
    const activePlayers = this.state.players.filter(p => !p.folded && !p.allIn);
    
    // If no active players, betting is complete
    if (activePlayers.length === 0) {
      return true;
    }
    
    // If no players have acted yet, betting is not complete
    if (this.state.playersActedThisRound.length === 0) {
      return false;
    }
    
    // Check if all active players have acted
    const allActed = activePlayers.every(p => this.state.playersActedThisRound.includes(p.id));
    
    // Check if all active players have matched the current bet
    const allMatched = activePlayers.every(p => p.bet === this.state.currentBet || p.allIn);
    
    return allActed && allMatched;
  }
  
  /**
   * Advance to next game stage
   * @returns {Object} Next stage info
   */
  advanceGameStage() {
    // Check if only one player remains
    const activePlayers = this.state.players.filter(p => !p.folded);
    
    if (activePlayers.length === 1) {
      // One player wins by default
      return this.showdown(true);
    }
    
    // Reset bets for new round
    this.state.players.forEach(player => {
      player.bet = 0;
    });
    
    // Reset betting variables
    this.state.currentBet = 0;
    this.state.playersActedThisRound = [];
    this.state.hasBettingStarted = false;
    
    let stageResult = null;
    let nextStage = null;
    
    // Advance to next stage
    switch (this.state.currentStage) {
      case 'preflop':
        stageResult = this.revealArena();
        nextStage = 'arena';
        break;
      case 'arena':
        stageResult = this.addPowerCard();
        nextStage = 'power1';
        break;
      case 'power1':
        stageResult = this.addPowerCard();
        nextStage = 'power2';
        break;
      case 'power2':
        stageResult = this.addPowerCard();
        nextStage = 'power3';
        break;
      case 'power3':
        return this.showdown();
    }
    
    this.state.currentStage = nextStage;
    
    // Set active player for new round (first active player after dealer)
    this.state.activePlayerIndex = (this.state.dealerPosition + 1) % this.state.players.length;
    
    // Skip folded or all-in players
    while (
      this.state.players[this.state.activePlayerIndex].folded || 
      this.state.players[this.state.activePlayerIndex].allIn
    ) {
      this.state.activePlayerIndex = (this.state.activePlayerIndex + 1) % this.state.players.length;
      
      // If all players are folded or all-in, go to showdown
      if (this.state.activePlayerIndex === this.state.dealerPosition) {
        return this.showdown();
      }
    }
    
    const nextPlayer = this.state.players[this.state.activePlayerIndex];
    
    // Emit stage change event
    this.emit('stageChanged', {
      stage: nextStage,
      stageResult: stageResult
    });
    
    // Emit next player event
    this.emit('playerTurn', {
      playerId: nextPlayer.id,
      playerName: nextPlayer.name,
      stage: nextStage
    });
    
    return {
      success: true,
      stage: nextStage,
      stageResult: stageResult,
      nextPlayer: {
        id: nextPlayer.id,
        name: nextPlayer.name
      }
    };
  }
  
  /**
   * Reveal arena card
   * @returns {Object} Arena card
   */
  revealArena() {
    // Select random element for arena
    const arenaElement = this.config.elements[Math.floor(Math.random() * this.config.elements.length)];
    
    // Create arena card
    this.state.arenaCard = {
      type: 'arena',
      element: arenaElement,
      name: this.getArenaName(arenaElement)
    };
    
    return this.state.arenaCard;
  }
  
  /**
   * Add power card
   * @returns {Object} Power card info
   */
  addPowerCard() {
    // Select random element and power value
    const powerElement = this.config.elements[Math.floor(Math.random() * this.config.elements.length)];
    const powerValue = Math.floor(Math.random() * 5) + 1;
    
    // Create power card
    const powerCard = {
      type: 'power',
      element: powerElement,
      power: powerValue,
      name: this.getPowerName(powerElement, powerValue)
    };
    
    // Add to power cards array
    this.state.powerCards.push(powerCard);
    
    return {
      card: powerCard,
      index: this.state.powerCards.length - 1
    };
  }
  
  /**
   * Showdown - determine winner
   * @param {Boolean} singleWinner - Whether there's only one player left
   * @returns {Object} Showdown results
   */
  showdown(singleWinner = false) {
    this.state.currentStage = 'showdown';
    
    if (singleWinner) {
      // Get the remaining player
      const winner = this.state.players.find(p => !p.folded);
      
      // Award pot
      winner.stack += this.state.pot;
      
      // Return result
      return {
        success: true,
        winners: [{
          id: winner.id,
          name: winner.name,
          handValue: 'N/A',
          potWon: this.state.pot
        }],
        message: `${winner.name} wins as the last player standing!`
      };
    }
    
    // Calculate hand values
    const results = this.state.players.map(player => {
      if (player.folded) {
        return { player, value: -1 };
      }
      
      // Calculate hand value (sum of card values with bonuses)
      const handValue = player.hand.reduce((sum, card) => {
        return sum + this.calculateCardValue(card);
      }, 0);
      
      return { player, value: handValue };
    });
    
    // Sort by hand value (highest first)
    results.sort((a, b) => b.value - a.value);
    
    // Find winners (players with highest hand value)
    const winners = results.filter(r => r.value === results[0].value && r.value >= 0);
    
    // Split pot among winners
    const potPerWinner = Math.floor(this.state.pot / winners.length);
    
    // Award pot to winners
    winners.forEach(winner => {
      winner.player.stack += potPerWinner;
    });
    
    // Emit showdown event
    this.emit('showdown', {
      winners: winners.map(w => ({
        id: w.player.id,
        name: w.player.name,
        handValue: w.value,
        potWon: potPerWinner
      })),
      hands: this.state.players.map(p => ({
        id: p.id,
        name: p.name,
        hand: p.hand,
        folded: p.folded
      }))
    });
    
    return {
      success: true,
      winners: winners.map(w => ({
        id: w.player.id,
        name: w.player.name,
        handValue: w.value,
        potWon: potPerWinner
      })),
      hands: this.state.players.map(p => ({
        id: p.id,
        name: p.name,
        hand: p.hand,
        folded: p.folded
      }))
    };
  }
  
  /**
   * Calculate card value including arena and power bonuses
   * @param {Object} card - Card object
   * @returns {Number} Card value with bonuses
   */
  calculateCardValue(card) {
    let value = card.value;
    
    // Add arena bonus if arena card is present
    if (this.state.arenaCard) {
      const arenaBonus = this.ARENA_BONUS_MATRIX[card.element][this.state.arenaCard.element] || 0;
      value += arenaBonus;
    }
    
    // Add power card bonuses
    this.state.powerCards.forEach(powerCard => {
      if (powerCard.element === card.element) {
        // Same element: add full power
        value += powerCard.power;
      } else if (this.isContradictingElement(powerCard.element, card.element)) {
        // Contradicting element: subtract 1
        value -= 1;
      }
    });
    
    return value;
  }
  
  /**
   * Check if elements contradict each other
   * @param {String} element1 - First element
   * @param {String} element2 - Second element
   * @returns {Boolean} True if elements contradict
   */
  isContradictingElement(element1, element2) {
    return this.ARENA_BONUS_MATRIX[element1][element2] === -4;
  }
  
  /**
   * Get public game state (safe to send to clients)
   * @returns {Object} Public game state
   */
  getPublicState() {
    return {
      players: this.state.players.map(p => ({
        id: p.id,
        name: p.name,
        stack: p.stack,
        bet: p.bet,
        folded: p.folded,
        allIn: p.allIn,
        active: p.active
      })),
      arenaCard: this.state.arenaCard,
      powerCards: this.state.powerCards,
      currentStage: this.state.currentStage,
      dealerPosition: this.state.dealerPosition,
      activePlayerIndex: this.state.activePlayerIndex,
      pot: this.state.pot,
      currentBet: this.state.currentBet
    };
  }
  
  /**
   * Get player-specific game state
   * @param {String} playerId - Player ID
   * @returns {Object} State with player-specific information
   */
  getPlayerState(playerId) {
    const publicState = this.getPublicState();
    
    // Add player hands (only show cards for this player and for showdown)
    publicState.players = this.state.players.map(p => {
      const playerInfo = {
        id: p.id,
        name: p.name,
        stack: p.stack,
        bet: p.bet,
        folded: p.folded,
        allIn: p.allIn,
        active: p.active
      };
      
      // Only include hand if it's this player or showdown
      if (p.id === playerId || this.state.currentStage === 'showdown') {
        playerInfo.hand = p.hand;
      }
      
      return playerInfo;
    });
    
    return publicState;
  }
  
  /**
   * Get monster name based on element and value
   * @param {String} element - Card element
   * @param {Number} value - Card value
   * @returns {String} Monster name
   */
  getMonsterName(element, value) {
    const monsterNames = {
      Fire: [
        "Fire Imp", "Ember Sprite", "Flame Whelp", "Blaze Pup", "Cinder Hound",
        "Lava Golem", "Burning Drake", "Flare Serpent", "Scorch Fiend", "Pyro Beast",
        "Ember Lord", "Inferno King", "Lava Titan"
      ],
      Water: [
        "Water Sprite", "Mist Nymph", "Ripple Imp", "Droplet Pixie", "Brook Guardian",
        "Aqua Sentinel", "Tidal Fighter", "Wave Ruler", "Deepwater Fiend", "Ocean Warrior",
        "Tsunami Bringer", "Abyss Monarch", "Ocean Emperor"
      ],
      Earth: [
        "Earth Pixie", "Soil Sprite", "Pebble Imp", "Mudling", "Rock Guard",
        "Stone Sentinel", "Terra Warrior", "Gravel Golem", "Earth Brute", "Landshaper",
        "Geo Lord", "Terra Titan", "Earth Emperor"
      ],
      Air: [
        "Air Imp", "Breeze Sprite", "Gustling", "Wind Wisp", "Zephyr Knight",
        "Air Scout", "Sky Warrior", "Cloud Strider", "Tempest Caller", "Wind Ruler",
        "Storm Bringer", "Sky Lord", "Storm King"
      ]
    };
    
    // Return monster name if available, otherwise generate a default name
    return monsterNames[element] && monsterNames[element][value - 1] 
      ? monsterNames[element][value - 1] 
      : `${element} Monster ${value}`;
  }
  
  /**
   * Get arena name based on element
   * @param {String} element - Arena element
   * @returns {String} Arena name
   */
  getArenaName(element) {
    const arenaNames = {
      Fire: ["Blaze Coliseum", "Lava Stadium", "Volcano"],
      Water: ["Wave Pavilion", "Grand Ocean", "River Basin"],
      Earth: ["Rock Fortress", "Stone Domain", "Terra Grounds"],
      Air: ["Skyport", "Wind Haven", "Cloud Oasis"]
    };
    
    // Return random arena name if available, otherwise generate a default name
    return arenaNames[element] && arenaNames[element].length > 0
      ? arenaNames[element][Math.floor(Math.random() * arenaNames[element].length)]
      : `${element} Arena`;
  }
  
  /**
   * Get power card name
   * @param {String} element - Power card element
   * @param {Number} value - Power card value
   * @returns {String} Power card name
   */
  getPowerName(element, value) {
    const powerNames = {
      Fire: { 1: "Ember", 2: "Flame Flicker", 3: "Blaze", 4: "Firestorm", 5: "Inferno" },
      Water: { 1: "Splash", 2: "Drizzle", 3: "Torrent", 4: "Deluge", 5: "Tsunami" },
      Earth: { 1: "Pebble Toss", 2: "Rock Throw", 3: "Boulder", 4: "Landslide", 5: "Earthquake" },
      Air: { 1: "Gust", 2: "Breeze", 3: "Wind Slash", 4: "Tempest", 5: "Hurricane" }
    };
    
    // Return power name if available, otherwise generate a default name
    return powerNames[element] && powerNames[element][value]
      ? powerNames[element][value]
      : `${element} Power ${value}`;
  }
  
  /**
   * Register event handler
   * @param {String} event - Event name
   * @param {Function} handler - Event handler function
   */
  on(event, handler) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }
  
  /**
   * Emit event
   * @param {String} event - Event name
   * @param {Object} data - Event data
   */
  emit(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => handler(data));
    }
  }
}

// Export in a way that works in both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameManager;
} else if (typeof window !== 'undefined') {
  window.GameManager = GameManager;
}
