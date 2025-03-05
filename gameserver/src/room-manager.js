/**
 * Room Manager
 * Handles room creation, joining, and management
 */

class RoomManager {
    constructor() {
      this.rooms = {};
    }
  
    /**
     * Generate a random room code
     * @returns {string} 6-character uppercase room code
     */
    generateRoomCode() {
      return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
  
    /**
     * Create a new room
     * @param {string} hostId - Socket ID of the room host
     * @param {string} playerName - Name of the host player
     * @returns {Object} Room info object
     */
    createRoom(hostId, playerName) {
      const roomCode = this.generateRoomCode();
      
      // Create player object
      const hostPlayer = {
        id: hostId,
        name: playerName,
        ready: false,
        isHost: true,
        roomCode: roomCode
      };
      
      // Create room
      this.rooms[roomCode] = {
        players: { [hostId]: hostPlayer },
        gameInProgress: false,
        gameState: null,
        activePlayerIndex: 0
      };
      
      return {
        roomCode,
        success: true,
        player: hostPlayer
      };
    }
  
    /**
     * Add a player to an existing room
     * @param {string} playerId - Socket ID of the joining player
     * @param {string} roomCode - Room code to join
     * @param {string} playerName - Name of the joining player
     * @returns {Object} Result of join attempt
     */
    joinRoom(playerId, roomCode, playerName) {
      // Check if room exists
      if (!this.rooms[roomCode]) {
        return { success: false, error: 'Room not found' };
      }
      
      // Check if game is already in progress
      if (this.rooms[roomCode].gameInProgress) {
        return { success: false, error: 'Game is already in progress' };
      }
      
      // Check if room is full
      if (Object.keys(this.rooms[roomCode].players).length >= 4) {
        return { success: false, error: 'Room is full' };
      }
      
      // Create player object
      const player = {
        id: playerId,
        name: playerName,
        ready: false,
        isHost: false,
        roomCode: roomCode
      };
      
      // Add player to room
      this.rooms[roomCode].players[playerId] = player;
      
      return {
        success: true,
        roomCode,
        player
      };
    }
  
    /**
     * Remove a player from a room
     * @param {string} playerId - Socket ID of the player to remove
     * @returns {Object} Information about the removal
     */
    removePlayer(playerId) {
      let result = {
        removed: false,
        roomCode: null,
        roomDeleted: false,
        hostChanged: false,
        newHost: null
      };
      
      // Find the room containing this player
      for (const roomCode in this.rooms) {
        if (this.rooms[roomCode].players[playerId]) {
          const room = this.rooms[roomCode];
          const player = room.players[playerId];
          const wasHost = player.isHost;
          
          result.roomCode = roomCode;
          
          // Remove player from room
          delete room.players[playerId];
          result.removed = true;
          
          // If room is empty, delete it
          if (Object.keys(room.players).length === 0) {
            delete this.rooms[roomCode];
            result.roomDeleted = true;
          }
          // If the host left, assign a new host
          else if (wasHost) {
            const newHostId = Object.keys(room.players)[0];
            room.players[newHostId].isHost = true;
            result.hostChanged = true;
            result.newHost = newHostId;
          }
          
          return result;
        }
      }
      
      return result;
    }
  
    /**
     * Set player ready status
     * @param {string} playerId - Socket ID of the player
     * @param {boolean} ready - Ready status
     * @returns {Object} Result of the operation
     */
    setPlayerReady(playerId, ready) {
      // Find the room containing this player
      for (const roomCode in this.rooms) {
        const room = this.rooms[roomCode];
        if (room.players[playerId]) {
          room.players[playerId].ready = ready;
          
          // Check if all players are ready and there are at least 2 players
          const players = Object.values(room.players);
          const allReady = players.length >= 2 && players.every(p => p.ready);
          
          return {
            success: true,
            roomCode,
            allReady: allReady && !room.gameInProgress
          };
        }
      }
      
      return { success: false, error: 'Player not found in any room' };
    }
  
    /**
     * Get available rooms (not in progress and not full)
     * @returns {Array} List of available room info objects
     */
    getAvailableRooms() {
      return Object.entries(this.rooms)
        .filter(([_, room]) => !room.gameInProgress && Object.keys(room.players).length < 4)
        .map(([code, room]) => ({
          roomCode: code,
          playerCount: Object.keys(room.players).length,
          maxPlayers: 4
        }));
    }
  
    /**
     * Get room information
     * @param {string} roomCode - Room code
     * @returns {Object|null} Room information object or null if not found
     */
    getRoomInfo(roomCode) {
      const room = this.rooms[roomCode];
      if (!room) return null;
      
      return {
        roomCode: roomCode,
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
     * Get a room by code
     * @param {string} roomCode - Room code
     * @returns {Object|null} Room object or null if not found
     */
    getRoom(roomCode) {
      return this.rooms[roomCode] || null;
    }
  }
  
  module.exports = RoomManager;