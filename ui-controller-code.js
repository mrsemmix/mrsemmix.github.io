/**
 * ui-controller.js
 * Handles UI rendering and user interactions
 */

class UIController {
  constructor(modeController) {
    this.modeController = modeController;
    this.elements = {};
    this.animations = {
      cardDeal: 'card-deal',
      cardFlip: 'card-flip',
      winnerGlow: 'winner-glow'
    };
    
    // Element colors
    this.elementColors = {
      Fire: '#FF4500',
      Water: '#1E90FF',
      Earth: '#9ACD32',
      Air: '#ADD8E6'
    };
    
    // Element gradients
    this.elementGradients = {
      Fire: "linear-gradient(45deg, rgba(255,69,0,0.2), rgba(255,140,0,0.2), rgba(255,69,0,0.2))",
      Water: "linear-gradient(45deg, rgba(30,144,255,0.2), rgba(65,105,225,0.2), rgba(30,144,255,0.2))",
      Earth: "linear-gradient(45deg, rgba(154,205,50,0.2), rgba(107,142,35,0.2), rgba(154,205,50,0.2))",
      Air: "linear-gradient(45deg, rgba(173,216,230,0.2), rgba(135,206,250,0.2), rgba(173,216,230,0.2))"
    };
    
    // Element icons
    this.elementIcons = {
      Fire: '<i class="fas fa-fire fa-icon" style="color: #FF4500;"></i>',
      Water: '<i class="fas fa-tint fa-icon" style="color: #1E90FF;"></i>',
      Earth: '<i class="fas fa-mountain fa-icon" style="color: #9ACD32;"></i>',
      Air: '<i class="fas fa-wind fa-icon" style="color: #ADD8E6;"></i>'
    };
  }
  
  /**
   * Initialize UI
   */
  init() {
    // Cache DOM elements
    this.cacheElements();
    
    // Register UI event handlers
    this.registerUIEvents();
    
    // Register mode controller events
    this.registerModeEvents();
    
    console.log('UI controller initialized');
  }
  
  /**
   * Cache DOM elements
   */
  cacheElements() {
    // Game info elements
    this.elements.pot = document.getElementById('pot');
    this.elements.blindsInfo = document.getElementById('blinds-info');
    this.elements.gameLog = document.getElementById('game-log');
    this.elements.stageDots = document.querySelectorAll('.stage-dot');
    
    // Player elements
    this.elements.players = {};
    ['human', 'ai1', 'ai2', 'ai3'].forEach(id => {
      this.elements.players[id] = {
        container: document.getElementById(`player-${id}`),
        name: document.querySelector(`#player-${id} h2`),
        position: document.querySelector(`#player-${id} .player-position`),
        stack: document.getElementById(`${id}-stack`),
        betAmount: document.getElementById(`${id}-bet-amount`),
        cards: document.getElementById(`${id}-cards`),
        total: document.getElementById(`${id}-total`),
        action: document.getElementById(`${id}-action`),
        chips: document.getElementById(`${id}-chips`)
      };
    });
    
    // Arena and power cards
    this.elements.arenaLabel = document.getElementById('arena-label');
    this.elements.powerCardsContainer = document.getElementById('power-cards-container');
    this.elements.powerCards = document.getElementById('power-cards');
    
    // Button elements
    this.elements.startButton = document.getElementById('start-button');
    this.elements.restartButton = document.getElementById('restart-button');
    this.elements.continueButton = document.getElementById('continue-button');
    this.elements.clearLogButton = document.getElementById('clear-log');
    
    // Betting controls
    this.elements.bettingControls = document.getElementById('betting-controls');
    this.elements.checkButton = document.getElementById('check-button');
    this.elements.callButton = document.getElementById('call-button');
    this.elements.betButton = document.getElementById('bet-button');
    this.elements.raiseButton = document.getElementById('raise-button');
    this.elements.foldButton = document.getElementById('fold-button');
    this.elements.allInButton = document.getElementById('all-in-button');
    
    // Bet slider
    this.elements.betSliderContainer = document.getElementById('bet-slider-container');
    this.elements.betSlider = document.getElementById('bet-slider');
    this.elements.betAmountDisplay = document.getElementById('bet-amount-display');
    this.elements.confirmBetButton = document.getElementById('confirm-bet-button');
    this.elements.cancelBetButton = document.getElementById('cancel-bet-button');
    
    // Winner overlay
    this.elements.winnerOverlay = document.getElementById('winner-overlay');
    this.elements.winnerTitle = document.getElementById('winner-title');
    this.elements.winnerInfo = document.getElementById('winner-info');
    this.elements.winnerCards = document.getElementById('winner-cards');
    this.elements.winnerPot = document.getElementById('winner-pot');
    
    // Message element
    this.elements.message = document.getElementById('message');
    
    // Blind markers
    this.elements.dealerButton = document.getElementById('dealer-button');
    this.elements.smallBlindButton = document.getElementById('small-blind-button');
    this.elements.bigBlindButton = document.getElementById('big-blind-button');
    
    // Multiplayer UI elements (create these if they don't exist)
    this.createMultiplayerUI();
  }
  
