/**
 * Socket Handlers
 * Manages Socket.io events and communication
 */

const GameManager = require("../game-manager");

// Simple timestamp utility for consistent logging
function timestamp() {
  return `[${new Date().toISOString()}]`;
}

// Store for game managers by room code
const gameManagers = {};

/**
 * Initialize socket handlers
 * @param {Object} io - Socket.io instance
 * @param {Object} roomManager - Room manager instance
 */
function initialize(io, roomManager) {
  console.log(`${timestamp()} Initializing socket handlers`);

  // Create game manager
  const gameManager = new GameManager(roomManager);

  // Socket.io connection handling
  io.on("connection", (socket) => {
    console.log(`${timestamp()} Socket connected: ${socket.id}`);

    // Player information
    let currentPlayer = {
      id: socket.id,
      name: `Player_${socket.id.substr(0, 4)}`,
      ready: false,
      roomCode: null,
    };

    // Create a new room
    socket.on("createRoom", (playerName, callback) => {
      console.log(
        `${timestamp()} CREATE_ROOM: ${socket.id}, name: ${playerName}`
      );

      currentPlayer.name = playerName || currentPlayer.name;

      // Create room
      const result = roomManager.createRoom(socket.id, currentPlayer.name);
      currentPlayer.roomCode = result.roomCode;

      // Join the socket to the room
      socket.join(result.roomCode);

      // Return the room code to the client
      callback(result);

      // Broadcast updated room info
      io.to(result.roomCode).emit(
        "roomUpdate",
        roomManager.getRoomInfo(result.roomCode)
      );

      console.log(
        `${timestamp()} Room ${result.roomCode} created by ${
          currentPlayer.name
        }`
      );
    });

    // Join an existing room
    socket.on("joinRoom", (data, callback) => {
      console.log(
        `${timestamp()} JOIN_ROOM: ${socket.id}, room: ${data.roomCode}`
      );

      const { roomCode, playerName } = data;

      // Update player name
      currentPlayer.name = playerName || currentPlayer.name;

      // Join room
      const result = roomManager.joinRoom(
        socket.id,
        roomCode,
        currentPlayer.name
      );

      if (result.success) {
        currentPlayer.roomCode = result.roomCode;

        // Join the socket to the room
        socket.join(result.roomCode);
        console.log(
          `${timestamp()} Player joined room: ${currentPlayer.name} -> ${
            result.roomCode
          }`
        );
      } else {
        console.log(`${timestamp()} Join room failed: ${result.error}`);
      }

      // Return result to the client
      callback(result);

      if (result.success) {
        // Broadcast updated room info
        io.to(result.roomCode).emit(
          "roomUpdate",
          roomManager.getRoomInfo(result.roomCode)
        );
      }
    });

    // Player is ready to start the game
    socket.on("playerReady", (ready) => {
      console.log(`${timestamp()} PLAYER_READY: ${socket.id}, ready: ${ready}`);

      if (!currentPlayer.roomCode) return;

      const result = roomManager.setPlayerReady(socket.id, ready);

      if (result.success) {
        // Broadcast updated room info
        io.to(result.roomCode).emit(
          "roomUpdate",
          roomManager.getRoomInfo(result.roomCode)
        );

        // Start game if all players are ready
        if (result.allReady) {
          console.log(
            `${timestamp()} All players ready in room ${
              result.roomCode
            }, starting game`
          );
          startGame(result.roomCode, io, gameManager);
        }
      }
    });

    // Handle game actions from players
    socket.on("gameAction", (action) => {
      console.log(
        `${timestamp()} GAME_ACTION: ${socket.id}, ${action.type} ${
          action.amount || ""
        }`
      );

      if (!currentPlayer.roomCode) return;

      const result = gameManager.processGameAction(
        currentPlayer.roomCode,
        socket.id,
        action
      );

      if (result.success) {
        // Broadcast action to all players
        io.to(currentPlayer.roomCode).emit("playerAction", result.action);

        // Move to next player or next stage
        const nextResult = gameManager.moveToNextPlayerOrStage(
          currentPlayer.roomCode
        );

        if (nextResult.success) {
          // If next stage started, broadcast appropriate events
          if (nextResult.stage) {
            console.log(
              `${timestamp()} Game advancing to stage: ${nextResult.stage}`
            );

            // Broadcast stage change
            if (nextResult.stage === "arena") {
              io.to(currentPlayer.roomCode).emit(
                "arenaCardDealt",
                nextResult.stageResult
              );
            } else if (nextResult.stage.startsWith("power")) {
              io.to(currentPlayer.roomCode).emit(
                "powerCardDealt",
                nextResult.stageResult
              );
            } else if (nextResult.stage === "showdown") {
              console.log(
                `${timestamp()} SHOWDOWN in room ${currentPlayer.roomCode}`
              );

              // Handle showdown result
              io.to(currentPlayer.roomCode).emit("showdown", {
                winners: nextResult.winners,
                hands: nextResult.hands,
                message: nextResult.message,
              });

              // Set up next hand after a delay
              setTimeout(() => {
                console.log(
                  `${timestamp()} Ending game in room ${currentPlayer.roomCode}`
                );
                const endResult = gameManager.gameStages.endGame(
                  currentPlayer.roomCode
                );
                if (endResult.success) {
                  io.to(currentPlayer.roomCode).emit(
                    "roomUpdate",
                    roomManager.getRoomInfo(currentPlayer.roomCode)
                  );
                  io.to(currentPlayer.roomCode).emit("gameEnded", {
                    message: endResult.message,
                  });
                }
              }, 8000); // 8 second delay before next hand can start

              return;
            }

            // Announce next player's turn
            io.to(currentPlayer.roomCode).emit("playerTurn", {
              playerId: nextResult.nextPlayer.id,
              playerName: nextResult.nextPlayer.name,
              stage: nextResult.stage,
              currentBet: nextResult.gameState.currentBet,
              pot: nextResult.gameState.pot,
            });
          } else {
            // Announce next player's turn (same stage)
            console.log(
              `${timestamp()} Next player's turn: ${nextResult.nextPlayer.name}`
            );
            io.to(currentPlayer.roomCode).emit("playerTurn", {
              playerId: nextResult.nextPlayer.id,
              playerName: nextResult.nextPlayer.name,
              stage: roomManager.getRoom(currentPlayer.roomCode).gameState
                .currentStage,
              currentBet: nextResult.gameState.currentBet,
              pot: nextResult.gameState.pot,
            });
          }

          // Broadcast game state update to all players
          broadcastGameState(currentPlayer.roomCode, io, gameManager);
        }
      }
    });

    // Get room list (only sends rooms that aren't in progress and not full)
    socket.on("getRooms", (callback) => {
      console.log(`${timestamp()} GET_ROOMS: ${socket.id}`);
      callback(roomManager.getAvailableRooms());
    });

    // Handle player leaving
    socket.on("disconnect", () => {
      console.log(`${timestamp()} Socket disconnected: ${socket.id}`);

      if (currentPlayer.roomCode) {
        console.log(
          `${timestamp()} Player leaving room: ${currentPlayer.name} from ${
            currentPlayer.roomCode
          }`
        );
        const result = roomManager.removePlayer(socket.id);

        if (result.removed && !result.roomDeleted) {
          // If the host left, inform other players
          if (result.hostChanged) {
            console.log(
              `${timestamp()} Host changed in room ${result.roomCode}`
            );
            io.to(result.roomCode).emit("hostChanged", {
              newHostId: result.newHost,
              newHostName: roomManager.getRoom(result.roomCode).players[
                result.newHost
              ].name,
            });
          }

          // If game was in progress, handle player dropout
          const room = roomManager.getRoom(result.roomCode);
          if (room && room.gameInProgress) {
            console.log(`${timestamp()} Handling dropout during active game`);
            const dropoutResult = gameManager.handlePlayerDropout(
              result.roomCode,
              socket.id
            );

            if (dropoutResult.success) {
              // If handling the dropout led to a showdown, handle that
              if (dropoutResult.winners) {
                console.log(`${timestamp()} Dropout led to showdown`);
                io.to(result.roomCode).emit("showdown", {
                  winners: dropoutResult.winners,
                  hands: dropoutResult.hands || [],
                  message: dropoutResult.message,
                });

                // Set up next hand after a delay
                setTimeout(() => {
                  console.log(`${timestamp()} Ending game after dropout`);
                  const endResult = gameManager.gameStages.endGame(
                    result.roomCode
                  );
                  if (endResult.success) {
                    io.to(result.roomCode).emit(
                      "roomUpdate",
                      roomManager.getRoomInfo(result.roomCode)
                    );
                    io.to(result.roomCode).emit("gameEnded", {
                      message: endResult.message,
                    });
                  }
                }, 5000);
              } else {
                // Just broadcast updated game state
                broadcastGameState(result.roomCode, io, gameManager);
              }
            }
          }

          // Broadcast updated room info
          io.to(result.roomCode).emit(
            "roomUpdate",
            roomManager.getRoomInfo(result.roomCode)
          );
        }
      }
    });
  });
}

