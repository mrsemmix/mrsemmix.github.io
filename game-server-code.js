/**
 * game-server.js
 * Socket.io server implementation for PokerMon
 */

const GameManager = require('./game-manager');

class GameServer {
  constructor(io) {
    this.io = io;
    this.rooms = {}; // roomCode -> room object
    this.playerRooms = {}; // playerId -> roomCode
    
    // Initialize Socket.io handlers
    this.init();
  }
  
  /**
   * Initialize Socket.io handlers
   */
  init() {
    this.io.on('connection', (socket) => {
      console.log(`Player connected: ${socket.id}`);
      
      // Room management
      socket.on('createRoom', (playerName, callback) => this.handleCreateRoom(socket, playerName, callback));
      socket.on('joinRoom', (data, callback) => this.handleJoinRoom(socket, data, callback));
      socket.on('getRooms', (callback) => this.handleGetRooms(callback));
      socket.on('playerReady', (ready) => this.handlePlayerReady(socket, ready));
      
      // Game actions
      socket.on('gameAction', (action) => this.handleGameAction(socket, action));
      
      // Disconnection
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }
  
  /**
   * Handle create room request
   * @param {Object} socket - Socket.io socket
   * @param {String} playerName - Player name
   * @param {Function} callback - Callback function
   */
  handleCreateRoom(socket, playerName, callback) {
    // Generate room code
    const roomCode = this.generateRoomCode();
    
    // Create player object
    const player = {
      id: socket.id,
      name: playerName || `Player_${socket.id.substr(0, 4)}`,
      ready: false,
      isHost: true
    };
    
    // Create room
    this.rooms[roomCode] = {
      players: {},
      gameInProgress: false,
      gameManager: null
    };
    
    // Add player to room
    this.rooms[roomCode].players[socket.id] = player;
    
    // Track player's room
    this.playerRooms[socket.id] = roomCode;
    
    // Join socket to room
    socket.join(roomCode);
    
    // Return success
    callback({
      success: true,
      roomCode,
      player
    });
    
    console.log(`Room ${roomCode} created by ${player.name}`);
  }
  
  /**
   * Handle join room request
   * @param {Object} socket - Socket.io socket
   * @param {Object} data - Join data (roomCode, playerName)
   * @param {Function} callback - Callback function
   */
  handleJoinRoom(socket, data, callback) {
    const { roomCode, playerName } = data;
    
    // Check if room exists
    if (!this.rooms[roomCode]) {
      callback({ success: false, error: 'Room not found' });
      return;
    }
    
    // Check if room is full
    if (Object.keys(this.rooms[roomCode].players).length >= 4) {
      callback({ success: false, error: 'Room is full' });
      return;
    }
    
    // Check if game is in progress
    if (this.rooms[roomCode].gameInProgress) {
      callback({ success: false, error: 'Game is already in progress' });
      return;
    }
    
    // Create player object
    const player = {
      id: socket.id,
      name: playerName || `Player_${socket.id.substr(0, 4)}`,
      ready: false,
      isHost: false
    };
    
    // Add player to room
    this.rooms[roomCode].players[socket.id] = player;
    
    // Track player's room
    this.playerRooms[socket.id] = roomCode;
    
    // Join socket to room
    socket.join(roomCode);
    
    // Return success
    callback({
      success: true,
      roomCode,
      player
    });
    
    // Update room info for all players
    this.io.to(roomCode).emit('roomUpdate', this.getRoomInfo(roomCode));
    
    console.log(`Player ${player.name} joined room ${roomCode}`);
  }
  
  /**
   * Handle get rooms request
   * @param {Function} callback - Callback function
   */
  handleGetRooms(callback) {
    // Get available rooms (not full, not in progress)
    const availableRooms = Object.entries(this.rooms)
      .filter(([_, room]) => !room.gameInProgress && Object.keys(room.players).length < 4)
      .map(([code, room]) => ({
        roomCode: code,
        playerCount: Object.keys(room.players).length,
        maxPlayers: 4
      }));
    
    callback(availableRooms);
  }
  
  /**
   * Handle player ready status change
   * @param {Object} socket - Socket.io socket
   * @param {Boolean} ready - Ready status
   */
  handlePlayerReady(socket, ready) {
    const roomCode = this.playerRooms[socket.id];
    
    // Check if player is in a room
    if (!roomCode || !this.rooms[roomCode] || !this.rooms[roomCode].players[socket.id]) {
      return;
    }
    
    // Update player ready status
    this.rooms[roomCode].players[socket.id].ready = ready;
    
    // Update room info for all players
    this.io.to(roomCode).emit('roomUpdate', this.getRoomInfo(roomCode));
    
    // Check if all players are ready to start
    const allReady = Object.values(this.rooms[roomCode].players).every(p => p.ready);
    const playerCount = Object.keys(this.rooms[roomCode].players).length;
    
    if (allReady && playerCount >= 2 && !this.rooms[roomCode].gameInProgress) {
      // Start game
      this.startGame(roomCode);
    }
  }
  
  /**
   * Handle game action
   * @param {Object} socket - Socket.io socket
   * @param {Object} action - Action data
   */
  handleGameAction(socket, action) {
    const roomCode = this.playerRooms[socket.id];
    
    // Check if player is in a room with game in progress
    if (
      !roomCode || 
      !this.rooms[roomCode] || 
      !this.rooms[roomCode].players[socket.id] ||
      !this.rooms[roomCode].gameInProgress ||
      !this.rooms[roomCode].gameManager
    ) {
      return;
    }
    
    // Process action
    const result = this.rooms[roomCode].gameManager.processPlayerAction(
      socket.id,
      action.type,
      action.amount
    );
    
    if (result.success) {
      // Action was successful, broadcast to room
      this.io.to(roomCode).emit('playerAction', {
        playerId: socket.id,
        playerName: this.rooms[roomCode].players[socket.id].name,
        type: action.type,
        amount: result.amount || 0
      });
      
      // Move to next player or stage
      this.processNextAction(roomCode);
    }
  }
  
  /**
   * Process next action (move to next player or stage)
   * @param {String} roomCode - Room code
   */
  processNextAction(roomCode) {
    const room = this.rooms[roomCode];
    
    // Check if betting round is complete
    if (room.gameManager.isBettingRoundComplete()) {
      // Advance to next stage
      const result = room.gameManager.advanceGameStage();
      
      if (result.success) {
        // Handle stage advancement
        if (result.stage === 'arena') {
          // Arena card revealed
          this.io.to(roomCode).emit('arenaCardDealt', result.stageResult);
        } else if (result.stage.startsWith('power')) {
          // Power card revealed
          this.io.to(roomCode).emit('powerCardDealt', result.stageResult);
        } else if (result.stage === 'showdown') {
          // Game over, handle showdown
          this.io.to(roomCode).emit('showdown', {
            winners: result.winners,
            hands: result.hands
          });
          
          // End game after a delay
          setTimeout(() => {
            this.endGame(roomCode);
          }, 8000);
          
          return;
        }
        
        // Announce next player's turn
        this.io.to(roomCode).emit('playerTurn', {
          playerId: result.nextPlayer.id,
          playerName: result.nextPlayer.name,
          stage: result.stage,
          currentBet: room.gameManager.state.currentBet,
          pot: room.gameManager.state.pot
        });
      }
    } else {
      // Move to next player
      const nextPlayer = room.gameManager.moveToNextPlayer();
      
      // Announce next player's turn
      this.io.to(roomCode).emit('playerTurn', {
        playerId: nextPlayer.playerId,
        playerName: nextPlayer.playerName,
        stage: room.gameManager.state.currentStage,
        currentBet: room.gameManager.state.currentBet,
        pot: room.gameManager.state.pot
      });
    }
    
    // Send updated game state to all players
    this.broadcastGameState(roomCode);
  }
  
  /**
   * Handle disconnect
   * @param {Object} socket - Socket.io socket
   */
  handleDisconnect(socket) {
    console.log(`Player disconnected: ${socket.id}`);
    
    const roomCode = this.playerRooms[socket.id];
    
    // Check if player was in a room
    if (!roomCode || !this.rooms[roomCode]) {
      return;
    }
    
    const player = this.rooms[roomCode].players[socket.id];
    const wasHost = player.isHost;
    
    // Remove player from room
    delete this.rooms[roomCode].players[socket.id];
    delete this.playerRooms[socket.id];
    
    // Check if room is empty
    if (Object.keys(this.rooms[roomCode].players).length === 0) {
      // Delete room
      delete this.rooms[roomCode];
      console.log(`Room ${roomCode} deleted (empty)`);
      return;
    }
    
    // If host left, assign new host
    if (wasHost) {
      const newHostId = Object.keys(this.rooms[roomCode].players)[0];
      this.rooms[roomCode].players[newHostId].isHost = true;
      
      // Notify room of host change
      this.io.to(roomCode).emit('hostChanged', {
        newHostId,
        newHostName: this.rooms[roomCode].players[newHostId].name
      });
    }
    
    // If game in progress, handle player dropout
    if (this.rooms[roomCode].gameInProgress && this.rooms[roomCode].gameManager) {
      // Handle player dropout (fold their hand)
      // TODO: Implement proper dropout handling in GameManager
      
      // For now, just broadcast updated game state
      this.broadcastGameState(roomCode);
    }
    
    // Update room info for remaining players
    this.io.to(roomCode).emit('roomUpdate', this.getRoomInfo(roomCode));
  }
  
  /**
   * Start game in room
   * @param {String} roomCode - Room code
   */
  startGame(roomCode) {
    console.log(`Starting game in room ${roomCode}`);
    
    const room = this.rooms[roomCode];
    
    // Create game manager
    room.gameManager = new GameManager();
    
    // Register event handlers
    this.registerGameEvents(roomCode);
    
    // Convert players object to array for game manager
    const players = Object.values(room.players).map(p => ({
      id: p.id,
      name: p.name,
      isHuman: true // All players in online mode are human
    }));
    
    // Initialize game
    room.gameManager.initGame(players, true);
    
    // Mark game as in progress
    room.gameInProgress = true;
    
    // Deal initial cards
    room.gameManager.dealInitialCards();
    
    // Post blinds
    room.gameManager.postBlinds();
    
    // Broadcast game started event with player positions
    this.io.to(roomCode).emit('gameStarted', {
      message: 'Game has started!',
      playerPositions: this.getPlayerPositions(roomCode),
      autoStart: true
    });
    
    // Send private cards to each player
    players.forEach(player => {
      const playerState = room.gameManager.getPlayerState(player.id);
      
      this.io.to(player.id).emit('dealCards', {
        hand: playerState.players.find(p => p.id === player.id).hand,
        holeCards: true
      });
    });
    
    // Broadcast game state
    this.broadcastGameState(roomCode);
    
    // Announce first player's turn
    const activePlayer = room.gameManager.state.players[room.gameManager.state.activePlayerIndex];
    
    this.io.to(roomCode).emit('playerTurn', {
      playerId: activePlayer.id,
      playerName: activePlayer.name,
      stage: room.gameManager.state.currentStage,
      currentBet: room.gameManager.state.currentBet,
      pot: room.gameManager.state.pot
    });
  }
  
  /**
   * End game in room
   * @param {String} roomCode - Room code
   */
  endGame(roomCode) {
    const room = this.rooms[roomCode];
    
    if (!room) return;
    
    // Reset game state
    room.gameInProgress = false;
    room.gameManager = null;
    
    // Reset player ready status
    Object.values(room.players).forEach(player => {
      player.ready = false;
    });
    
    // Update room info
    this.io.to(roomCode).emit('roomUpdate', this.getRoomInfo(roomCode));
    
    // Broadcast game ended event
    this.io.to(roomCode).emit('gameEnded', {
      message: 'Game has ended. Ready up to play again!'
    });
    
    console.log(`Game ended in room ${roomCode}`);
  }
  
  /**
   * Register game events
   * @param {String} roomCode - Room code
   */
  registerGameEvents(roomCode) {
    const gameManager = this.rooms[roomCode].gameManager;
    
    // No need to register most events as we'll handle them directly
    // Just register showdown for now
    gameManager.on('showdown', (data) => {
      this.io.to(roomCode).emit('showdown', data);
      
      // End game after a delay
      setTimeout(() => {
        this.endGame(roomCode);
      }, 8000);
    });
  }
  
  /**
   * Broadcast game state to all players in room
   * @param {String} roomCode - Room code
   */
  broadcastGameState(roomCode) {
    const room = this.rooms[roomCode];
    
    if (!room || !room.gameManager) return;
    
    // Get current player positions
    const playerPositions = this.getPlayerPositions(roomCode);
    
    // Send each player their personalized game state
    Object.keys(room.players).forEach(playerId => {
      const playerState = room.gameManager.getPlayerState(playerId);
      
      // Add player display names and positions
      playerState.playerNames = Object.values(room.players).map(p => ({
        id: p.id,
        name: p.name
      }));
      
      playerState.playerPositions = playerPositions;
      
      this.io.to(playerId).emit('gameStateUpdate', playerState);
    });
  }
  
  /**
   * Get room information
   * @param {String} roomCode - Room code
   * @returns {Object} Room information
   */
  getRoomInfo(roomCode) {
    const room = this.rooms[roomCode];
    
    if (!room) return null;
    
    return {
      roomCode,
      players: Object.values(room.players).map(p => ({
        id: p.id,
        name: p.name,
        ready: p.ready,
        isHost: p.isHost
      })),
      gameInProgress: room.gameInProgress,
      maxPlayers: 4
    };
  }
  
  /**
   * Get player positions for display
   * @param {String} roomCode - Room code
   * @returns {Array} Player position information
   */
  getPlayerPositions(roomCode) {
    const room = this.rooms[roomCode];
    
    if (!room || !room.gameManager) return [];
    
    const positions = ['BTN', 'SB', 'BB', 'UTG'];
    const dealerPos = room.gameManager.state.dealerPosition;
    
    return room.gameManager.state.players.map((player, index) => {
      const positionIndex = (index - dealerPos + 4) % 4;
      
      return {
        id: player.id,
        name: player.name,
        position: positions[positionIndex],
        tablePosition: index,
        isDealer: index === dealerPos,
        isSB: positionIndex === 1,
        isBB: positionIndex === 2
      };
    });
  }
  
  /**
   * Generate a room code
   * @returns {String} Room code
   */
  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Ensure code is unique
    if (this.rooms[code]) {
      return this.generateRoomCode();
    }
    
    return code;
  }
}

module.exports = GameServer;
