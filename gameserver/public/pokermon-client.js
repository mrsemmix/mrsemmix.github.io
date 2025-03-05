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

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      showMessage("Disconnected from server. Please refresh the page.");
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
        console.log(
          `Sending action to server: ${action}, amount: ${betAmount}`
        );

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

        // Hide betting controls immediately for better UX
        document.getElementById("betting-controls").classList.remove("visible");

        return true;
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

  // Handle player turn event
  function handlePlayerTurn(data) {
    console.log("Player turn:", data);

    // Check if it's this player's turn
    const isMyTurn = data.playerId === socket.id;

    // Add to game log
    if (window.GAME && window.GAME.utils) {
      window.GAME.utils.addLog(`It's ${data.playerName}'s turn`, "action");

      if (isMyTurn) {
        window.GAME.utils.showMessage("Your turn - choose your action");

        // Show betting controls for human player
        document.getElementById("betting-controls").classList.add("visible");

        // Update action buttons
        if (window.GAME.engine && window.GAME.engine.updateActionButtons) {
          window.GAME.engine.updateActionButtons();
        }
      }
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
  function handleGameStateUpdate(state) {
    console.log('Game state update received:', state);

    if (window.GAME && window.GAME.state) {
      // Update GAME.state with the new state
      // Map remote players to local player slots
      // Human player is always index 0, others are AI1, AI2, AI3

      // Update player names if provided
      if (state.playerNames && state.playerNames.length > 0) {
        updatePlayerNames(state.playerNames);
      }

      state.players.forEach((remotePlayer, index) => {
        // Find this player's index in the local game
        let localIndex = remotePlayer.id === socket.id ? 0 : index;
        if (localIndex >= window.GAME.state.players.length) {
          localIndex = index % window.GAME.state.players.length;
        }

        const localPlayer = window.GAME.state.players[localIndex];

        // Update player information
        localPlayer.id = remotePlayer.id;
        // Don't overwrite player names with generic "Player 1" etc.
        if (remotePlayer.name && !remotePlayer.name.startsWith('Player ')) {
          localPlayer.name = remotePlayer.name;
        }
        localPlayer.hand = remotePlayer.hand;
        localPlayer.stack = remotePlayer.stack;
        localPlayer.bet = remotePlayer.bet;
        localPlayer.folded = remotePlayer.folded;
        localPlayer.allIn = remotePlayer.allIn;
        localPlayer.active = remotePlayer.active;
      });

      // Update game state
      window.GAME.state.arenaCard = state.arenaCard;
      window.GAME.state.powerCards = state.powerCards;
      window.GAME.state.currentStage = state.currentStage;
      window.GAME.state.dealerPosition = state.dealerPosition;
      window.GAME.state.activePlayerIndex = state.activePlayerIndex;
      window.GAME.state.pot = state.pot;
      window.GAME.state.currentBet = state.currentBet;

      // Highlight active player
      highlightActivePlayer(state.activePlayerIndex);

      // Update UI elements
      updateUI();
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

  // Helper function to update player positions
  function updatePlayerPositions(positions) {
    console.log('Updating player positions:', positions);

    // Find current player's position
    const myPosition = positions.find(pos => pos.id === socket.id);
    if (!myPosition) {
      console.error('Could not find current player in position data');
      return;
    }

    // Find other players' positions
    const otherPlayers = positions.filter(pos => pos.id !== socket.id);

    // Always put the current player at position "human" (bottom)
    const humanEl = document.querySelector('#player-human .player-position');
    if (humanEl) {
      humanEl.textContent = myPosition.position;

      // Mark as dealer if applicable
      if (myPosition.isDealer) {
        humanEl.classList.add('dealer');
      } else {
        humanEl.classList.remove('dealer');
      }
    }

    // Calculate relative positions for other players
    // In a 4-player game, relative to the human at the bottom:
    // - Left = (myIndex + 3) % 4
    // - Top = (myIndex + 2) % 4
    // - Right = (myIndex + 1) % 4

    // Get my table position (0-3)
    const myTablePos = myPosition.tablePosition;

    // Map each other player to an AI position
    otherPlayers.forEach(player => {
      // Calculate relative position (0=right, 1=top, 2=left)
      // This gives us the correct AI slot (ai1, ai2, ai3) for each player
      const relativePos = (player.tablePosition - myTablePos + 4) % 4;
      let aiSlot;

      // Convert relative position to AI slot
      switch (relativePos) {
        case 1: // Right position (clockwise from human)
          aiSlot = 'ai2';
          break;
        case 2: // Top position
          aiSlot = 'ai1';
          break;
        case 3: // Left position (counter-clockwise from human)
          aiSlot = 'ai3';
          break;
        default:
          console.error('Invalid relative position:', relativePos);
          return;
      }

      // Update the player name and position in the correct AI slot
      const aiEl = document.querySelector(`#player-${aiSlot} h2`);
      const posEl = document.querySelector(`#player-${aiSlot} .player-position`);

      if (aiEl && posEl) {
        // Update name if it's not the default "AI X"
        if (!aiEl.textContent.includes('AI ')) {
          aiEl.innerHTML = `${player.name} <span class="player-position">${player.position}</span>`;
        } else {
          posEl.textContent = player.position;
        }

        // Mark as dealer if applicable
        if (player.isDealer) {
          posEl.classList.add('dealer');
        } else {
          posEl.classList.remove('dealer');
        }
      }

      console.log(`Mapped player ${player.name} (${player.position}) to slot ${aiSlot}`);
    });

    // Update dealer button position based on dealer player
    positionDealerButton();
  }

  function positionDealerButton() {
    // Find the dealer position element
    const dealerEl = document.querySelector('.player-position.dealer');
    if (!dealerEl) return;

    // Show the dealer button
    const dealerBtn = document.getElementById('dealer-button');
    if (!dealerBtn) return;

    dealerBtn.style.display = 'flex';

    // Position it based on which player is the dealer
    const playerEl = dealerEl.closest('.player');
    if (!playerEl) return;

    const playerId = playerEl.id;

    // Position dealer button based on player location
    switch (playerId) {
      case 'player-human': // Bottom
        dealerBtn.style.left = '40%';
        dealerBtn.style.top = 'auto';
        dealerBtn.style.right = 'auto';
        dealerBtn.style.bottom = '80px';
        break;
      case 'player-ai1': // Top
        dealerBtn.style.left = '50%';
        dealerBtn.style.top = '80px';
        dealerBtn.style.right = 'auto';
        dealerBtn.style.bottom = 'auto';
        break;
      case 'player-ai2': // Right
        dealerBtn.style.left = 'auto';
        dealerBtn.style.top = '50%';
        dealerBtn.style.right = '80px';
        dealerBtn.style.bottom = 'auto';
        break;
      case 'player-ai3': // Left
        dealerBtn.style.left = '80px';
        dealerBtn.style.top = '50%';
        dealerBtn.style.right = 'auto';
        dealerBtn.style.bottom = 'auto';
        break;
    }
  }

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
