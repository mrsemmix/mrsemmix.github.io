// Add this file to public directory
(function () {
  // Mode controller that works with existing code
  window.ModeController = {
    currentMode: 'offline',

    initOnlineMode: function () {
      if (this.currentMode === 'online') return;

      // Initialize Socket.io connection
      this.socket = io();

      // Override game functions with socket-enabled versions
      this.overrideGameFunctions();

      // Set up socket event handlers
      this.setupSocketHandlers();

      this.currentMode = 'online';
      console.log('Switched to online mode');
    },

    initOfflineMode: function () {
      if (this.currentMode === 'offline') return;

      // Restore original functions
      this.restoreOriginalFunctions();

      // Disconnect socket if connected
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }

      this.currentMode = 'offline';
      console.log('Switched to offline mode');
    },

    overrideGameFunctions: function () {
      // Save originals if not saved yet
      if (!window.originalGameFunctions) {
        window.originalGameFunctions = {
          initGame: GAME.engine.initGame,
          processHumanAction: GAME.engine.processHumanAction,
          moveToNextPlayer: GAME.engine.moveToNextPlayer,
          advanceGame: GAME.engine.advanceGame
        };
      }

      // Override with online-aware versions
      GAME.engine.processHumanAction = function (action, betAmount = 0) {
        console.log('Sending action to server:', action, betAmount);

        // Send to server instead of processing locally
        window.ModeController.socket.emit('gameAction', {
          type: action.toLowerCase(),
          amount: betAmount
        });

        // Hide betting controls
        document.getElementById('betting-controls').classList.remove('visible');

        // Show visual feedback
        GAME.utils.showPlayerAction('human', action, betAmount);

        return true; // Always return true, server will validate
      };

      // Add more overrides as needed
    },

    restoreOriginalFunctions: function () {
      // Restore original functions if they were saved
      if (window.originalGameFunctions) {
        GAME.engine.initGame = window.originalGameFunctions.initGame;
        GAME.engine.processHumanAction = window.originalGameFunctions.processHumanAction;
        GAME.engine.moveToNextPlayer = window.originalGameFunctions.moveToNextPlayer;
        GAME.engine.advanceGame = window.originalGameFunctions.advanceGame;
      }
    },

    setupSocketHandlers: function () {
      const socket = this.socket;

      // Connection events
      socket.on('connect', () => {
        console.log('Connected to server');
      });

      // Game events from server
      socket.on('gameStarted', (data) => {
        console.log('Game started:', data);
        // Initialize UI
      });

      socket.on('dealCards', (data) => {
        console.log('Cards dealt:', data);
        // Update player cards
      });

      // Add more socket handlers
    },

    // Methods to create/join rooms
    createRoom: function (playerName) {
      if (this.currentMode !== 'online') {
        this.initOnlineMode();
      }

      this.socket.emit('createRoom', playerName, (response) => {
        if (response.success) {
          console.log('Room created:', response.roomCode);
        } else {
          console.error('Failed to create room:', response.error);
        }
      });
    },

    joinRoom: function (roomCode, playerName) {
      if (this.currentMode !== 'online') {
        this.initOnlineMode();
      }

      this.socket.emit('joinRoom', {
        roomCode: roomCode,
        playerName: playerName
      }, (response) => {
        if (response.success) {
          console.log('Joined room:', response.roomCode);
        } else {
          console.error('Failed to join room:', response.error);
        }
      });
    }
  };

  // Initialize based on URL parameter
  document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');

    if (mode === 'online') {
      window.ModeController.initOnlineMode();
    }
  });
})();