  /**
   * Create multiplayer UI elements if they don't exist
   */
  createMultiplayerUI() {
    // Check if multiplayer UI already exists
    if (document.querySelector('.multiplayer-ui')) {
      return;
    }
    
    // Create multiplayer UI container
    const multiplayerUI = document.createElement('div');
    multiplayerUI.className = 'multiplayer-ui';
    
    // Create HTML structure for multiplayer UI
    multiplayerUI.innerHTML = `
      <div class="multiplayer-overlay">
        <h2>PokerMon Multiplayer</h2>
        
        <!-- Player name input -->
        <div class="input-group">
          <label for="player-name">Your Name:</label>
          <input type="text" id="player-name" placeholder="Enter your name" maxlength="15">
        </div>
        
        <!-- Create or join room -->
        <div class="button-group">
          <button id="create-room-btn" class="button">Create Room</button>
          <button id="join-room-btn" class="button">Join Room</button>
          <button id="refresh-rooms-btn" class="button">Refresh Rooms</button>
        </div>
        
        <!-- Room list -->
        <div class="room-list-container">
          <h3>Available Rooms</h3>
          <div id="room-list" class="room-list">
            <p class="empty-rooms">No rooms available. Create one to start playing!</p>
          </div>
        </div>
        
        <!-- Room code input for joining -->
        <div class="join-room-container" style="display: none;">
          <div class="input-group">
            <label for="room-code-input">Room Code:</label>
            <input type="text" id="room-code-input" placeholder="Enter room code" maxlength="6">
          </div>
          <button id="join-with-code-btn" class="button">Join</button>
        </div>
        
        <!-- Room information (shown when in a room) -->
        <div class="room-info-container" style="display: none;">
          <h3>Room: <span id="room-code-display"></span></h3>
          <div class="player-list-container">
            <h4>Players:</h4>
            <ul id="player-list" class="player-list"></ul>
          </div>
          <div class="ready-control">
            <button id="ready-btn" class="button">Ready</button>
            <button id="leave-room-btn" class="button">Leave Room</button>
          </div>
        </div>
      </div>
      
      <!-- In-game multiplayer HUD (shown during game) -->
      <div class="multiplayer-hud" style="display: none;">
        <div class="room-code">Room: <span id="hud-room-code"></span></div>
        <button id="leave-game-btn" class="button">Leave Game</button>
      </div>
    `;
    
    // Add to document
    document.body.appendChild(multiplayerUI);
    
    // Cache multiplayer UI elements
    this.elements.multiplayerUI = multiplayerUI;
    this.elements.multiplayerOverlay = multiplayerUI.querySelector('.multiplayer-overlay');
    this.elements.multiplayerHud = multiplayerUI.querySelector('.multiplayer-hud');
    this.elements.playerNameInput = document.getElementById('player-name');
    this.elements.createRoomBtn = document.getElementById('create-room-btn');
    this.elements.joinRoomBtn = document.getElementById('join-room-btn');
    this.elements.refreshRoomsBtn = document.getElementById('refresh-rooms-btn');
    this.elements.roomList = document.getElementById('room-list');
    this.elements.joinRoomContainer = document.querySelector('.join-room-container');
    this.elements.roomCodeInput = document.getElementById('room-code-input');
    this.elements.joinWithCodeBtn = document.getElementById('join-with-code-btn');
    this.elements.roomInfoContainer = document.querySelector('.room-info-container');
    this.elements.roomCodeDisplay = document.getElementById('room-code-display');
    this.elements.playerList = document.getElementById('player-list');
    this.elements.readyBtn = document.getElementById('ready-btn');
    this.elements.leaveRoomBtn = document.getElementById('leave-room-btn');
    this.elements.hudRoomCode = document.getElementById('hud-room-code');
    this.elements.leaveGameBtn = document.getElementById('leave-game-btn');
    
    // Add styles for multiplayer UI
    this.addMultiplayerStyles();
  }
  
  /**
   * Add multiplayer styles
   */
  addMultiplayerStyles() {
    // Check if styles already exist
    if (document.getElementById('multiplayer-styles')) {
      return;
    }
    
    // Create style element
    const style = document.createElement('style');
    style.id = 'multiplayer-styles';
    
    // Add CSS
    style.textContent = `
      .multiplayer-ui {
        font-family: "Exo 2", sans-serif;
      }
      
      .multiplayer-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(10, 15, 30, 0.95);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        color: #e0e0e0;
        overflow-y: auto;
      }
      
      .multiplayer-overlay h2 {
        font-family: "Orbitron", sans-serif;
        margin-bottom: 20px;
        font-size: 32px;
        background: linear-gradient(to right, #ff4d4d, #f9cb28, #00c2ff);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      
      .input-group {
        margin: 10px 0;
        width: 100%;
        max-width: 400px;
      }
      
      .input-group label {
        display: block;
        margin-bottom: 5px;
      }
      
      .input-group input {
        width: 100%;
        padding: 10px;
        background: rgba(30, 40, 60, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
        border-radius: 5px;
      }
      
      .button-group {
        display: flex;
        gap: 10px;
        margin: 20px 0;
        flex-wrap: wrap;
        justify-content: center;
      }
      
      .room-list-container {
        width: 100%;
        max-width: 500px;
        margin: 20px 0;
      }
      
      .room-list {
        background: rgba(30, 40, 60, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 5px;
        padding: 10px;
        max-height: 200px;
        overflow-y: auto;
      }
      
      .room-list .room-item {
        padding: 10px;
        margin-bottom: 5px;
        background: rgba(40, 50, 70, 0.5);
        border-radius: 5px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .room-list .empty-rooms {
        text-align: center;
        color: #aaa;
        padding: 20px;
      }
      
      .join-room-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 20px 0;
        width: 100%;
        max-width: 400px;
      }
      
      .room-info-container {
        width: 100%;
        max-width: 500px;
        margin: 20px 0;
        background: rgba(30, 40, 60, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        padding: 20px;
      }
      
      .player-list-container {
        margin: 15px 0;
      }
      
      .player-list {
        list-style: none;
        padding: 0;
      }
      
      .player-list li {
        padding: 8px 10px;
        margin-bottom: 5px;
        background: rgba(40, 50, 70, 0.5);
        border-radius: 5px;
        display: flex;
        justify-content: space-between;
      }
      
      .player-ready {
        color: #4CAF50;
      }
      
      .player-not-ready {
        color: #F44336;
      }
      
      .ready-control {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-top: 20px;
      }
      
      .multiplayer-hud {
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(10, 15, 30, 0.8);
        padding: 10px;
        border-radius: 5px;
        z-index: 900;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .room-code {
        color: #e0e0e0;
        font-weight: bold;
      }
      
      /* Ready button states */
      #ready-btn.ready {
        background: rgba(76, 175, 80, 0.6);
      }
      
      #ready-btn.not-ready {
        background: rgba(244, 67, 54, 0.6);
      }
    `;
    
    // Add to document
    document.head.appendChild(style);
  }
  
