/**
 * mode-controller.js
 * Handles switching between offline and online modes
 */

class ModeController {
  constructor() {
    this.gameManager = null;
    this.socket = null;
    this.currentMode = 'offline'; // offline or online
    this.roomCode = null;
    this.playerName = null;
    
    // Event handlers
    this.eventHandlers = {};
    
    // UI elements cache
    this.elements = {};
  }
  
  /**
   * Initialize the controller
   * @param {Object} uiElements - UI elements reference
   */
  init(uiElements) {
    this.elements = uiElements;
    
    // Create game manager for offline mode
    this.gameManager = new GameManager();
    
    // Register event handlers for game events
    this.registerGameEvents();
    
    // Register UI event handlers
    this.registerUIHandlers();
    
    console.log('Mode controller initialized');
  }
  
  /**
   * Register game event handlers
   */
  registerGameEvents() {
    // Game events from offline game manager
    this.gameManager.on('gameInitialized', (data) => {
      this.emit('gameInitialized', data);
    });
    
    this.gameManager.on('cardDealt', (data) => {
      this.emit('cardDealt', data);
    });
    
    this.gameManager.on('blindsPosted', (data) => {
      this.emit('blindsPosted', data);
    });
    
    this.gameManager.on('playerAction', (data) => {
      this.emit('playerAction', data);
    });
    
    this.gameManager.on('playerTurn', (data) => {
      this.emit('playerTurn', data);
    });
    
    this.gameManager.on('stageChanged', (data) => {
      this.emit('stageChanged', data);
    });
    
    this.gameManager.on('showdown', (data) => {
      this.emit('showdown', data);
    });
  }
  
  /**
   * Register UI event handlers
   */
  registerUIHandlers() {
    // Implement based on your specific UI structure
    console.log('UI handlers registered');
  }
  
  /**
   * Switch between offline and online modes
   * @param {String} mode - Mode to switch to ('offline' or 'online')
   */
  switchMode(mode) {
    if (mode === this.currentMode) return;
    
    if (mode === 'online') {
      // Setup online mode
      this.initOnlineMode();
    } else {
      // Clean up online mode
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
      
      this.roomCode = null;
    }
    
    this.currentMode = mode;
    this.emit('modeChanged', { mode });
    
    console.log(`Switched to ${mode} mode`);
  }
  
