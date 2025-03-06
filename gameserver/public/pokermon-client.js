/*
 * pokermon-client.js
 * WebSocket client for multiplayer PokerMon
 */

(function () {
  // Socket.io connection
  let socket;

  // Current room information
  let currentRoom = null;
  let playerName = "";

  // Reference to original game objects
  const originalInitGame = window.GAME?.engine?.initGame;
  const originalProcessHumanAction = window.GAME?.engine?.processHumanAction;
  let isMultiplayerGame = true;

  // DOM elements for multiplayer UI
  let multiplayerUI;

  // Initialize multiplayer functionality
  function initMultiplayer() {
    console.log("Initializing multiplayer functionality");

    // Create multiplayer UI overlay
    createMultiplayerUI();

    // Initialize socket connection
    initSocketConnection();

    // Override game functions
    overrideGameFunctions();

    disableLocalGameLogic()
  }

  function disableLocalGameLogic() {
    // Save original functions for reference
    const originalFunctions = {
      initGame: window.GAME?.engine?.initGame,
      processHumanAction: window.GAME?.engine?.processHumanAction,
      moveToNextPlayer: window.GAME?.engine?.moveToNextPlayer,
      advanceGame: window.GAME?.engine?.advanceGame,
      beginBettingRound: window.GAME?.engine?.beginBettingRound,
      showdown: window.GAME?.engine?.showdown
    };

    // Replace game logic functions with stubs that do nothing
    if (window.GAME && window.GAME.engine) {
      // Only override game flow functions, not rendering functions
      window.GAME.engine.moveToNextPlayer = function () {
        console.log("Local moveToNextPlayer prevented - waiting for server");
        return false;
      };

      window.GAME.engine.advanceGame = function () {
        console.log("Local advanceGame prevented - waiting for server");
        return false;
      };

      window.GAME.engine.beginBettingRound = function () {
        console.log("Local beginBettingRound prevented - waiting for server");
        return false;
      };

      window.GAME.engine.showdown = function () {
        console.log("Local showdown prevented - waiting for server");
        // Still allow local showdown rendering as server will trigger this
        if (originalFunctions.showdown) {
          // But don't modify state
        }
        return false;
      };
    }
  }

  // Create UI for multiplayer
  function createMultiplayerUI() {
    // Create container for multiplayer UI
    multiplayerUI = document.createElement("div");
    multiplayerUI.className = "multiplayer-ui";
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
          <div class="join-room-container">
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

    // Add styles
    const style = document.createElement("style");
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

    document.head.appendChild(style);
    document.body.appendChild(multiplayerUI);

    // Event listeners for multiplayer UI
    document
      .getElementById("create-room-btn")
      .addEventListener("click", createRoom);
    document.getElementById("join-room-btn").addEventListener("click", () => {
      // Show/hide relevant sections
      toggleJoinRoomSection(true);
    });
    document
      .getElementById("refresh-rooms-btn")
      .addEventListener("click", refreshRoomList);
    document
      .getElementById("join-with-code-btn")
      .addEventListener("click", joinRoomWithCode);
    document.getElementById("ready-btn").addEventListener("click", toggleReady);
    document
      .getElementById("leave-room-btn")
      .addEventListener("click", leaveRoom);
    document
      .getElementById("leave-game-btn")
      .addEventListener("click", leaveRoom);
  }

  // Initialize Socket.io connection
  function initSocketConnection() {
    // Connect to the server (adjust URL as needed for production)
    socket = io();

    // Connection events
    socket.on("connect", () => {
      console.log("Connected to server");
      refreshRoomList();
    });

    // Add reconnection and state recovery
    socket.on('disconnect', () => {
      console.log("Socket disconnected, attempting to reconnect...");
      showMessage("Connection lost. Reconnecting...");
    });

    socket.on('reconnect', () => {
      console.log("Reconnected to server!");
      showMessage("Reconnected! Refreshing game state...");

      // Request current room and game state
      if (currentRoom) {
        socket.emit('joinRoom', { roomCode: currentRoom, playerName }, (response) => {
          if (response.success) {
            console.log("Rejoined room after reconnection");
            socket.emit('getGameState', (state) => {
              if (state) {
                handleGameStateUpdate(state);
              }
            });
          }
        });
      }
    });

    // Room events
    socket.on("roomUpdate", handleRoomUpdate);

    // Game events
    socket.on("gameStarted", handleGameStarted);
    socket.on("gameEnded", handleGameEnded);
    socket.on("dealCards", handleDealCards);
    socket.on("blindsPosted", handleBlindsPosted);
    socket.on("arenaCardDealt", handleArenaCardDealt);
    socket.on("powerCardDealt", handlePowerCardDealt);
    socket.on("playerTurn", handlePlayerTurn);
    socket.on("playerAction", handlePlayerAction);
    socket.on("gameStateUpdate", handleGameStateUpdate);
    socket.on("showdown", handleShowdown);
  }

  // Override original game functions to work with multiplayer
  function overrideGameFunctions() {
    // Override processHumanAction to send actions to the server
    if (window.GAME && window.GAME.engine) {
      window.GAME.engine.processHumanAction = function (action, betAmount = 0) {
        console.log(`Sending action to server: ${action}, amount: ${betAmount}`);

        // Map client action to server action format
        let serverAction = {
          type: action.toLowerCase(),
          amount: betAmount,
        };

        // Special case for raise/bet to match server expectations
        if (action === "Bet") {
          serverAction.type = "bet";
        } else if (action === "Raise") {
          serverAction.type = "raise";
        } else if (action === "All-In") {
          serverAction.type = "allIn";
        }

        // Send action to server
        socket.emit("gameAction", serverAction);

        // Hide betting controls immediately
        document.getElementById("betting-controls").classList.remove("visible");

        // Adding visual feedback
        const human = window.GAME.state.players.find(p => p.isHuman);
        GAME.utils.showPlayerAction(human.id, action, betAmount);

        return true; // Always return true as server will validate
      };
    }
  }

  // Create a new room
  function createRoom() {
    playerName =
      document.getElementById("player-name").value.trim() ||
      `Player_${socket.id.substr(0, 4)}`;

    socket.emit("createRoom", playerName, (response) => {
      if (response.success) {
        currentRoom = response.roomCode;
        updateRoomDisplay();
        toggleRoomInfoSection(true);
      } else {
        showMessage(response.error || "Failed to create room");
      }
    });
  }

  // Join a room with a code
  function joinRoomWithCode() {
    const roomCode = document
      .getElementById("room-code-input")
      .value.trim()
      .toUpperCase();
    playerName =
      document.getElementById("player-name").value.trim() ||
      `Player_${socket.id.substr(0, 4)}`;

    if (!roomCode) {
      showMessage("Please enter a room code");
      return;
    }

    socket.emit("joinRoom", { roomCode, playerName }, (response) => {
      if (response.success) {
        currentRoom = response.roomCode;
        updateRoomDisplay();
        toggleRoomInfoSection(true);
        toggleJoinRoomSection(false);
      } else {
        showMessage(response.error || "Failed to join room");
      }
    });
  }

  // Refresh the list of available rooms
  function refreshRoomList() {
    socket.emit("getRooms", (rooms) => {
      const roomList = document.getElementById("room-list");

      if (rooms.length === 0) {
        roomList.innerHTML =
          '<p class="empty-rooms">No rooms available. Create one to start playing!</p>';
        return;
      }

      roomList.innerHTML = "";

      rooms.forEach((room) => {
        const roomElement = document.createElement("div");
        roomElement.className = "room-item";
        roomElement.innerHTML = `
            <span>Room ${room.roomCode}: ${room.playerCount}/${room.maxPlayers} players</span>
            <button class="button join-room-btn">Join</button>
          `;

        roomElement
          .querySelector(".join-room-btn")
          .addEventListener("click", () => {
            playerName =
              document.getElementById("player-name").value.trim() ||
              `Player_${socket.id.substr(0, 4)}`;

            socket.emit(
              "joinRoom",
              { roomCode: room.roomCode, playerName },
              (response) => {
                if (response.success) {
                  currentRoom = response.roomCode;
                  updateRoomDisplay();
                  toggleRoomInfoSection(true);
                } else {
                  showMessage(response.error || "Failed to join room");
                }
              }
            );
          });

        roomList.appendChild(roomElement);
      });
    });
  }

  // Toggle ready status
  function toggleReady() {
    const readyBtn = document.getElementById("ready-btn");
    const isReady = readyBtn.classList.contains("ready");

    // Toggle ready status
    socket.emit("playerReady", !isReady);

    // Update button text
    readyBtn.textContent = isReady ? "Ready" : "Not Ready";
    readyBtn.classList.toggle("ready", !isReady);
    readyBtn.classList.toggle("not-ready", isReady);
  }

  // Leave the current room
  function leaveRoom() {
    socket.disconnect();

    // Reload the page to reset everything
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  // Handle room update event
  function handleRoomUpdate(roomInfo) {
    // Update room code display
    document.getElementById("room-code-display").textContent =
      roomInfo.roomCode;

    // Update player list
    const playerList = document.getElementById("player-list");
    playerList.innerHTML = "";

    roomInfo.players.forEach((player) => {
      const isCurrentPlayer = player.id === socket.id;
      const playerElement = document.createElement("li");

      playerElement.innerHTML = `
          <span>${player.name}${isCurrentPlayer ? " (You)" : ""}${player.isHost ? " (Host)" : ""
        }</span>
          <span class="${player.ready ? "player-ready" : "player-not-ready"}">${player.ready ? "Ready" : "Not Ready"
        }</span>
        `;

      playerList.appendChild(playerElement);
    });

    // Update ready button status for current player
    const currentPlayer = roomInfo.players.find((p) => p.id === socket.id);
    if (currentPlayer) {
      const readyBtn = document.getElementById("ready-btn");
      readyBtn.textContent = currentPlayer.ready ? "Not Ready" : "Ready";
      readyBtn.classList.toggle("ready", currentPlayer.ready);
      readyBtn.classList.toggle("not-ready", !currentPlayer.ready);
    }
  }

  // Handle game started event
  function handleGameStarted(data) {
    console.log('Game started:', data);

    // Hide the multiplayer overlay
    toggleMultiplayerOverlay(false);

    // Show the multiplayer HUD
    document.querySelector('.multiplayer-hud').style.display = 'flex';
    document.getElementById('hud-room-code').textContent = currentRoom;

    // If this is an automatic start, hide the start button
    if (data.autoStart) {
      const startButton = document.getElementById("start-button");
      if (startButton) {
        startButton.style.display = "none";
      }

      // Call any initialization needed without waiting for button click
      if (window.GAME && window.GAME.engine) {
        if (typeof window.GAME.engine.initGame === 'function') {
          // Delay slightly to ensure UI is ready
          setTimeout(() => {
            window.GAME.engine.initGame();
          }, 200);
        }
      }
    }

    // Display positions - using our updated function
    if (data.playerPositions) {
      updatePlayerPositions(data.playerPositions);
    }
  }

  // Handle game ended event
  function handleGameEnded(data) {
    console.log("Game ended:", data);

    // Show the multiplayer overlay again
    setTimeout(() => {
      toggleMultiplayerOverlay(true);
      showMessage(data.message);
    }, 3000);
  }

  // Handle deal cards event
  function handleDealCards(data) {
    // In the real implementation, update the UI to show cards for this player
    console.log("Received cards:", data.hand);

    // For now, we'll rely on the game state updates to handle this
  }

  // Handle blinds posted event
  function handleBlindsPosted(data) {
    console.log("Blinds posted:", data);

    // Add to game log
    if (window.GAME && window.GAME.utils) {
      window.GAME.utils.addLog(
        `${data.smallBlind.player} posts small blind: $${data.smallBlind.amount}`,
        "bet"
      );
      window.GAME.utils.addLog(
        `${data.bigBlind.player} posts big blind: $${data.bigBlind.amount}`,
        "bet"
      );
    }
  }

  // Handle arena card dealt event
  function handleArenaCardDealt(card) {
    console.log("Arena card dealt:", card);

    // Add to game log
    if (window.GAME && window.GAME.utils) {
      window.GAME.utils.addLog(
        `Arena revealed: ${card.name} (${card.element})`,
        "action"
      );
    }
  }

  // Handle power card dealt event
  function handlePowerCardDealt(data) {
    console.log("Power card dealt:", data);

    // Add to game log
    if (window.GAME && window.GAME.utils) {
      window.GAME.utils.addLog(
        `Power Card dealt: ${data.card.name} (${data.card.element} +${data.card.power})`,
        "action"
      );
    }
  }

  function forceUIUpdate() {
    // Update stacks and bets
    GAME.utils.updateStacks();

    // Update pot
    GAME.utils.updatePotDisplay();

    // Render cards
    if (window.GAME.engine.renderHands) {
      window.GAME.engine.renderHands();
    }

    // Update power cards
    if (window.GAME.engine.renderPowerCards) {
      window.GAME.engine.renderPowerCards();
    }

    // Update game stage
    if (window.GAME.utils.updateGameStage) {
      window.GAME.utils.updateGameStage(window.GAME.state.currentStage);
    }
  }

  // Handle player turn event
  function handlePlayerTurn(data) {
    console.log("Player turn:", data);

    try {
      // Update active player
      const playerIndex = GAME.state.players.findIndex(p => p.id === data.playerId);
      if (playerIndex >= 0) {
        GAME.state.activePlayerIndex = playerIndex;

        // Highlight active player
        GAME.state.players.forEach((player, index) => {
          const playerEl = document.getElementById(`player-${player.id}`);
          if (playerEl) {
            if (index === GAME.state.activePlayerIndex) {
              playerEl.classList.add("active");
            } else {
              playerEl.classList.remove("active");
            }
          }
        });
      }

      // Update game state
      GAME.state.currentStage = data.stage;
      GAME.state.currentBet = data.currentBet;
      GAME.state.pot = data.pot;

      // Safe UI update
      safeUIUpdate();

      // Show betting controls if it's human's turn
      if (data.playerId === socket.id) {
        const bettingControls = document.getElementById("betting-controls");
        if (bettingControls) {
          bettingControls.classList.add("visible");
        }

        // Safely update action buttons
        safeUpdateActionButtons();
      }
    } catch (error) {
      console.error("Error handling player turn:", error);
    }
  }

  // Handle player action event
  function handlePlayerAction(data) {
    console.log("Player action:", data);

    // Add to game log
    if (window.GAME && window.GAME.utils) {
      let actionText = "";

      switch (data.action) {
        case "check":
          actionText = `${data.playerName} checks.`;
          break;
        case "fold":
          actionText = `${data.playerName} folds.`;
          break;
        case "call":
          actionText = `${data.playerName} calls $${data.amount}.`;
          break;
        case "bet":
          actionText = `${data.playerName} bets $${data.amount}.`;
          break;
        case "raise":
          actionText = `${data.playerName} raises to $${data.amount}.`;
          break;
        case "allIn":
          actionText = `${data.playerName} goes all-in with $${data.amount}!`;
          break;
      }

      window.GAME.utils.addLog(
        actionText,
        data.action === "fold" ? "fold" : "action"
      );

      // Show player action in UI
      const playerIdTruncated = data.playerId.substring(0, 8);
      Object.values(window.GAME.state.players).forEach((player, index) => {
        if (player.id && player.id.includes(playerIdTruncated)) {
          window.GAME.utils.showPlayerAction(
            `ai${index}`, // Use AI slots for other players
            data.action.charAt(0).toUpperCase() + data.action.slice(1),
            data.amount
          );
        }
      });
    }
  }

  function updatePlayerNames(playerNames) {
    console.log('Updating player names:', playerNames);

    // Map each remote player to a local player slot
    // Usually the first connected player is "You" and others are AI1, AI2, AI3
    const humanPlayer = playerNames.find(p => p.id === socket.id);
    const otherPlayers = playerNames.filter(p => p.id !== socket.id);

    // Update human player name (optional)
    if (humanPlayer) {
      // You might want to keep "You" for the human player
      // document.querySelector('#player-human h2').innerHTML = `${humanPlayer.name} <span class="player-position">BTN</span>`;
    }

    // Update AI player names
    otherPlayers.forEach((player, index) => {
      const aiIndex = index + 1; // AI1, AI2, AI3
      if (aiIndex <= 3) { // We only have 3 AI slots
        const nameElement = document.querySelector(`#player-ai${aiIndex} h2`);
        if (nameElement) {
          // Preserve the position span
          const positionSpan = nameElement.querySelector('.player-position');
          const position = positionSpan ? positionSpan.textContent : '';
          nameElement.innerHTML = `${player.name} <span class="player-position">${position}</span>`;
        }
      }
    });
  }

  // Handle game state update event
  // Server-state update handler - replace the existing handleGameStateUpdate function
  function handleGameStateUpdate(state) {
    console.log('Game state update received:', state);
  
    try {
      if (!window.GAME || !window.GAME.state) return;
      
      // Map player states
      state.players.forEach((remotePlayer) => {
        // Find matching player in local state
        const localPlayer = GAME.state.players.find(p => 
          p.id === remotePlayer.id || 
          (remotePlayer.id === socket.id && p.isHuman === true)
        );
        
        if (localPlayer) {
          // Update player data
          localPlayer.id = remotePlayer.id;
          localPlayer.name = remotePlayer.name || localPlayer.name;
          localPlayer.stack = remotePlayer.stack;
          localPlayer.bet = remotePlayer.bet;
          localPlayer.folded = remotePlayer.folded;
          localPlayer.allIn = remotePlayer.allIn;
          localPlayer.active = remotePlayer.active;
          
          // Update hand if provided
          if (remotePlayer.hand && remotePlayer.hand.length > 0) {
            localPlayer.hand = remotePlayer.hand;
          }
        }
      });
      
      // Update game state
      GAME.state.arenaCard = state.arenaCard;
      GAME.state.powerCards = state.powerCards || [];
      GAME.state.currentStage = state.currentStage;
      GAME.state.dealerPosition = state.dealerPosition;
      GAME.state.activePlayerIndex = state.activePlayerIndex;
      GAME.state.pot = state.pot;
      GAME.state.currentBet = state.currentBet;
      
      // Safe UI update
      safeUIUpdate();
      
      // Update positions if provided
      if (state.playerPositions && state.playerPositions.length > 0) {
        try {
          updatePlayerPositions(state.playerPositions);
        } catch (posError) {
          console.error("Error updating positions:", posError);
        }
      }
    } catch (error) {
      console.error("Error handling game state update:", error);
    }
  }

  // Handle showdown event
  function handleShowdown(data) {
    console.log("Showdown:", data);

    // Display the winners and hands
    if (window.GAME && window.GAME.utils) {
      data.winners.forEach((winner) => {
        window.GAME.utils.addLog(
          `${winner.name} wins ${winner.potWon} with hand value ${winner.handValue}!`,
          "win"
        );
      });

      // Show all hands if provided
      if (data.hands && data.hands.length > 0) {
        data.hands.forEach((handInfo) => {
          if (!handInfo.folded) {
            // Find this player in local state
            const playerIdTruncated = handInfo.id.substring(0, 8);
            Object.values(window.GAME.state.players).forEach(
              (player, index) => {
                if (player.id && player.id.includes(playerIdTruncated)) {
                  // Update hand for display
                  player.hand = handInfo.hand;
                }
              }
            );
          }
        });
      }

      // Update UI to show winner and hands
      showWinnerOverlay(data.winners[0]);

      // Render all hands visible for showdown
      if (window.GAME.engine && window.GAME.engine.renderHands) {
        window.GAME.state.currentStage = "showdown";
        window.GAME.engine.renderHands();
      } else {
        updateUI();
      }
    }
  }

  // Helper function to update UI with current game state
  function updateUI() {
    // Update pot
    if (window.GAME.utils && window.GAME.utils.updatePotDisplay) {
      window.GAME.utils.updatePotDisplay();
    }

    // Update player stacks and bets
    if (window.GAME.utils && window.GAME.utils.updateStacks) {
      window.GAME.utils.updateStacks();
    }

    // Update cards display
    if (window.GAME.engine && window.GAME.engine.renderHands) {
      window.GAME.engine.renderHands();
    }

    // Update power cards display
    if (window.GAME.engine && window.GAME.engine.renderPowerCards) {
      window.GAME.engine.renderPowerCards();
    }

    // Update game stage
    if (window.GAME.utils && window.GAME.utils.updateGameStage) {
      window.GAME.utils.updateGameStage(window.GAME.state.currentStage);
    }

    // Update arena display
    updateArenaDisplay();
  }

  // Helper function to update arena display
  function updateArenaDisplay() {
    if (!window.GAME.state.arenaCard) return;

    const arenaLabel = document.getElementById("arena-label");
    if (arenaLabel) {
      arenaLabel.innerText = `${window.GAME.state.arenaCard.name} (${window.GAME.state.arenaCard.element})`;
      arenaLabel.style.color = window.GAME.utils.getElementColor(
        window.GAME.state.arenaCard.element
      );
      arenaLabel.classList.add("active");
    }

    const container = document.getElementById("power-cards-container");
    if (container) {
      container.className = `${window.GAME.state.arenaCard.element.toLowerCase()}-arena`;
      container.style.borderColor = window.GAME.utils.getElementColor(
        window.GAME.state.arenaCard.element
      );
      container.style.background =
        window.GAME.ELEMENT_GRADIENTS[window.GAME.state.arenaCard.element];
    }
  }

  // Helper function to highlight active player
  function highlightActivePlayer(activeIndex) {
    window.GAME.state.players.forEach((player, index) => {
      const playerEl = document.getElementById(
        `player-${index === 0 ? "human" : "ai" + index}`
      );
      if (playerEl) {
        if (index === activeIndex) {
          playerEl.classList.add("active");
        } else {
          playerEl.classList.remove("active");
        }
      }
    });
  }

  // Helper function to show winner overlay
  function showWinnerOverlay(winner) {
    const winnerOverlay = document.getElementById("winner-overlay");
    const winnerTitle = document.getElementById("winner-title");
    const winnerInfo = document.getElementById("winner-info");
    const winnerPot = document.getElementById("winner-pot");

    if (winnerOverlay && winnerTitle && winnerInfo && winnerPot) {
      winnerTitle.textContent = `${winner.name} Wins!`;
      winnerInfo.textContent = `with Monster Total: ${winner.handValue}`;
      winnerPot.textContent = `Pot: $${winner.potWon}`;

      winnerOverlay.classList.add("visible");
    }
  }

  function positionBlindButtons() {
    // Find the dealer, SB, and BB positions
    const dealerEl = document.querySelector('.player-position.dealer');
    const sbEl = document.querySelector('.player-position.small-blind');
    const bbEl = document.querySelector('.player-position.big-blind');

    // Get the button elements
    const dealerBtn = document.getElementById('dealer-button');
    const sbBtn = document.getElementById('small-blind-button');
    const bbBtn = document.getElementById('big-blind-button');

    if (!dealerBtn || !sbBtn || !bbBtn) return;

    // Hide all buttons first
    dealerBtn.style.display = 'none';
    sbBtn.style.display = 'none';
    bbBtn.style.display = 'none';

    // Position dealer button
    if (dealerEl) {
      const playerEl = dealerEl.closest('.player');
      if (playerEl) {
        const playerId = playerEl.id;
        dealerBtn.style.display = 'flex';

        // Position based on player location
        positionButton(dealerBtn, playerId, 'left');
      }
    }

    // Position SB button
    if (sbEl) {
      const playerEl = sbEl.closest('.player');
      if (playerEl) {
        const playerId = playerEl.id;
        sbBtn.style.display = 'flex';

        // Position based on player location
        positionButton(sbBtn, playerId, 'right');
      }
    }

    // Position BB button
    if (bbEl) {
      const playerEl = bbEl.closest('.player');
      if (playerEl) {
        const playerId = playerEl.id;
        bbBtn.style.display = 'flex';

        // Position based on player location
        positionButton(bbBtn, playerId, 'top');
      }
    }
  }

  // Helper function to update player positions
  function updatePlayerPositions(positions) {
    console.log('Updating player positions:', positions);

    // Find my position data
    const myPosition = positions.find(pos => pos.id === socket.id);
    if (!myPosition) {
      console.error('Current player not found in position data');
      return;
    }

    // Find other players' positions
    const otherPlayers = positions.filter(pos => pos.id !== socket.id);

    // Always put the current player at position "human" (bottom)
    const humanEl = document.querySelector('#player-human h2');
    if (humanEl) {
      humanEl.innerHTML = `You <span class="player-position ${myPosition.isDealer ? 'dealer' : ''} ${myPosition.isSB ? 'small-blind' : ''} ${myPosition.isBB ? 'big-blind' : ''}">${myPosition.position}</span>`;
    }

    // Calculate relative positions for other players
    // In a 4-player game with human at the bottom:
    // - Player to the left = ai3 (left)
    // - Player across = ai1 (top)
    // - Player to the right = ai2 (right)

    // Get my absolute table position (0-3)
    const myTablePos = myPosition.tablePosition;

    // Clear existing player displays first
    document.querySelectorAll('#player-ai1 h2, #player-ai2 h2, #player-ai3 h2').forEach(el => {
      // Keep original AI names or use default
      const aiName = el.textContent.trim().split(' ')[0];
      el.innerHTML = `${aiName} <span class="player-position">-</span>`;
    });

    // Map each other player to their visual position
    otherPlayers.forEach(player => {
      // Calculate relative position (0=right, 1=top, 2=left)
      const relativePos = (player.tablePosition - myTablePos + 4) % 4;
      let aiSlot;

      // Convert relative position to AI slot
      switch (relativePos) {
        case 1: // Right position (clockwise from human)
          aiSlot = 'ai2';
          break;
        case 2: // Top position (across from human)
          aiSlot = 'ai1';
          break;
        case 3: // Left position (counter-clockwise from human)
          aiSlot = 'ai3';
          break;
        default:
          console.error('Invalid relative position:', relativePos);
          return;
      }

      // Update the player position display
      const aiEl = document.querySelector(`#player-${aiSlot} h2`);
      if (aiEl) {
        aiEl.innerHTML = `${player.name} <span class="player-position ${player.isDealer ? 'dealer' : ''} ${player.isSB ? 'small-blind' : ''} ${player.isBB ? 'big-blind' : ''}">${player.position}</span>`;
      }
    });

    // Position blind buttons
    positionBlindButtons();
  }

  // Helper to position a button next to a player
  function positionButton(button, playerId, position) {
    const positions = {
      'player-human': {
        left: { left: '100px', top: '66%', right: 'auto', bottom: 'auto' },
        right: { left: '150px', top: '66%', right: 'auto', bottom: 'auto' },
        top: { left: '125px', top: '60%', right: 'auto', bottom: 'auto' }
      },
      'player-ai1': {
        left: { left: '45%', top: '75px', right: 'auto', bottom: 'auto' },
        right: { left: '55%', top: '75px', right: 'auto', bottom: 'auto' },
        top: { left: '50%', top: '65px', right: 'auto', bottom: 'auto' }
      },
      'player-ai2': {
        left: { right: '125px', top: '60%', left: 'auto', bottom: 'auto' },
        right: { right: '75px', top: '60%', left: 'auto', bottom: 'auto' },
        top: { right: '100px', top: '55%', left: 'auto', bottom: 'auto' }
      },
      'player-ai3': {
        left: { left: '45%', bottom: '75px', right: 'auto', top: 'auto' },
        right: { left: '55%', bottom: '75px', right: 'auto', top: 'auto' },
        top: { left: '50%', bottom: '65px', right: 'auto', top: 'auto' }
      }
    };

    const pos = positions[playerId]?.[position];
    if (pos) {
      Object.keys(pos).forEach(prop => {
        button.style[prop] = pos[prop];
      });
    }
  }

  // Add this function to handle safe UI updates
  function safeUIUpdate() {
    try {
      // Safely update stacks
      GAME.state.players.forEach((player) => {
        const stackElement = document.getElementById(`${player.id}-stack`);
        if (stackElement) {
          stackElement.innerHTML = `<i class="fas fa-coins stack-icon"></i> $${player.stack}`;
        }

        const betElement = document.getElementById(`${player.id}-bet-amount`);
        if (betElement) {
          if (player.bet > 0) {
            betElement.textContent = "$" + player.bet;
            betElement.style.display = "block";
          } else {
            betElement.style.display = "none";
          }
        }

        // Safe chips rendering
        const chipsContainer = document.getElementById(`${player.id}-chips`);
        if (chipsContainer) {
          chipsContainer.innerHTML = "";
          if (player.bet > 0) {
            renderChips(player);
          }
        }
      });

      // Update pot safely
      const potElement = document.getElementById("pot");
      if (potElement) {
        potElement.textContent = "Pot: $" + GAME.state.pot;
      }

      // Safely render hands if the function exists
      if (window.GAME.engine && typeof window.GAME.engine.renderHands === "function") {
        window.GAME.engine.renderHands();
      }

      // Safely render power cards if the function exists
      if (window.GAME.engine && typeof window.GAME.engine.renderPowerCards === "function") {
        window.GAME.engine.renderPowerCards();
      }

      // Update game stage safely
      if (window.GAME.utils && typeof window.GAME.utils.updateGameStage === "function") {
        const stageElement = document.querySelector(".stage-dot.active");
        if (stageElement) {
          stageElement.classList.remove("active");
        }

        const newActiveStage = document.querySelector(`.stage-dot[data-stage="${GAME.state.currentStage}"]`);
        if (newActiveStage) {
          newActiveStage.classList.add("active");
        }
      }
    } catch (error) {
      console.error("Error in safe UI update:", error);
    }
  }

  // Add this function to safely update action buttons
  function safeUpdateActionButtons() {
    try {
      const checkButton = document.getElementById("check-button");
      const callButton = document.getElementById("call-button");
      const betButton = document.getElementById("bet-button");
      const raiseButton = document.getElementById("raise-button");
      const allInButton = document.getElementById("all-in-button");

      if (!checkButton || !callButton || !betButton || !raiseButton || !allInButton) {
        console.error("Action buttons not found");
        return;
      }

      // Find human player
      const humanPlayer = GAME.state.players.find(p => p.id === socket.id);
      if (!humanPlayer) {
        console.error("Human player not found in game state");
        return;
      }

      // Reset all buttons
      checkButton.disabled = false;
      callButton.disabled = false;
      betButton.disabled = false;
      raiseButton.disabled = false;
      allInButton.disabled = false;

      // Handle all-in case
      if (humanPlayer.stack === 0) {
        checkButton.disabled = true;
        callButton.disabled = true;
        betButton.disabled = true;
        raiseButton.disabled = true;
        allInButton.disabled = true;
        return;
      }

      // If there's a bet
      if (GAME.state.currentBet > humanPlayer.bet) {
        checkButton.disabled = true;

        // Calculate call amount
        const callAmount = GAME.state.currentBet - humanPlayer.bet;

        // If human doesn't have enough to call
        if (humanPlayer.stack < callAmount) {
          callButton.disabled = true;
        }

        // Enable/disable Raise based on stack size
        if (humanPlayer.stack <= callAmount || humanPlayer.stack < GAME.BIG_BLIND) {
          raiseButton.disabled = true;
        }

        // Show Raise instead of Bet when there's already a bet
        betButton.style.display = "none";
        raiseButton.style.display = "inline-block";

        // Update call button text
        callButton.textContent = `Call $${callAmount}`;
      } else {
        // No bet or player has already matched the current bet
        checkButton.disabled = false;
        callButton.disabled = true;

        // Show Bet instead of Raise when there's no bet
        betButton.style.display = "inline-block";
        raiseButton.style.display = "none";

        // Reset call button text
        callButton.textContent = "Call";
      }

      // If human can't bet the minimum, disable bet button
      if (humanPlayer.stack < GAME.BIG_BLIND) {
        betButton.disabled = true;
      }
    } catch (error) {
      console.error("Error updating action buttons:", error);
    }
  }

  // function positionDealerButton() {
  //   // Find the dealer position element
  //   const dealerEl = document.querySelector('.player-position.dealer');
  //   if (!dealerEl) return;

  //   // Show the dealer button
  //   const dealerBtn = document.getElementById('dealer-button');
  //   if (!dealerBtn) return;

  //   dealerBtn.style.display = 'flex';

  //   // Position it based on which player is the dealer
  //   const playerEl = dealerEl.closest('.player');
  //   if (!playerEl) return;

  //   const playerId = playerEl.id;

  //   // Position dealer button based on player location
  //   switch (playerId) {
  //     case 'player-human': // Bottom
  //       dealerBtn.style.left = '40%';
  //       dealerBtn.style.top = 'auto';
  //       dealerBtn.style.right = 'auto';
  //       dealerBtn.style.bottom = '80px';
  //       break;
  //     case 'player-ai1': // Top
  //       dealerBtn.style.left = '50%';
  //       dealerBtn.style.top = '80px';
  //       dealerBtn.style.right = 'auto';
  //       dealerBtn.style.bottom = 'auto';
  //       break;
  //     case 'player-ai2': // Right
  //       dealerBtn.style.left = 'auto';
  //       dealerBtn.style.top = '50%';
  //       dealerBtn.style.right = '80px';
  //       dealerBtn.style.bottom = 'auto';
  //       break;
  //     case 'player-ai3': // Left
  //       dealerBtn.style.left = '80px';
  //       dealerBtn.style.top = '50%';
  //       dealerBtn.style.right = 'auto';
  //       dealerBtn.style.bottom = 'auto';
  //       break;
  //   }
  // }

  // Helper function to toggle the multiplayer overlay
  function toggleMultiplayerOverlay(show) {
    const overlay = document.querySelector(".multiplayer-overlay");
    if (overlay) {
      overlay.style.display = show ? "flex" : "none";
    }
  }

  // Helper function to toggle room info section
  function toggleRoomInfoSection(show) {
    const roomInfoContainer = document.querySelector(".room-info-container");
    if (roomInfoContainer) {
      roomInfoContainer.style.display = show ? "block" : "none";
    }
  }

  // Helper function to toggle join room section
  function toggleJoinRoomSection(show) {
    const joinRoomContainer = document.querySelector(".join-room-container");
    if (joinRoomContainer) {
      joinRoomContainer.style.display = show ? "flex" : "none";
    }
  }

  // Helper function to update room display
  function updateRoomDisplay() {
    document.getElementById("room-code-display").textContent = currentRoom;
    document.getElementById("hud-room-code").textContent = currentRoom;
  }

  // Helper function to show message
  function showMessage(message) {
    if (window.GAME && window.GAME.utils) {
      window.GAME.utils.showMessage(message);
    } else {
      alert(message);
    }
  }

  // Initialize when DOM is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMultiplayer);
  } else {
    initMultiplayer();
  }
})();