  /**
   * Register UI event handlers
   */
  registerUIEvents() {
    // Game control buttons
    if (this.elements.startButton) {
      this.elements.startButton.addEventListener('click', () => {
        this.handleStartGame();
      });
    }
    
    if (this.elements.restartButton) {
      this.elements.restartButton.addEventListener('click', () => {
        this.handleRestartGame();
      });
    }
    
    if (this.elements.continueButton) {
      this.elements.continueButton.addEventListener('click', () => {
        this.hideWinnerOverlay();
        this.handleRestartGame();
      });
    }
    
    if (this.elements.clearLogButton) {
      this.elements.clearLogButton.addEventListener('click', () => {
        this.clearGameLog();
      });
    }
    
    // Betting action buttons
    if (this.elements.checkButton) {
      this.elements.checkButton.addEventListener('click', () => {
        this.handlePlayerAction('check');
      });
    }
    
    if (this.elements.callButton) {
      this.elements.callButton.addEventListener('click', () => {
        this.handlePlayerAction('call');
      });
    }
    
    if (this.elements.betButton) {
      this.elements.betButton.addEventListener('click', () => {
        this.showBetControls('bet');
      });
    }
    
    if (this.elements.raiseButton) {
      this.elements.raiseButton.addEventListener('click', () => {
        this.showBetControls('raise');
      });
    }
    
    if (this.elements.foldButton) {
      this.elements.foldButton.addEventListener('click', () => {
        this.handlePlayerAction('fold');
      });
    }
    
    if (this.elements.allInButton) {
      this.elements.allInButton.addEventListener('click', () => {
        this.handlePlayerAction('allIn');
      });
    }
    
    // Bet slider controls
    if (this.elements.betSlider) {
      this.elements.betSlider.addEventListener('input', (e) => {
        this.updateBetDisplay(e.target.value);
      });
    }
    
    if (this.elements.confirmBetButton) {
      this.elements.confirmBetButton.addEventListener('click', () => {
        this.handleBetConfirm();
      });
    }
    
    if (this.elements.cancelBetButton) {
      this.elements.cancelBetButton.addEventListener('click', () => {
        this.hideBetControls();
      });
    }
    
    // Multiplayer UI events
    if (this.elements.createRoomBtn) {
      this.elements.createRoomBtn.addEventListener('click', () => {
        this.handleCreateRoom();
      });
    }
    
    if (this.elements.joinRoomBtn) {
      this.elements.joinRoomBtn.addEventListener('click', () => {
        this.showJoinRoomSection();
      });
    }
    
    if (this.elements.refreshRoomsBtn) {
      this.elements.refreshRoomsBtn.addEventListener('click', () => {
        this.refreshRoomList();
      });
    }
    
    if (this.elements.joinWithCodeBtn) {
      this.elements.joinWithCodeBtn.addEventListener('click', () => {
        this.handleJoinRoom();
      });
    }
    
    if (this.elements.readyBtn) {
      this.elements.readyBtn.addEventListener('click', () => {
        this.handleToggleReady();
      });
    }
    
    if (this.elements.leaveRoomBtn) {
      this.elements.leaveRoomBtn.addEventListener('click', () => {
        this.handleLeaveRoom();
      });
    }
    
    if (this.elements.leaveGameBtn) {
      this.elements.leaveGameBtn.addEventListener('click', () => {
        this.handleLeaveRoom();
      });
    }
  }
  
  /**
   * Register mode controller events
   */
  registerModeEvents() {
    // Mode change
    this.modeController.on('modeChanged', (data) => {
      this.handleModeChange(data.mode);
    });
    
    // Room events
    this.modeController.on('roomCreated', (data) => {
      this.handleRoomCreated(data);
    });
    
    this.modeController.on('roomJoined', (data) => {
      this.handleRoomJoined(data);
    });
    
    this.modeController.on('roomUpdate', (data) => {
      this.updateRoomDisplay(data);
    });
    
    // Game events
    this.modeController.on('gameInitialized', (data) => {
      this.updateGameDisplay(data);
    });
    
    this.modeController.on('gameStarted', (data) => {
      this.handleGameStarted(data);
    });
    
    this.modeController.on('cardDealt', (data) => {
      // This event is for initializing the game stage
      // Cards are handled separately
    });
    
    this.modeController.on('dealCards', (data) => {
      this.renderPlayerCards('human', data.hand);
    });
    
    this.modeController.on('blindsPosted', (data) => {
      this.handleBlindsPosted(data);
    });
    
    this.modeController.on('arenaCardDealt', (data) => {
      this.renderArenaCard(data);
    });
    
    this.modeController.on('powerCardDealt', (data) => {
      this.renderPowerCard(data.card);
    });
    
    this.modeController.on('playerTurn', (data) => {
      this.handlePlayerTurn(data);
    });
    
    this.modeController.on('playerAction', (data) => {
      this.handlePlayerActionEvent(data);
    });
    
    this.modeController.on('gameStateUpdate', (data) => {
      this.updateGameState(data);
    });
    
    this.modeController.on('showdown', (data) => {
      this.handleShowdown(data);
    });
    
    // Error handling
    this.modeController.on('error', (data) => {
      this.showMessage(data.message);
    });
  }
  
  /**
   * Handle start game button click
   */
  handleStartGame() {
    if (this.modeController.currentMode === 'offline') {
      this.modeController.startOfflineGame();
    } else {
      // In online mode, this should be handled by the server
      // when all players are ready
    }
  }
  
  /**
   * Handle restart game button click
   */
  handleRestartGame() {
    // For now, just reload the page to reset everything
    window.location.reload();
  }
  
  /**
   * Handle player action button click
   * @param {String} action - Action type
   */
  handlePlayerAction(action) {
    this.modeController.processAction(action);
    
    // Hide betting controls
    this.hideBettingControls();
  }
  
  /**
   * Show bet slider controls
   * @param {String} actionType - 'bet' or 'raise'
   */
  showBetControls(actionType) {
    if (!this.elements.betSliderContainer || !this.elements.betSlider) return;
    
    // Store action type for later
    this.elements.betSliderContainer.dataset.actionType = actionType;
    
    // Get human player info
    let playerStack = 1000; // Default
    let playerBet = 0;
    let currentBet = 0;
    
    // Try to get actual values
    if (this.modeController.gameManager && this.modeController.gameManager.state) {
      const human = this.modeController.gameManager.state.players.find(p => p.id === 'human');
      if (human) {
        playerStack = human.stack;
        playerBet = human.bet;
      }
      currentBet = this.modeController.gameManager.state.currentBet;
    }
    
    // Set slider min/max values based on action type
    if (actionType === 'bet') {
      // For bet, minimum is the big blind
      const minBet = 10; // Big blind
      this.elements.betSlider.min = minBet;
      this.elements.betSlider.max = playerStack;
      this.elements.betSlider.value = Math.min(minBet * 2, playerStack);
    } else {
      // For raise, minimum is the current bet + min raise
      const minRaise = currentBet + 10; // Current bet + big blind
      this.elements.betSlider.min = minRaise;
      this.elements.betSlider.max = playerStack + playerBet;
      this.elements.betSlider.value = Math.min(minRaise * 1.5, playerStack + playerBet);
    }
    
    // Update display
    this.updateBetDisplay(this.elements.betSlider.value);
    
    // Show bet controls
    this.elements.betSliderContainer.style.display = 'block';
    
    // Hide action buttons
    this.elements.checkButton.style.display = 'none';
    this.elements.callButton.style.display = 'none';
    this.elements.betButton.style.display = 'none';
    this.elements.raiseButton.style.display = 'none';
    this.elements.foldButton.style.display = 'none';
    this.elements.allInButton.style.display = 'none';
  }
  