  /**
   * Initialize online mode
   */
  initOnlineMode() {
    // Initialize Socket.io
    this.socket = io();
    
    // Socket event handlers
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.emit('serverConnected');
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.emit('serverDisconnected');
    });
    
    // Room events
    this.socket.on('roomUpdate', (data) => {
      this.emit('roomUpdate', data);
    });
    
    // Game events from server
    this.socket.on('gameStarted', (data) => {
      this.emit('gameStarted', data);
    });
    
    this.socket.on('dealCards', (data) => {
      this.emit('dealCards', data);
    });
    
    this.socket.on('blindsPosted', (data) => {
      this.emit('blindsPosted', data);
    });
    
    this.socket.on('arenaCardDealt', (data) => {
      this.emit('arenaCardDealt', data);
    });
    
    this.socket.on('powerCardDealt', (data) => {
      this.emit('powerCardDealt', data);
    });
    
    this.socket.on('playerTurn', (data) => {
      this.emit('playerTurn', data);
    });
    
    this.socket.on('playerAction', (data) => {
      this.emit('playerAction', data);
    });
    
    this.socket.on('gameStateUpdate', (data) => {
      this.emit('gameStateUpdate', data);
    });
    
    this.socket.on('showdown', (data) => {
      this.emit('showdown', data);
    });
  }
  
  /**
   * Start offline game
   */
  startOfflineGame() {
    if (this.currentMode !== 'offline') {
      console.error('Cannot start offline game in online mode');
      return;
    }
    
    // Create players (1 human + 3 AI)
    const players = [
      { id: 'human', name: 'You', isHuman: true },
      { id: 'ai1', name: 'AI 1', isHuman: false },
      { id: 'ai2', name: 'AI 2', isHuman: false },
      { id: 'ai3', name: 'AI 3', isHuman: false }
    ];
    
    // Initialize game
    this.gameManager.initGame(players);
    
    // Deal initial cards
    this.gameManager.dealInitialCards();
    
    // Post blinds
    this.gameManager.postBlinds();
    
    // Emit game started event
    this.emit('gameStarted', { offline: true });
    
    console.log('Offline game started');
  }
  
  /**
   * Create online room
   * @param {String} playerName - Player name
   */
  createRoom(playerName) {
    if (this.currentMode !== 'online' || !this.socket) {
      this.switchMode('online');
    }
    
    this.playerName = playerName || `Player_${Math.floor(Math.random() * 1000)}`;
    
    this.socket.emit('createRoom', this.playerName, (response) => {
      if (response.success) {
        this.roomCode = response.roomCode;
        this.emit('roomCreated', response);
      } else {
        this.emit('error', { message: response.error || 'Failed to create room' });
      }
    });
  }
  
  /**
   * Join online room
   * @param {String} roomCode - Room code to join
   * @param {String} playerName - Player name
   */
  joinRoom(roomCode, playerName) {
    if (this.currentMode !== 'online' || !this.socket) {
      this.switchMode('online');
    }
    
    this.playerName = playerName || `Player_${Math.floor(Math.random() * 1000)}`;
    
    this.socket.emit('joinRoom', { roomCode, playerName: this.playerName }, (response) => {
      if (response.success) {
        this.roomCode = response.roomCode;
        this.emit('roomJoined', response);
      } else {
        this.emit('error', { message: response.error || 'Failed to join room' });
      }
    });
  }
  
  /**
   * Set player ready status
   * @param {Boolean} ready - Ready status
   */
  setReady(ready) {
    if (this.currentMode !== 'online' || !this.socket) {
      console.error('Cannot set ready status in offline mode');
      return;
    }
    
    this.socket.emit('playerReady', ready);
  }
  
  /**
   * Process player action (works in both online and offline modes)
   * @param {String} action - Action type (check, call, bet, raise, fold, allIn)
   * @param {Number} amount - Amount for bet/raise (optional)
   */
  processAction(action, amount = 0) {
    if (this.currentMode === 'online') {
      // Send action to server
      this.socket.emit('gameAction', { type: action, amount });
    } else {
      // Process in offline mode
      this.gameManager.processPlayerAction('human', action, amount);
      
      // In offline mode, we need to manually advance to AI turns
      this.processAITurns();
    }
  }
  
  /**
   * Process AI turns in offline mode
   */
  processAITurns() {
    // Check if game is in progress and it's AI's turn
    if (!this.gameManager.state.gameStarted) return;
    
    const activePlayer = this.gameManager.state.players[this.gameManager.state.activePlayerIndex];
    
    // Process AI turns until it's human's turn or game ends
    while (activePlayer && !activePlayer.isHuman) {
      // AI decision logic
      const action = this.getAIAction(activePlayer);
      
      // Process AI action
      this.gameManager.processPlayerAction(activePlayer.id, action.type, action.amount);
      
      // Check if game is over or betting round is complete
      if (
        this.gameManager.state.currentStage === 'showdown' || 
        this.gameManager.state.players.filter(p => !p.folded).length <= 1
      ) {
        break;
      }
      
      // Move to next player
      this.gameManager.moveToNextPlayer();
      
      // Update active player reference
      activePlayer = this.gameManager.state.players[this.gameManager.state.activePlayerIndex];
    }
  }
  
  /**
   * Get AI action (simple AI logic)
   * @param {Object} player - AI player
   * @returns {Object} Action object with type and amount
   */
  getAIAction(player) {
    // Calculate hand strength (simple implementation for now)
    const handStrength = this.calculateHandStrength(player);
    
    const gameState = this.gameManager.state;
    const callAmount = gameState.currentBet - player.bet;
    
    // Decision based on hand strength and current bet
    if (callAmount === 0) {
      // No bet to call
      if (handStrength > 0.7) {
        // Strong hand - bet
        const betAmount = Math.min(
          Math.floor(gameState.pot * 0.5),
          player.stack
        );
        return { type: 'bet', amount: betAmount };
      } else if (handStrength > 0.4) {
        // Medium hand - check
        return { type: 'check' };
      } else {
        // Weak hand - check
        return { type: 'check' };
      }
    } else {
      // There's a bet to call
      if (handStrength > 0.8) {
        // Very strong hand - raise
        const raiseAmount = Math.min(
          gameState.currentBet * 2,
          player.stack + player.bet
        );
        return { type: 'raise', amount: raiseAmount };
      } else if (handStrength > 0.6) {
        // Strong hand - call
        return { type: 'call' };
      } else if (handStrength > 0.3 && callAmount <= player.stack * 0.2) {
        // Medium hand and small bet - call
        return { type: 'call' };
      } else {
        // Weak hand or big bet - fold
        return { type: 'fold' };
      }
    }
  }
  
  /**
   * Calculate hand strength (simple implementation)
   * @param {Object} player - Player object
   * @returns {Number} Hand strength (0-1)
   */
  calculateHandStrength(player) {
    if (!player.hand || player.hand.length === 0) return 0;
    
    // Calculate raw card values
    let rawValue = 0;
    player.hand.forEach(card => {
      rawValue += this.gameManager.calculateCardValue(card);
    });
    
    // Normalize to 0-1 range (max possible is about 60)
    return Math.min(rawValue / 60, 1);
  }
  
  /**
   * Get available rooms
   * @param {Function} callback - Callback function with room list
   */
  getRooms(callback) {
    if (this.currentMode !== 'online' || !this.socket) {
      console.error('Cannot get rooms in offline mode');
      return;
    }
    
    this.socket.emit('getRooms', callback);
  }
  
  /**
   * Leave room or disconnect
   */
  leaveRoom() {
    if (this.currentMode !== 'online' || !this.socket) {
      return;
    }
    
    this.socket.disconnect();
    this.socket = null;
    this.roomCode = null;
    
    // Switch back to offline mode
    this.switchMode('offline');
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

// Export in browser environment
if (typeof window !== 'undefined') {
  window.ModeController = ModeController;
}