/**
 * Start a game in a room
 * @param {string} roomCode - Room code
 * @param {Object} io - Socket.io instance
 * @param {Object} gameManager - Game manager instance
 */
function startGame(roomCode, io, gameManager) {
  console.log(`${timestamp()} Starting game in room ${roomCode}`);

  const result = gameManager.startGame(roomCode);

  if (result.success) {
    // Broadcast game start
    io.to(roomCode).emit("gameStarted", {
      message: result.message,
      playerPositions: result.playerPositions,
    });

    // Deal cards
    const dealtCards = gameManager.dealInitialCards(roomCode);

    if (dealtCards.success) {
      console.log(
        `${timestamp()} Cards dealt to ${dealtCards.players.length} players`
      );

      // Send cards to each player
      dealtCards.players.forEach((p) => {
        io.to(p.id).emit("dealCards", {
          hand: p.hand,
          holeCards: true,
        });
      });

      // Get blinds info
      const room = gameManager.roomManager.getRoom(roomCode);
      console.log(`${timestamp()} Blinds posted in room ${roomCode}`);

      // Broadcast blinds posted
      io.to(roomCode).emit("blindsPosted", {
        smallBlind: {
          player:
            room.gameState.players[
              (room.gameState.dealerPosition + 1) %
                room.gameState.players.length
            ].name,
          amount:
            room.gameState.players[
              (room.gameState.dealerPosition + 1) %
                room.gameState.players.length
            ].bet,
        },
        bigBlind: {
          player:
            room.gameState.players[
              (room.gameState.dealerPosition + 2) %
                room.gameState.players.length
            ].name,
          amount:
            room.gameState.players[
              (room.gameState.dealerPosition + 2) %
                room.gameState.players.length
            ].bet,
        },
      });

      // Broadcast game state
      broadcastGameState(roomCode, io, gameManager);

      // Announce first player's turn
      const activePlayer =
        room.gameState.players[room.gameState.activePlayerIndex];
      console.log(`${timestamp()} First player to act: ${activePlayer.name}`);

      io.to(roomCode).emit("playerTurn", {
        playerId: activePlayer.id,
        playerName: activePlayer.name,
        stage: room.gameState.currentStage,
        currentBet: room.gameState.currentBet,
        pot: room.gameState.pot,
      });
    }
  }
}

/**
 * Broadcast game state to all players in a room
 * @param {string} roomCode - Room code
 * @param {Object} io - Socket.io instance
 * @param {Object} gameManager - Game manager instance
 */
function broadcastGameState(roomCode, io, gameManager) {
  const room = gameManager.roomManager.getRoom(roomCode);
  if (!room || !room.gameState) return;

  // Send each player their personalized game state
  room.gameState.players.forEach((player) => {
    const playerState = gameManager.getPlayerGameState(roomCode, player.id);
    io.to(player.id).emit("gameStateUpdate", playerState);
  });
}

module.exports = {
  initialize,
};