  /**
   * Hide bet slider controls
   */
  hideBetControls() {
    if (!this.elements.betSliderContainer) return;
    
    this.elements.betSliderContainer.style.display = 'none';
    
    // Show action buttons
    this.elements.checkButton.style.display = 'inline-block';
    this.elements.callButton.style.display = 'inline-block';
    this.elements.betButton.style.display = 'inline-block';
    this.elements.raiseButton.style.display = 'inline-block';
    this.elements.foldButton.style.display = 'inline-block';
    this.elements.allInButton.style.display = 'inline-block';
  }
  
  /**
   * Update bet display
   * @param {Number} value - Bet amount
   */
  updateBetDisplay(value) {
    if (!this.elements.betAmountDisplay) return;
    
    this.elements.betAmountDisplay.textContent = '$' + value;
  }
  
  /**
   * Handle bet confirm button click
   */
  handleBetConfirm() {
    if (!this.elements.betSliderContainer || !this.elements.betSlider) return;
    
    const actionType = this.elements.betSliderContainer.dataset.actionType;
    const amount = parseInt(this.elements.betSlider.value);
    
    this.modeController.processAction(actionType, amount);
    
    // Hide bet controls
    this.hideBetControls();
    
    // Hide betting controls
    this.hideBettingControls();
  }
  
  /**
   * Handle multiplayer create room button click
   */
  handleCreateRoom() {
    const playerName = this.elements.playerNameInput ? this.elements.playerNameInput.value.trim() : '';
    this.modeController.createRoom(playerName);
  }
  
  /**
   * Handle multiplayer join room button click
   */
  handleJoinRoom() {
    const roomCode = this.elements.roomCodeInput ? this.elements.roomCodeInput.value.trim() : '';
    const playerName = this.elements.playerNameInput ? this.elements.playerNameInput.value.trim() : '';
    
    if (!roomCode) {
      this.showMessage('Please enter a room code');
      return;
    }
    
    this.modeController.joinRoom(roomCode, playerName);
  }
  
  /**
   * Show join room section
   */
  showJoinRoomSection() {
    if (this.elements.joinRoomContainer) {
      this.elements.joinRoomContainer.style.display = 'flex';
    }
  }
  
  /**
   * Hide join room section
   */
  hideJoinRoomSection() {
    if (this.elements.joinRoomContainer) {
      this.elements.joinRoomContainer.style.display = 'none';
    }
  }
  
  /**
   * Refresh room list
   */
  refreshRoomList() {
    this.modeController.getRooms((rooms) => {
      this.updateRoomList(rooms);
    });
  }
  
  /**
   * Handle toggle ready button click
   */
  handleToggleReady() {
    if (!this.elements.readyBtn) return;
    
    const isReady = this.elements.readyBtn.classList.contains('ready');
    this.modeController.setReady(!isReady);
  }
  
  /**
   * Handle leave room button click
   */
  handleLeaveRoom() {
    this.modeController.leaveRoom();
  }
  
  /**
   * Update room list display
   * @param {Array} rooms - Array of room objects
   */
  updateRoomList(rooms) {
    if (!this.elements.roomList) return;
    
    if (rooms.length === 0) {
      this.elements.roomList.innerHTML = '<p class="empty-rooms">No rooms available. Create one to start playing!</p>';
      return;
    }
    
    this.elements.roomList.innerHTML = '';
    
    rooms.forEach(room => {
      const roomElement = document.createElement('div');
      roomElement.className = 'room-item';
      roomElement.innerHTML = `
        <span>Room ${room.roomCode}: ${room.playerCount}/${room.maxPlayers} players</span>
        <button class="button join-room-btn">Join</button>
      `;
      
      roomElement.querySelector('.join-room-btn').addEventListener('click', () => {
        const playerName = this.elements.playerNameInput ? this.elements.playerNameInput.value.trim() : '';
        this.modeController.joinRoom(room.roomCode, playerName);
      });
      
      this.elements.roomList.appendChild(roomElement);
    });
  }
  
  /**
   * Handle room created event
   * @param {Object} data - Room data
   */
  handleRoomCreated(data) {
    if (!this.elements.roomCodeDisplay) return;
    
    // Update room code display
    this.elements.roomCodeDisplay.textContent = data.roomCode;
    
    // Show room info section
    if (this.elements.roomInfoContainer) {
      this.elements.roomInfoContainer.style.display = 'block';
    }
    
    // Hide join room section
    this.hideJoinRoomSection();
  }
  
  /**
   * Handle room joined event
   * @param {Object} data - Room data
   */
  handleRoomJoined(data) {
    if (!this.elements.roomCodeDisplay) return;
    
    // Update room code display
    this.elements.roomCodeDisplay.textContent = data.roomCode;
    
    // Show room info section
    if (this.elements.roomInfoContainer) {
      this.elements.roomInfoContainer.style.display = 'block';
    }
    
    // Hide join room section
    this.hideJoinRoomSection();
  }
  
  /**
   * Update room display
   * @param {Object} data - Room data
   */
  updateRoomDisplay(data) {
    if (!this.elements.playerList) return;
    
    // Update player list
    this.elements.playerList.innerHTML = '';
    
    data.players.forEach(player => {
      const isCurrentPlayer = player.id === this.modeController.socket?.id;
      const playerElement = document.createElement('li');
      
      playerElement.innerHTML = `
        <span>${player.name}${isCurrentPlayer ? ' (You)' : ''}${player.isHost ? ' (Host)' : ''}</span>
        <span class="${player.ready ? 'player-ready' : 'player-not-ready'}">${player.ready ? 'Ready' : 'Not Ready'}</span>
      `;
      
      this.elements.playerList.appendChild(playerElement);
    });
    
    // Update ready button status
    if (this.elements.readyBtn) {
      const currentPlayer = data.players.find(p => p.id === this.modeController.socket?.id);
      if (currentPlayer) {
        this.elements.readyBtn.textContent = currentPlayer.ready ? 'Not Ready' : 'Ready';
        this.elements.readyBtn.classList.toggle('ready', currentPlayer.ready);
        this.elements.readyBtn.classList.toggle('not-ready', !currentPlayer.ready);
      }
    }
  }
  
  /**
   * Handle mode change
   * @param {String} mode - New mode
   */
  handleModeChange(mode) {
    // Toggle multiplayer UI
    if (mode === 'online') {
      // Show multiplayer UI
      if (this.elements.multiplayerOverlay) {
        this.elements.multiplayerOverlay.style.display = 'flex';
      }
    } else {
      // Hide multiplayer UI
      if (this.elements.multiplayerOverlay) {
        this.elements.multiplayerOverlay.style.display = 'none';
      }
      
      if (this.elements.multiplayerHud) {
        this.elements.multiplayerHud.style.display = 'none';
      }
    }
  }
  
  /**
   * Update game display
   * @param {Object} data - Game data
   */
  updateGameDisplay(data) {
    // Hide start button
    if (this.elements.startButton) {
      this.elements.startButton.style.display = 'none';
    }
    
    // Reset game display elements
    this.resetGameDisplay();
  }
  
