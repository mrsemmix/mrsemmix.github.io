/**
 * Game Manager
 * Handles game state, initialization, and core game flow
 */

const DeckManager = require("./src/game/deck-manager");
const GameActions = require("./src/game/game-actions");
const GameStages = require("./src/game/game-stages");

class GameManager {
  constructor(roomManager) {
    this.roomManager = roomManager;
    this.deckManager = new DeckManager();
    this.gameActions = new GameActions(this);
    this.gameStages = new GameStages(this);
  }

  /**
   * Start a game in a room
   * @param {string} roomCode - Room code
   * @returns {Object} Game start result
   */
  startGame(roomCode) {
    const room = this.roomManager.getRoom(roomCode);
    if (!room) return { success: false, error: "Room not found" };

    room.gameInProgress = true;

    // Initialize game state
    room.gameState = {
      deck: this.deckManager.createShuffledDeck(),
      players: this.initializePlayers(room),
      arenaCard: null,
      powerCards: [],
      currentStage: "preflop",
      dealerPosition: 0,
      activePlayerIndex: 0,
      currentBet: 0,
      pot: 0,
      minRaise: 10, // Big blind
      lastRaiseAmount: 0,
      lastRaiser: null,
      bettingRoundComplete: false,
      playersActedThisRound: [],
    };

    // Set the first active player
    room.activePlayerIndex = 0;

    return {
      success: true,
      message: "Game has started!",
      playerPositions: this.getPlayerPositions(room),
    };
  }

  /**
   * Initialize players for the game
   * @param {Object} room - Room object
   * @returns {Array} Array of initialized player objects
   */
  initializePlayers(room) {
    return Object.entries(room.players).map(([id, player], index) => ({
      id: id,
      name: player.name,
      hand: [],
      isHuman: true,
      active: true,
      bet: 0,
      totalBet: 0,
      stack: 1000, // Starting stack
      folded: false,
      allIn: false,
    }));
  }

  /**
   * Get player positions based on dealer position
   * @param {Object} room - Room object
   * @returns {Array} Array of player position objects
   */
  getPlayerPositions(room) {
    // Assign poker positions based on dealer
    const positions = ["BTN", "SB", "BB", "UTG"];
    return room.gameState.players.map((player, index) => {
      const posIndex = (index - room.gameState.dealerPosition + 4) % 4;
      return {
        id: player.id,
        name: player.name,
        position: positions[posIndex],
      };
    });
  }

  /**
   * Deal initial cards to all players
   * @param {string} roomCode - Room code
   * @returns {Object} Information about dealt cards
   */
  dealInitialCards(roomCode) {
    const room = this.roomManager.getRoom(roomCode);
    if (!room || !room.gameState)
      return { success: false, error: "Game not found" };

    // Deal 2 cards to each player
    for (let player of room.gameState.players) {
      player.hand = [room.gameState.deck.pop(), room.gameState.deck.pop()];
    }

    // Post blinds
    this.postBlinds(roomCode);

    return {
      success: true,
      players: room.gameState.players.map((p) => ({
        id: p.id,
        hand: p.hand,
      })),
    };
  }

  /**
   * Post blinds at the start of the hand
   * @param {string} roomCode - Room code
   * @returns {Object} Information about posted blinds
   */
  postBlinds(roomCode) {
    const room = this.roomManager.getRoom(roomCode);
    if (!room || !room.gameState)
      return { success: false, error: "Game not found" };

    const players = room.gameState.players;
    const sbIndex = (room.gameState.dealerPosition + 1) % players.length;
    const bbIndex = (room.gameState.dealerPosition + 2) % players.length;

    // Small blind
    const sbAmount = Math.min(5, players[sbIndex].stack);
    players[sbIndex].bet = sbAmount;
    players[sbIndex].totalBet = sbAmount;
    players[sbIndex].stack -= sbAmount;
    room.gameState.pot += sbAmount;

    // Big blind
    const bbAmount = Math.min(10, players[bbIndex].stack);
    players[bbIndex].bet = bbAmount;
    players[bbIndex].totalBet = bbAmount;
    players[bbIndex].stack -= bbAmount;
    room.gameState.pot += bbAmount;

    // Set current bet to big blind
    room.gameState.currentBet = bbAmount;

    // Set action to player after big blind
    room.gameState.activePlayerIndex = (bbIndex + 1) % players.length;
    room.activePlayerIndex = room.gameState.activePlayerIndex;

    return {
      success: true,
      smallBlind: {
        player: players[sbIndex].name,
        amount: sbAmount,
      },
      bigBlind: {
        player: players[bbIndex].name,
        amount: bbAmount,
      },
    };
  }