  /**
   * Handle game started event
   * @param {Object} data - Game data
   */
  handleGameStarted(data) {
    // Hide multiplayer overlay
    if (this.elements.multiplayerOverlay) {
      this.elements.multiplayerOverlay.style.display = 'none';
    }
    
    // Show multiplayer HUD in online mode
    if (this.modeController.currentMode === 'online' && this.elements.multiplayerHud) {
      this.elements.multiplayerHud.style.display = 'flex';
      
      if (this.elements.hudRoomCode) {
        this.elements.hudRoomCode.textContent = this.modeController.roomCode;
      }
    }
    
    // Reset game display elements
    this.resetGameDisplay();
    
    // Add game started message to log
    this.addToGameLog('Game started. Dealing Monster Cards...', 'action');
  }
  
  /**
   * Reset game display
   */
  resetGameDisplay() {
    // Reset player displays
    ['human', 'ai1', 'ai2', 'ai3'].forEach(id => {
      if (this.elements.players[id]) {
        // Reset cards
        if (this.elements.players[id].cards) {
          this.elements.players[id].cards.innerHTML = '';
        }
        
        // Reset bet amount
        if (this.elements.players[id].betAmount) {
          this.elements.players[id].betAmount.style.display = 'none';
        }
        
        // Reset chips
        if (this.elements.players[id].chips) {
          this.elements.players[id].chips.innerHTML = '';
        }
        
        // Reset action
        if (this.elements.players[id].action) {
          this.elements.players[id].action.className = 'player-action';
        }
        
        // Reset total
        if (this.elements.players[id].total) {
          this.elements.players[id].total.textContent = '';
        }
        
        // Reset folded state
        if (this.elements.players[id].container) {
          this.elements.players[id].container.classList.remove('folded', 'active');
        }
      }
    });
    
    // Reset arena and power cards
    if (this.elements.arenaLabel) {
      this.elements.arenaLabel.textContent = '';
      this.elements.arenaLabel.className = 'arena-label';
    }
    
    if (this.elements.powerCardsContainer) {
      this.elements.powerCardsContainer.className = '';
      this.elements.powerCardsContainer.style.borderColor = 'transparent';
    }
    
    if (this.elements.powerCards) {
      this.elements.powerCards.innerHTML = '';
    }
    
    // Reset pot
    if (this.elements.pot) {
      this.elements.pot.textContent = 'Pot: $0';
    }
    
    // Reset game stage
    this.updateGameStage('preflop');
  }
  
  /**
   * Handle blinds posted event
   * @param {Object} data - Blinds data
   */
  handleBlindsPosted(data) {
    this.addToGameLog(`${data.smallBlind.player} posts small blind: $${data.smallBlind.amount}`, 'bet');
    this.addToGameLog(`${data.bigBlind.player} posts big blind: $${data.bigBlind.amount}`, 'bet');
    
    // Show small blind marker
    // (This will be handled by player positions update)
  }
  
  /**
   * Handle player turn event
   * @param {Object} data - Player turn data
   */
  handlePlayerTurn(data) {
    // Highlight active player
    this.highlightActivePlayer(data.playerId);
    
    // Update game stage if provided
    if (data.stage) {
      this.updateGameStage(data.stage);
    }
    
    // Update pot and bet
    if (data.pot !== undefined) {
      this.updatePotDisplay(data.pot);
    }
    
    // Show betting controls if it's human's turn
    if (data.playerId === 'human' || data.playerId === this.modeController.socket?.id) {
      this.showBettingControls(data.currentBet);
    }
  }
  
  /**
   * Handle player action event
   * @param {Object} data - Player action data
   */
  handlePlayerActionEvent(data) {
    let actionText = '';
    let actionType = '';
    
    switch (data.type) {
      case 'check':
        actionText = `${data.playerName} checks.`;
        actionType = 'action';
        break;
      case 'fold':
        actionText = `${data.playerName} folds.`;
        actionType = 'fold';
        break;
      case 'call':
        actionText = `${data.playerName} calls $${data.amount}.`;
        actionType = 'action';
        break;
      case 'bet':
        actionText = `${data.playerName} bets $${data.amount}.`;
        actionType = 'bet';
        break;
      case 'raise':
        actionText = `${data.playerName} raises to $${data.amount}.`;
        actionType = 'bet';
        break;
      case 'allIn':
        actionText = `${data.playerName} goes all-in with $${data.amount}!`;
        actionType = 'bet';
        break;
    }
    
    // Add to game log
    this.addToGameLog(actionText, actionType);
    
    // Show action indicator
    let playerId = data.playerId === this.modeController.socket?.id ? 'human' : data.playerId;
    
    // For offline mode or if we need to map to AI slots
    if (this.modeController.currentMode === 'offline' || playerId.length > 10) {
      // Find the player in the game state
      if (this.modeController.gameManager) {
        const playerIndex = this.modeController.gameManager.state.players.findIndex(p => p.id === data.playerId);
        if (playerIndex >= 0) {
          playerId = playerIndex === 0 ? 'human' : `ai${playerIndex}`;
        }
      }
    }
    
    this.showPlayerAction(playerId, data.type, data.amount);
  }
  
  /**
   * Update game state
   * @param {Object} state - Game state
   */
  updateGameState(state) {
    // Update players
    if (state.players) {
      state.players.forEach(player => {
        // Find corresponding player element
        let playerId = player.id === this.modeController.socket?.id ? 'human' : player.id;
        
        // For offline mode or if we need to map to AI slots
        if (this.modeController.currentMode === 'offline' || playerId.length > 10) {
          const playerElements = Object.keys(this.elements.players);
          
          // Try to find player by ID attribute
          for (const elementId of playerElements) {
            const container = this.elements.players[elementId].container;
            if (container && container.getAttribute('data-player-id') === player.id) {
              playerId = elementId;
              break;
            }
          }
        }
        
        // Update player display
        this.updatePlayerDisplay(playerId, player);
        
        // Render cards if available
        if (player.hand) {
          this.renderPlayerCards(playerId, player.hand);
        }
      });
    }
    
    // Update arena card
    if (state.arenaCard) {
      this.renderArenaCard(state.arenaCard);
    }
    
    // Update power cards
    if (state.powerCards) {
      // Clear power cards first
      if (this.elements.powerCards) {
        this.elements.powerCards.innerHTML = '';
      }
      
      // Render each power card
      state.powerCards.forEach(card => {
        this.renderPowerCard(card);
      });
    }
    
    // Update game stage
    if (state.currentStage) {
      this.updateGameStage(state.currentStage);
    }
    
    // Update pot
    if (state.pot !== undefined) {
      this.updatePotDisplay(state.pot);
    }
    
    // Update active player
    if (state.activePlayerIndex !== undefined && state.players) {
      const activePlayerId = state.players[state.activePlayerIndex].id;
      this.highlightActivePlayer(activePlayerId);
    }
    
    // Update player positions
    if (state.playerPositions) {
      this.updatePlayerPositions(state.playerPositions);
    }
  }
  
  /**
   * Handle showdown event
   * @param {Object} data - Showdown data
   */
  handleShowdown(data) {
    // Log winners
    data.winners.forEach(winner => {
      if (winner.handValue === 'N/A') {
        this.addToGameLog(`${winner.name} wins $${winner.potWon} as the last player standing!`, 'win');
      } else {
        this.addToGameLog(`${winner.name} wins $${winner.potWon} with hand value ${winner.handValue}!`, 'win');
      }
    });
    
    // Show all hands if provided
    if (data.hands) {
      data.hands.forEach(handInfo => {
        if (!handInfo.folded) {
          // Find player ID
          let playerId = handInfo.id === this.modeController.socket?.id ? 'human' : handInfo.id;
          
          // For offline mode or if we need to map to AI slots
          if (this.modeController.currentMode === 'offline' || playerId.length > 10) {
            const playerIndex = this.modeController.gameManager.state.players.findIndex(p => p.id === handInfo.id);
            if (playerIndex >= 0) {
              playerId = playerIndex === 0 ? 'human' : `ai${playerIndex}`;
            }
          }
          
          // Render cards
          this.renderPlayerCards(playerId, handInfo.hand, true);
        }
      });
    }
    
    // Show winner overlay
    this.showWinnerOverlay(data.winners[0]);
    
    // Show restart button
    if (this.elements.restartButton) {
      this.elements.restartButton.style.display = 'block';
    }
  }
  
  /**
   * Update player display
   * @param {String} playerId - Player ID
   * @param {Object} player - Player data
   */
  updatePlayerDisplay(playerId, player) {
    const elements = this.elements.players[playerId];
    if (!elements) return;
    
    // Set player ID for future reference
    if (elements.container) {
      elements.container.setAttribute('data-player-id', player.id);
    }
    
    // Update stack
    if (elements.stack) {
      elements.stack.innerHTML = `<i class="fas fa-coins stack-icon"></i> $${player.stack}`;
    }
    
    // Update bet amount
    if (elements.betAmount) {
      if (player.bet > 0) {
        elements.betAmount.textContent = `$${player.bet}`;
        elements.betAmount.style.display = 'block';
      } else {
        elements.betAmount.style.display = 'none';
      }
    }
    
    // Update folded state
    if (elements.container) {
      elements.container.classList.toggle('folded', player.folded);
    }
    
    // Render chips for bet
    this.renderChips(playerId, player.bet);
  }
  
  /**
   * Render player cards
   * @param {String} playerId - Player ID
   * @param {Array} cards - Card array
   * @param {Boolean} showdown - Whether this is during showdown
   */
  renderPlayerCards(playerId, cards, showdown = false) {
    const cardContainer = this.elements.players[playerId]?.cards;
    if (!cardContainer) return;
    
    // Clear existing cards
    cardContainer.innerHTML = '';
    
    // Handle folded state
    if (this.elements.players[playerId]?.container.classList.contains('folded')) {
      const foldedText = document.createElement('div');
      foldedText.textContent = 'Folded';
      foldedText.style.fontSize = '16px';
      foldedText.style.color = '#aaa';
      foldedText.style.textAlign = 'center';
      foldedText.style.marginTop = '20px';
      cardContainer.appendChild(foldedText);
      return;
    }
    
    // Render each card
    cards.forEach(card => {
      let cardDiv = document.createElement('div');
      
      // Only show face-up cards for human player or during showdown
      if (playerId === 'human' || showdown) {
        cardDiv.className = `card monster ${card.element.toLowerCase()}-card ${this.animations.cardDeal}`;
        
        // Calculate bonus (dummy implementation for now)
        let bonus = 0;
        let bonusClass = bonus >= 0 ? 'bonus-positive' : 'bonus-negative';
        
        let iconHTML = this.elementIcons[card.element] || '';
        cardDiv.innerHTML = `
          <div class="card-type">${iconHTML} ${card.element}</div>
          <div class="card-name">${card.name}</div>
          <div class="card-value">${card.value}</div>
          <div class="bonus-indicator ${bonusClass}">${bonus >= 0 ? '+' + bonus : bonus}</div>
        `;
      } else {
        // Card back for AI players
        cardDiv.className = `card card-back ${this.animations.cardDeal}`;
      }
      
      cardContainer.appendChild(cardDiv);
    });
    
    // Update total hand value if showing cards
    if (playerId === 'human' || showdown) {
      // Simple implementation - just sum card values
      const total = cards.reduce((sum, card) => sum + card.value, 0);
      
      if (this.elements.players[playerId]?.total) {
        this.elements.players[playerId].total.innerText = `Total: ${total}`;
      }
    }
  }
  
  /**
   * Render arena card
   * @param {Object} card - Arena card
   */
  renderArenaCard(card) {
    if (!this.elements.arenaLabel || !this.elements.powerCardsContainer) return;
    
    // Update arena label
    this.elements.arenaLabel.innerText = `${card.name} (${card.element})`;
    this.elements.arenaLabel.style.color = this.elementColors[card.element] || '#fff';
    this.elements.arenaLabel.classList.add('active');
    
    // Update arena container styling
    this.elements.powerCardsContainer.className = `${card.element.toLowerCase()}-arena`;
    this.elements.powerCardsContainer.style.borderColor = this.elementColors[card.element] || 'transparent';
    this.elements.powerCardsContainer.style.background = this.elementGradients[card.element] || 'none';
    
    // Add to game log
    this.addToGameLog(`Arena revealed: ${card.name} (${card.element})`, 'action');
  }
  
  /**
   * Render power card
   * @param {Object} card - Power card
   */
  renderPowerCard(card) {
    if (!this.elements.powerCards) return;
    
    // Create card element
    const cardDiv = document.createElement('div');
    cardDiv.className = `card power ${card.element.toLowerCase()}-card ${this.animations.cardDeal}`;
    
    // Add card content
    const iconHTML = this.elementIcons[card.element] || '';
    cardDiv.innerHTML = `
      <div class="card-type">${iconHTML} ${card.element}</div>
      <div class="card-name">${card.name}</div>
      <div class="card-value">+${card.power}</div>
    `;
    
    // Add to container
    this.elements.powerCards.appendChild(cardDiv);
    
    // Add to game log
    this.addToGameLog(`Power Card dealt: ${card.name} (${card.element} +${card.power})`, 'action');
  }
  