  /**
   * Process a player's game action
   * @param {string} roomCode - Room code
   * @param {string} playerId - Player's socket ID
   * @param {Object} action - Action object
   * @returns {Object} Result of the action
   */
  processGameAction(roomCode, playerId, action) {
    const room = this.roomManager.getRoom(roomCode);
    if (!room || !room.gameState)
      return { success: false, error: "Game not found" };

    const gameState = room.gameState;
    const playerIndex = gameState.players.findIndex((p) => p.id === playerId);
    const player = gameState.players[playerIndex];

    if (playerIndex === -1)
      return { success: false, error: "Player not found in game" };

    // Check if it's the player's turn
    if (gameState.activePlayerIndex !== playerIndex) {
      return { success: false, error: "Not your turn" };
    }

    let actionProcessed = false;
    let actionResult = null;

    // Process the action based on type
    switch (action.type) {
      case "check":
        actionResult = this.gameActions.handleCheckAction(room, player);
        actionProcessed = actionResult.success;
        break;
      case "fold":
        actionResult = this.gameActions.handleFoldAction(room, player);
        actionProcessed = actionResult.success;
        break;
      case "call":
        actionResult = this.gameActions.handleCallAction(room, player);
        actionProcessed = actionResult.success;
        break;
      case "bet":
        actionResult = this.gameActions.handleBetAction(
          room,
          player,
          action.amount
        );
        actionProcessed = actionResult.success;
        break;
      case "raise":
        actionResult = this.gameActions.handleRaiseAction(
          room,
          player,
          action.amount
        );
        actionProcessed = actionResult.success;
        break;
      case "allIn":
        actionResult = this.gameActions.handleAllInAction(room, player);
        actionProcessed = actionResult.success;
        break;
      default:
        return { success: false, error: "Invalid action type" };
    }

    if (!actionProcessed) {
      return { success: false, error: actionResult.error || "Action failed" };
    }

    // Add player to list of players who acted this round
    if (!gameState.playersActedThisRound.includes(player.id)) {
      gameState.playersActedThisRound.push(player.id);
    }

    return {
      success: true,
      action: {
        type: action.type,
        playerId: player.id,
        playerName: player.name,
        amount: actionResult.amount || 0,
      },
    };
  }

  /**
   * Move to next player or next game stage
   * @param {string} roomCode - Room code
   * @returns {Object} Result of the move
   */
  moveToNextPlayerOrStage(roomCode) {
    const room = this.roomManager.getRoom(roomCode);
    if (!room || !room.gameState)
      return { success: false, error: "Game not found" };

    // Check if betting round is complete
    if (this.gameActions.isBettingRoundComplete(room)) {
      return this.gameStages.advanceGameStage(roomCode);
    }

    // Move to next player
    let nextPlayerIndex =
      (room.gameState.activePlayerIndex + 1) % room.gameState.players.length;

    // Skip folded and all-in players
    let loopCount = 0;
    while (
      room.gameState.players[nextPlayerIndex].folded ||
      room.gameState.players[nextPlayerIndex].allIn
    ) {
      nextPlayerIndex = (nextPlayerIndex + 1) % room.gameState.players.length;
      loopCount++;

      // If we've gone through all players, betting must be complete
      if (loopCount >= room.gameState.players.length) {
        return this.gameStages.advanceGameStage(roomCode);
      }
    }

    // Update active player
    room.gameState.activePlayerIndex = nextPlayerIndex;
    room.activePlayerIndex = nextPlayerIndex;

    return {
      success: true,
      nextPlayer: {
        index: nextPlayerIndex,
        id: room.gameState.players[nextPlayerIndex].id,
        name: room.gameState.players[nextPlayerIndex].name,
      },
      gameState: this.getGameStateForBroadcast(roomCode),
    };
  }

  /**
   * Create a sanitized game state to broadcast to clients
   * @param {string} roomCode - Room code
   * @returns {Object} Game state for broadcast
   */
  getGameStateForBroadcast(roomCode) {
    const room = this.roomManager.getRoom(roomCode);
    if (!room || !room.gameState) return null;

    return {
      players: room.gameState.players.map((p) => ({
        id: p.id,
        name: p.name,
        stack: p.stack,
        bet: p.bet,
        folded: p.folded,
        allIn: p.allIn,
        active: p.active,
        hasCards: p.hand.length > 0,
      })),
      arenaCard: room.gameState.arenaCard,
      powerCards: room.gameState.powerCards,
      currentStage: room.gameState.currentStage,
      dealerPosition: room.gameState.dealerPosition,
      activePlayerIndex: room.gameState.activePlayerIndex,
      pot: room.gameState.pot,
      currentBet: room.gameState.currentBet,
    };
  }

  /**
   * Get player view of game state (includes their cards)
   * @param {string} roomCode - Room code
   * @param {string} playerId - Player's socket ID
   * @returns {Object} Personalized game state
   */
  getPlayerGameState(roomCode, playerId) {
    const room = this.roomManager.getRoom(roomCode);
    if (!room || !room.gameState) return null;

    const baseState = this.getGameStateForBroadcast(roomCode);

    // Add player's cards
    baseState.players = baseState.players.map((p) => {
      const player = room.gameState.players.find((gp) => gp.id === p.id);
      return {
        ...p,
        // Only include cards for this player or if in showdown
        hand:
          p.id === playerId || room.gameState.currentStage === "showdown"
            ? player
              ? player.hand
              : []
            : [],
      };
    });

    return baseState;
  }

  /**
   * Handle a player dropping out during a game
   * @param {string} roomCode - Room code
   * @param {string} playerId - ID of player who dropped out
   * @returns {Object} Result of dropout handling
   */
  handlePlayerDropout(roomCode, playerId) {
    const room = this.roomManager.getRoom(roomCode);
    if (!room || !room.gameState)
      return { success: false, error: "Game not found" };

    // Find the player in the game state
    const playerIndex = room.gameState.players.findIndex(
      (p) => p.id === playerId
    );

    if (playerIndex === -1)
      return { success: false, error: "Player not found in game" };

    // Mark player as folded
    room.gameState.players[playerIndex].folded = true;
    room.gameState.players[playerIndex].active = false;

    // If it was this player's turn, move to next player
    if (room.gameState.activePlayerIndex === playerIndex) {
      return this.moveToNextPlayerOrStage(roomCode);
    }

    // Check if only one player remains
    const activePlayers = room.gameState.players.filter((p) => !p.folded);
    if (activePlayers.length === 1) {
      // End the hand and award pot to remaining player
      return this.gameStages.endHand(activePlayers[0], room);
    }

    return {
      success: true,
      gameState: this.getGameStateForBroadcast(roomCode),
    };
  }
}

module.exports = GameManager;