  /**
   * Render chips for player bet
   * @param {String} playerId - Player ID
   * @param {Number} betAmount - Bet amount
   */
  renderChips(playerId, betAmount) {
    const chipsContainer = this.elements.players[playerId]?.chips;
    if (!chipsContainer) return;
    
    // Clear existing chips
    chipsContainer.innerHTML = '';
    
    if (betAmount <= 0) return;
    
    // Determine chip denominations
    const chipValues = [100, 25, 10, 5, 1];
    let remainingAmount = betAmount;
    
    // Create chips for each denomination
    chipValues.forEach(value => {
      const count = Math.floor(remainingAmount / value);
      remainingAmount -= count * value;
      
      // Limit to 3 chips per denomination for visual clarity
      const displayCount = Math.min(count, 3);
      
      for (let i = 0; i < displayCount; i++) {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.setAttribute('data-value', value);
        
        // Add small value indicator
        if (value >= 5) {
          chip.innerHTML = `<span style="font-size:10px;font-weight:bold;color:rgba(255,255,255,0.8);">${value}</span>`;
        }
        
        chipsContainer.appendChild(chip);
      }
    });
    
    // Add total chip count for large bets
    if (betAmount > 100) {
      const chipCount = document.createElement('div');
      chipCount.className = 'chip-count';
      chipCount.textContent = '$' + betAmount;
      chipsContainer.appendChild(chipCount);
    }
  }
  
  /**
   * Update player positions
   * @param {Array} positions - Player position data
   */
  updatePlayerPositions(positions) {
    // Find current player's position
    const myId = this.modeController.currentMode === 'online' ? this.modeController.socket?.id : 'human';
    const myPosition = positions.find(p => p.id === myId);
    
    if (!myPosition) return;
    
    // Update human position
    if (this.elements.players.human?.position) {
      this.elements.players.human.position.innerHTML = myPosition.position;
      this.elements.players.human.position.className = `player-position ${myPosition.isDealer ? 'dealer' : ''} ${myPosition.isSB ? 'small-blind' : ''} ${myPosition.isBB ? 'big-blind' : ''}`;
    }
    
    // Find other players' positions
    const otherPositions = positions.filter(p => p.id !== myId);
    
    // Calculate relative positions
    const myTablePos = myPosition.tablePosition;
    
    // Map other players to visual slots based on table position
    otherPositions.forEach(pos => {
      // Calculate position relative to current player (0=same, 1=left, 2=across, 3=right)
      let relPos = (pos.tablePosition - myTablePos + 4) % 4;
      
      // Map to UI slot
      let slotId;
      switch (relPos) {
        case 1: slotId = 'ai3'; break; // Left
        case 2: slotId = 'ai1'; break; // Across
        case 3: slotId = 'ai2'; break; // Right
        default: return; // Ignore
      }
      
      // Update position display
      if (this.elements.players[slotId]?.position) {
        this.elements.players[slotId].position.innerHTML = pos.position;
        this.elements.players[slotId].position.className = `player-position ${pos.isDealer ? 'dealer' : ''} ${pos.isSB ? 'small-blind' : ''} ${pos.isBB ? 'big-blind' : ''}`;
      }
      
      // Update container data attribute
      if (this.elements.players[slotId]?.container) {
        this.elements.players[slotId].container.setAttribute('data-player-id', pos.id);
      }
    });
    
    // Position blind buttons
    this.positionBlindButtons(positions);
  }
  
  /**
   * Position blind buttons
   * @param {Array} positions - Player positions
   */
  positionBlindButtons(positions) {
    // Find players with special positions
    const dealerPos = positions.find(p => p.isDealer);
    const sbPos = positions.find(p => p.isSB);
    const bbPos = positions.find(p => p.isBB);
    
    // Reset buttons
    if (this.elements.dealerButton) {
      this.elements.dealerButton.style.display = 'none';
    }
    
    if (this.elements.smallBlindButton) {
      this.elements.smallBlindButton.style.display = 'none';
    }
    
    if (this.elements.bigBlindButton) {
      this.elements.bigBlindButton.style.display = 'none';
    }
    
    // Position dealer button
    if (dealerPos && this.elements.dealerButton) {
      this.positionButton(this.elements.dealerButton, dealerPos.id, 'dealer');
    }
    
    // Position small blind button
    if (sbPos && this.elements.smallBlindButton) {
      this.positionButton(this.elements.smallBlindButton, sbPos.id, 'sb');
    }
    
    // Position big blind button
    if (bbPos && this.elements.bigBlindButton) {
      this.positionButton(this.elements.bigBlindButton, bbPos.id, 'bb');
    }
  }
  
  /**
   * Position button next to player
   * @param {HTMLElement} button - Button element
   * @param {String} playerId - Player ID
   * @param {String} type - Button type
   */
  positionButton(button, playerId, type) {
    let playerEl = null;
    let playerSlot = null;
    
    // Find player element
    for (const slot in this.elements.players) {
      if (this.elements.players[slot].container &&
          this.elements.players[slot].container.getAttribute('data-player-id') === playerId) {
        playerEl = this.elements.players[slot].container;
        playerSlot = slot;
        break;
      }
    }
    
    if (!playerEl || !playerSlot) return;
    
    // Show button
    button.style.display = 'flex';
    
    // Position based on player slot
    const positions = {
      'human': { left: '100px', top: '50%', transform: 'translateY(-50%)' },
      'ai1': { left: '50%', top: '75px', transform: 'translateX(-50%)' },
      'ai2': { right: '100px', top: '50%', transform: 'translateY(-50%)' },
      'ai3': { left: '50%', bottom: '75px', transform: 'translateX(-50%)' }
    };
    
    const position = positions[playerSlot];
    
    if (position) {
      Object.keys(position).forEach(prop => {
        button.style[prop] = position[prop];
      });
    }
  }
  
  /**
   * Highlight active player
   * @param {String} playerId - Active player ID
   */
  highlightActivePlayer(playerId) {
    // Remove active class from all players
    for (const slot in this.elements.players) {
      if (this.elements.players[slot].container) {
        this.elements.players[slot].container.classList.remove('active');
      }
    }
    
    // Find player element by ID
    for (const slot in this.elements.players) {
      if (this.elements.players[slot].container && 
          (this.elements.players[slot].container.getAttribute('data-player-id') === playerId ||
           (playerId === 'human' && slot === 'human'))) {
        this.elements.players[slot].container.classList.add('active');
        break;
      }
    }
  }
  
  /**
   * Update game stage
   * @param {String} stage - Game stage
   */
  updateGameStage(stage) {
    // Update stage dots
    if (this.elements.stageDots) {
      // Remove active class from all dots
      this.elements.stageDots.forEach(dot => dot.classList.remove('active'));
      
      // Add active class to current stage dot
      const stageIndex = ['preflop', 'arena', 'power1', 'power2', 'power3'].indexOf(stage);
      if (stageIndex >= 0 && stageIndex < this.elements.stageDots.length) {
        this.elements.stageDots[stageIndex].classList.add('active');
      }
    }
  }
  
  /**
   * Update pot display
   * @param {Number} amount - Pot amount
   */
  updatePotDisplay(amount) {
    if (this.elements.pot) {
      this.elements.pot.textContent = `Pot: $${amount}`;
    }
  }
  
  /**
   * Show player action
   * @param {String} playerId - Player ID
   * @param {String} action - Action type
   * @param {Number} amount - Bet amount
   */
  showPlayerAction(playerId, action, amount = 0) {
    const actionDiv = this.elements.players[playerId]?.action;
    if (!actionDiv) return;
    
    // Format action text
    let actionText = action;
    if (action === 'bet' || action === 'raise' || action === 'call' || action === 'allIn') {
      actionText = `${action} $${amount}`;
    }
    
    // Update action display
    actionDiv.textContent = actionText;
    actionDiv.className = `player-action ${action.toLowerCase()}`;
    actionDiv.classList.add('visible');
    
    // Hide action after a delay
    setTimeout(() => {
      actionDiv.classList.remove('visible');
    }, 2000);
  }
  
  /**
   * Show betting controls
   * @param {Number} currentBet - Current bet amount
   */
  showBettingControls(currentBet) {
    if (!this.elements.bettingControls) return;
    
    // Show betting controls
    this.elements.bettingControls.classList.add('visible');
    
    // Update available actions
    this.updateActionButtons(currentBet);
  }
  
  /**
   * Hide betting controls
   */
  hideBettingControls() {
    if (this.elements.bettingControls) {
      this.elements.bettingControls.classList.remove('visible');
    }
  }
  
  /**
   * Update action buttons
   * @param {Number} currentBet - Current bet amount
   */
  updateActionButtons(currentBet) {
    // Safety check
    if (
      !this.elements.checkButton || 
      !this.elements.callButton || 
      !this.elements.betButton || 
      !this.elements.raiseButton || 
      !this.elements.allInButton
    ) return;
    
    // Get human player info
    let playerStack = 1000; // Default
    let playerBet = 0;
    
    // Try to get actual values from game state
    if (this.modeController.gameManager?.state) {
      const human = this.modeController.gameManager.state.players.find(p => p.id === 'human');
      if (human) {
        playerStack = human.stack;
        playerBet = human.bet;
      }
    }
    
    // Reset all buttons
    this.elements.checkButton.disabled = false;
    this.elements.callButton.disabled = false;
    this.elements.betButton.disabled = false;
    this.elements.raiseButton.disabled = false;
    this.elements.allInButton.disabled = false;
    
    // Handle all-in case
    if (playerStack === 0) {
      this.elements.checkButton.disabled = true;
      this.elements.callButton.disabled = true;
      this.elements.betButton.disabled = true;
      this.elements.raiseButton.disabled = true;
      this.elements.allInButton.disabled = true;
      return;
    }
    
    // If there's a bet to call
    if (currentBet > playerBet) {
      this.elements.checkButton.disabled = true;
      
      // Calculate call amount
      const callAmount = currentBet - playerBet;
      
      // If player can't afford the call
      if (playerStack < callAmount) {
        this.elements.callButton.disabled = true;
      }
      
      // Enable/disable Raise based on stack size
      if (playerStack <= callAmount || playerStack < 10) { // 10 = big blind
        this.elements.raiseButton.disabled = true;
      }
      
      // Show Raise instead of Bet when there's already a bet
      this.elements.betButton.style.display = 'none';
      this.elements.raiseButton.style.display = 'inline-block';
      
      // Update call button text
      this.elements.callButton.textContent = `Call $${callAmount}`;
    } else {
      // No bet or player has already matched the current bet
      this.elements.checkButton.disabled = false;
      this.elements.callButton.disabled = true;
      
      // Show Bet instead of Raise when there's no bet
      this.elements.betButton.style.display = 'inline-block';
      this.elements.raiseButton.style.display = 'none';
      
      // Reset call button text
      this.elements.callButton.textContent = 'Call';
    }
    
    // If human can't bet the minimum, disable bet button
    if (playerStack < 10) { // 10 = big blind
      this.elements.betButton.disabled = true;
    }
  }
  
  /**
   * Show winner overlay
   * @param {Object} winner - Winner data
   */
  showWinnerOverlay(winner) {
    if (!this.elements.winnerOverlay || !this.elements.winnerTitle || !this.elements.winnerInfo || !this.elements.winnerPot) return;
    
    // Update winner info
    this.elements.winnerTitle.textContent = `${winner.name} Wins!`;
    
    if (winner.handValue === 'N/A') {
      this.elements.winnerInfo.textContent = 'as the last player standing';
    } else {
      this.elements.winnerInfo.textContent = `with Monster Total: ${winner.handValue}`;
    }
    
    this.elements.winnerPot.textContent = `Pot: $${winner.potWon}`;
    
    // Show overlay
    this.elements.winnerOverlay.classList.add('visible');
  }
  
  /**
   * Hide winner overlay
   */
  hideWinnerOverlay() {
    if (this.elements.winnerOverlay) {
      this.elements.winnerOverlay.classList.remove('visible');
    }
  }
  
  /**
   * Add to game log
   * @param {String} message - Log message
   * @param {String} type - Log type (action, bet, fold, win)
   */
  addToGameLog(message, type = '') {
    if (!this.elements.gameLog) return;
    
    const logEntry = document.createElement('p');
    logEntry.textContent = message;
    
    if (type) {
      logEntry.classList.add(`log-${type}`);
    }
    
    this.elements.gameLog.appendChild(logEntry);
    this.elements.gameLog.scrollTop = this.elements.gameLog.scrollHeight;
  }
  
  /**
   * Clear game log
   */
  clearGameLog() {
    if (this.elements.gameLog) {
      this.elements.gameLog.innerHTML = '';
    }
  }
  
  /**
   * Show message
   * @param {String} message - Message text
   */
  showMessage(message) {
    if (!this.elements.message) return;
    
    this.elements.message.textContent = message;
    this.elements.message.classList.add('visible');
    
    // Auto-hide after a delay
    setTimeout(() => {
      this.elements.message.classList.remove('visible');
    }, 5000);
  }
}

// Export in browser environment
if (typeof window !== 'undefined') {
  window.UIController = UIController;
}
