/*
 * pokermon-thin-client.js
 * Pure presentation layer for PokerMon multiplayer
 */

(function () {
  // Socket.io connection
  let socket;

  // Local references
  let currentRoom = null;
  let playerName = "";
  let myPlayerId = null;

  // Initialize GAME object if missing
  if (!window.GAME) {
    console.log("Creating GAME object for thin client");
    window.GAME = {
      state: {
        players: [],
        arenaCard: null,
        powerCards: [],
        currentStage: "preflop",
        dealerPosition: 0,
        activePlayerIndex: 0,
        pot: 0,
        currentBet: 0
      },
      ELEMENTS: ["Fire", "Water", "Earth", "Air"],
      BIG_BLIND: 10,
      SMALL_BLIND: 5,
      utils: {
        // Placeholder utility functions in case the main utils file fails to load
        addLog: function (msg, type) {
          const logEl = document.getElementById("game-log");
          if (!logEl) return;

          const p = document.createElement("p");
          p.textContent = msg;
          if (type) p.classList.add("log-" + type);
          logEl.appendChild(p);
          logEl.scrollTop = logEl.scrollHeight;
        },
        showMessage: function (msg) {
          const msgEl = document.getElementById("message");
          if (!msgEl) return;

          msgEl.textContent = msg;
          msgEl.classList.add("visible");
          setTimeout(() => msgEl.classList.remove("visible"), 5000);
        }
      }
    };
  }

  // Initialize
  function initThinClient() {
    console.log("Initializing thin client");

    // Create UI
    createMultiplayerUI();

    // Connect to server
    socket = io();

    // Set up event handlers
    setupSocketHandlers();
  }

  // Create multiplayer UI overlay
  function createMultiplayerUI() {
    // [Keep your existing UI creation code]
  }

  // Set up all socket event handlers
  function setupSocketHandlers() {
    // Connection events
    socket.on("connect", () => {
      console.log("Connected to server with ID:", socket.id);
      myPlayerId = socket.id;
      refreshRoomList();
    });

    socket.on("disconnect", () => {
      showMessage("Disconnected from server. Reconnecting...");
    });

    // Room events
    socket.on("roomUpdate", handleRoomUpdate);
    socket.on("hostChanged", (data) => {
      showMessage(`Host changed to ${data.newHostName}`);
    });

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

  // Handle room join/create
  function createRoom() {
    playerName = document.getElementById("player-name").value.trim() || generateDefaultName();

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

  function joinRoomWithCode() {
    const roomCode = document.getElementById("room-code-input").value.trim().toUpperCase();
    playerName = document.getElementById("player-name").value.trim() || generateDefaultName();

    if (!roomCode) {
      showMessage("Please enter a room code");
      return;
    }

    socket.emit("joinRoom", { roomCode, playerName }, (response) => {
      if (response.success) {
        currentRoom = response.roomCode;
        updateRoomDisplay();
        toggleRoomInfoSection(true);
      } else {
        showMessage(response.error || "Failed to join room");
      }
    });
  }

  function toggleReady() {
    const readyBtn = document.getElementById("ready-btn");
    const isReady = readyBtn.classList.contains("ready");
    socket.emit("playerReady", !isReady);
  }

  function refreshRoomList() {
    socket.emit("getRooms", (rooms) => {
      updateRoomListDisplay(rooms);
    });
  }

  function leaveRoom() {
    socket.disconnect();
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  // Game event handlers
  function handleGameStarted(data) {
    console.log('Game started:', data);

    // Hide multiplayer overlay
    toggleMultiplayerOverlay(false);

    // Show in-game HUD
    const hudElement = document.querySelector('.multiplayer-hud');
    if (hudElement) hudElement.style.display = 'flex';

    const roomDisplay = document.getElementById('hud-room-code');
    if (roomDisplay) roomDisplay.textContent = currentRoom;

    // Reset the table
    resetTable();

    // Update player positions if provided
    if (data.playerPositions) {
      renderPlayerPositions(data.playerPositions);
    }

    // Hide start button (might be controlled by the server)
    const startButton = document.getElementById("start-button");
    if (startButton) startButton.style.display = "none";
  }

  function handleGameEnded(data) {
    console.log("Game ended:", data);

    setTimeout(() => {
      toggleMultiplayerOverlay(true);
      showMessage(data.message);
    }, 3000);
  }

  function handleDealCards(data) {
    console.log("Cards dealt:", data);

    // Render player's cards
    renderPlayerCards(myPlayerId, data.hand);
  }

  function handleArenaCardDealt(card) {
    console.log("Arena card dealt:", card);
    renderArenaCard(card);
    addToGameLog(`Arena revealed: ${card.name} (${card.element})`, "action");
  }

  function handlePowerCardDealt(data) {
    console.log("Power card dealt:", data);
    renderPowerCard(data.card);
    addToGameLog(`Power Card dealt: ${data.card.name} (${data.card.element} +${data.card.power})`, "action");
  }

  function handleBlindPosted(data) {
    console.log("Blinds posted:", data);
    addToGameLog(`${data.smallBlind.player} posts small blind: $${data.smallBlind.amount}`, "bet");
    addToGameLog(`${data.bigBlind.player} posts big blind: $${data.bigBlind.amount}`, "bet");
  }

  function handlePlayerAction(data) {
    console.log("Player action:", data);

    let actionText = "";
    switch (data.type) {
      case "check": actionText = `${data.playerName} checks.`; break;
      case "fold": actionText = `${data.playerName} folds.`; break;
      case "call": actionText = `${data.playerName} calls $${data.amount}.`; break;
      case "bet": actionText = `${data.playerName} bets $${data.amount}.`; break;
      case "raise": actionText = `${data.playerName} raises to $${data.amount}.`; break;
      case "allIn": actionText = `${data.playerName} goes all-in with $${data.amount}!`; break;
    }

    addToGameLog(actionText, data.type === "fold" ? "fold" : "action");

    // Show visual action indicator
    const playerElement = document.querySelector(`[data-player-id="${data.playerId}"]`);
    if (playerElement) {
      const actionDiv = playerElement.querySelector(".player-action");
      if (actionDiv) {
        actionDiv.textContent = data.type === "check" ? "Check" :
          data.type === "fold" ? "Fold" :
            data.type === "call" ? `Call $${data.amount}` :
              data.type === "bet" ? `Bet $${data.amount}` :
                data.type === "raise" ? `Raise $${data.amount}` :
                  `All-In $${data.amount}`;

        actionDiv.className = "player-action " + data.type;
        actionDiv.classList.add("visible");

        setTimeout(() => {
          actionDiv.classList.remove("visible");
        }, 2000);
      }
    }
  }

  function handlePlayerTurn(data) {
    console.log("Player turn:", data);

    addToGameLog(`It's ${data.playerName}'s turn`, "action");

    // Highlight active player
    highlightActivePlayer(data.playerId);

    // Update game stage if provided
    if (data.stage) {
      updateGameStage(data.stage);
    }

    // Update pot and current bet
    updatePotDisplay(data.pot);

    // Show controls if it's my turn
    if (data.playerId === myPlayerId) {
      showMessage("Your turn - choose your action");
      showBettingControls(data.currentBet);
    }
  }

  function handleGameStateUpdate(state) {
    console.log("Game state update:", state);

    // Render the complete game state
    renderGameState(state);
  }

  function handleShowdown(data) {
    console.log("Showdown:", data);

    // Log winners
    data.winners.forEach(winner => {
      const winMessage = winner.handValue === 'N/A'
        ? `${winner.name} wins ${winner.potWon} as the only remaining player!`
        : `${winner.name} wins ${winner.potWon} with hand value ${winner.handValue}!`;

      addToGameLog(winMessage, "win");
    });

    // Show all hands if provided
    if (data.hands && data.hands.length > 0) {
      data.hands.forEach(handInfo => {
        if (!handInfo.folded) {
          renderPlayerCards(handInfo.id, handInfo.hand, true); // true for showdown mode
        }
      });
    }

    // Show winner overlay
    showWinnerOverlay(data.winners[0], data.message);
  }

  // Rendering functions
  function renderGameState(state) {
    // 1. Render player information (stacks, bets, etc.)
    if (state.players) {
      state.players.forEach(player => {
        updatePlayerDisplay(player);
      });
    }

    // 2. Render cards
    if (state.arenaCard) {
      renderArenaCard(state.arenaCard);
    }

    if (state.powerCards) {
      state.powerCards.forEach(card => {
        renderPowerCard(card);
      });
    }

    // 3. Update game phase
    if (state.currentStage) {
      updateGameStage(state.currentStage);
    }

    // 4. Update pot
    if (state.pot !== undefined) {
      updatePotDisplay(state.pot);
    }

    // 5. Highlight active player
    if (state.activePlayerIndex !== undefined && state.players) {
      const activePlayer = state.players[state.activePlayerIndex];
      if (activePlayer) {
        highlightActivePlayer(activePlayer.id);
      }
    }

    // 6. Render player positions
    if (state.playerPositions) {
      renderPlayerPositions(state.playerPositions);
    }
  }

  function renderPlayerPositions(positions) {
    console.log('Rendering player positions:', positions);

    // Find my position in the data
    const myPosition = positions.find(pos => pos.id === myPlayerId);
    if (!myPosition) {
      console.error('Cannot find current player in position data');
      return;
    }

    // Always put myself at the bottom position (human)
    const humanEl = document.getElementById('player-human');
    if (humanEl) {
      humanEl.setAttribute('data-player-id', myPlayerId);
      const nameEl = humanEl.querySelector('h2');
      if (nameEl) {
        nameEl.innerHTML = `You <span class="player-position ${myPosition.isDealer ? 'dealer' : ''}">${myPosition.position}</span>`;
      }
    }

    // Find other players' positions
    const otherPlayers = positions.filter(pos => pos.id !== myPlayerId);

    // Calculate players' visual positions relative to me
    // My position is at the bottom, other positions are clockwise
    const myTablePos = myPosition.tablePosition;

    // Map other players to their visual positions
    otherPlayers.forEach(player => {
      // Calculate position relative to me
      const relativePos = (player.tablePosition - myTablePos + 4) % 4;
      let slotId;

      // Assign to correct visual position
      // 1 = clockwise = right
      // 2 = opposite = top
      // 3 = counterclockwise = left
      switch (relativePos) {
        case 1: slotId = 'player-ai2'; break; // right
        case 2: slotId = 'player-ai1'; break; // top
        case 3: slotId = 'player-ai3'; break; // left
        default: console.error('Invalid relative position:', relativePos); return;
      }

      // Update player slot
      const slotEl = document.getElementById(slotId);
      if (slotEl) {
        slotEl.setAttribute('data-player-id', player.id);
        const nameEl = slotEl.querySelector('h2');
        if (nameEl) {
          nameEl.innerHTML = `${player.name} <span class="player-position ${player.isDealer ? 'dealer' : ''}">${player.position}</span>`;
        }
      }
    });

    // Position dealer button, small blind, and big blind
    positionButtons(positions);
  }

  function updatePlayerDisplay(player) {
    // Find the player element using data attribute
    const playerEl = document.querySelector(`[data-player-id="${player.id}"]`);
    if (!playerEl) return;

    // Update stack
    const stackEl = playerEl.querySelector('.player-stack');
    if (stackEl) {
      stackEl.innerHTML = `<i class="fas fa-coins stack-icon"></i> $${player.stack}`;
    }

    // Update bet
    const betEl = playerEl.querySelector('.player-bet');
    if (betEl) {
      if (player.bet > 0) {
        betEl.textContent = `$${player.bet}`;
        betEl.style.display = 'block';
      } else {
        betEl.style.display = 'none';
      }
    }

    // Update folded state
    if (player.folded) {
      playerEl.classList.add('folded');
    } else {
      playerEl.classList.remove('folded');
    }

    // Render chips based on bet
    renderChips(player.id, player.bet);
  }

  function renderPlayerCards(playerId, cards, showdown = false) {
    // Find player element
    const playerEl = document.querySelector(`[data-player-id="${playerId}"]`);
    if (!playerEl) return;

    const cardsContainer = playerEl.querySelector('.cards');
    if (!cardsContainer) return;

    // Clear existing cards
    cardsContainer.innerHTML = '';

    // If player folded, show "Folded" text
    if (playerEl.classList.contains('folded')) {
      const foldedText = document.createElement('div');
      foldedText.textContent = 'Folded';
      foldedText.style.fontSize = '16px';
      foldedText.style.color = '#aaa';
      foldedText.style.textAlign = 'center';
      foldedText.style.marginTop = '20px';
      cardsContainer.appendChild(foldedText);
      return;
    }

    // Render cards
    if (cards && cards.length > 0) {
      cards.forEach(card => {
        // Only show face-up cards for this player or during showdown
        const faceUp = playerId === myPlayerId || showdown;

        if (faceUp) {
          // Create card with details
          const cardDiv = document.createElement('div');
          cardDiv.className = `card monster ${card.element.toLowerCase()}-card card-deal`;

          // Calculate bonus
          const bonus = calculateCardBonus(card);
          const bonusClass = bonus >= 0 ? 'bonus-positive' : 'bonus-negative';

          // Create card content
          const iconHTML = getElementIcon(card.element);
          cardDiv.innerHTML = `
              <div class="card-type">${iconHTML} ${card.element}</div>
              <div class="card-name">${card.name}</div>
              <div class="card-value">${card.value}</div>
              <div class="bonus-indicator ${bonusClass}">${bonus >= 0 ? '+' + bonus : bonus}</div>
            `;

          cardsContainer.appendChild(cardDiv);
        } else {
          // Create face-down card
          const cardDiv = document.createElement('div');
          cardDiv.className = 'card card-back card-deal';
          cardsContainer.appendChild(cardDiv);
        }
      });

      // Update total value for face-up cards
      if (faceUp) {
        const totalValue = cards.reduce((sum, card) => sum + card.value + calculateCardBonus(card), 0);
        const totalEl = playerEl.querySelector('[id$="-total"]');
        if (totalEl) {
          totalEl.innerText = `Total: ${totalValue}`;
        }
      }
    }
  }

  function renderArenaCard(card) {
    // Update arena label
    const arenaLabel = document.getElementById('arena-label');
    if (arenaLabel) {
      arenaLabel.innerText = `${card.name} (${card.element})`;
      arenaLabel.style.color = getElementColor(card.element);
      arenaLabel.classList.add('active');
    }

    // Update arena container styling
    const container = document.getElementById('power-cards-container');
    if (container) {
      container.className = `${card.element.toLowerCase()}-arena`;
      container.style.borderColor = getElementColor(card.element);
      container.style.background = getElementGradient(card.element);
    }
  }

  function renderPowerCard(card) {
    const container = document.getElementById('power-cards');
    if (!container) return;

    // Create card element
    const cardDiv = document.createElement('div');
    cardDiv.className = `card power ${card.element.toLowerCase()}-card`;

    // Add card content
    const iconHTML = getElementIcon(card.element);
    cardDiv.innerHTML = `
        <div class="card-type">${iconHTML} ${card.element}</div>
        <div class="card-name">${card.name}</div>
        <div class="card-value">+${card.power}</div>
      `;

    // Add to container with animation
    cardDiv.classList.add('card-deal');
    container.appendChild(cardDiv);
  }

  function renderChips(playerId, betAmount) {
    if (betAmount <= 0) return;

    const playerEl = document.querySelector(`[data-player-id="${playerId}"]`);
    if (!playerEl) return;

    const chipsContainer = playerEl.querySelector('.chips-container');
    if (!chipsContainer) return;

    // Clear existing chips
    chipsContainer.innerHTML = '';

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

  function positionButtons(positions) {
    // Find button elements
    const dealerBtn = document.getElementById('dealer-button');
    const sbBtn = document.getElementById('small-blind-button');
    const bbBtn = document.getElementById('big-blind-button');

    if (!dealerBtn || !sbBtn || !bbBtn) return;

    // Hide all buttons initially
    dealerBtn.style.display = 'none';
    sbBtn.style.display = 'none';
    bbBtn.style.display = 'none';

    // Find players with special positions
    const dealerPlayer = positions.find(p => p.isDealer);
    const sbPlayer = positions.find(p => p.position === 'SB');
    const bbPlayer = positions.find(p => p.position === 'BB');

    // Position dealer button
    if (dealerPlayer) {
      const playerEl = document.querySelector(`[data-player-id="${dealerPlayer.id}"]`);
      if (playerEl) {
        dealerBtn.style.display = 'flex';
        positionButtonForPlayer(dealerBtn, playerEl.id, 'left');
      }
    }

    // Position SB button
    if (sbPlayer) {
      const playerEl = document.querySelector(`[data-player-id="${sbPlayer.id}"]`);
      if (playerEl) {
        sbBtn.style.display = 'flex';
        positionButtonForPlayer(sbBtn, playerEl.id, 'right');
      }
    }

    // Position BB button
    if (bbPlayer) {
      const playerEl = document.querySelector(`[data-player-id="${bbPlayer.id}"]`);
      if (playerEl) {
        bbBtn.style.display = 'flex';
        positionButtonForPlayer(bbBtn, playerEl.id, 'top');
      }
    }
  }

  function positionButtonForPlayer(button, playerId, position) {
    // Define positions for each player slot
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

  function highlightActivePlayer(playerId) {
    // Remove active class from all players
    document.querySelectorAll('.player').forEach(el => {
      el.classList.remove('active');
    });

    // Add active class to the current player
    const playerEl = document.querySelector(`[data-player-id="${playerId}"]`);
    if (playerEl) {
      playerEl.classList.add('active');
    }
  }

  function updateGameStage(stage) {
    // Update game stage indicators
    const dots = document.querySelectorAll('.stage-dot');
    dots.forEach(dot => dot.classList.remove('active'));

    const stageIndex = ['preflop', 'arena', 'power1', 'power2', 'power3'].indexOf(stage);
    if (stageIndex >= 0 && stageIndex < dots.length) {
      dots[stageIndex].classList.add('active');
    }
  }

  function updatePotDisplay(amount) {
    const potElement = document.getElementById('pot');
    if (potElement) {
      potElement.textContent = `Pot: $${amount}`;
    }
  }

  function showBettingControls(currentBet) {
    const controls = document.getElementById('betting-controls');
    if (!controls) return;

    controls.classList.add('visible');

    // Update available actions
    updateActionButtons(currentBet);
  }

  function updateActionButtons(currentBet) {
    const checkButton = document.getElementById('check-button');
    const callButton = document.getElementById('call-button');
    const betButton = document.getElementById('bet-button');
    const raiseButton = document.getElementById('raise-button');
    const foldButton = document.getElementById('fold-button');
    const allInButton = document.getElementById('all-in-button');

    if (!checkButton || !callButton || !betButton || !raiseButton || !foldButton || !allInButton) return;

    // Find human player
    const playerEl = document.getElementById('player-human');
    if (!playerEl) return;

    // Get player stack
    const stackText = playerEl.querySelector('.player-stack')?.textContent || '';
    const stack = parseInt(stackText.replace(/[^0-9]/g, '')) || 0;

    // Get player current bet
    const betEl = playerEl.querySelector('.player-bet');
    const currentPlayerBet = betEl && betEl.style.display !== 'none' ?
      parseInt(betEl.textContent.replace(/[^0-9]/g, '')) || 0 : 0;

    // Reset buttons
    checkButton.disabled = false;
    callButton.disabled = false;
    betButton.disabled = false;
    raiseButton.disabled = false;
    foldButton.disabled = false;
    allInButton.disabled = false;

    // Get minimum bet/raise amount
    const minBet = 10; // Big blind

    // If there's a bet to call
    if (currentBet > currentPlayerBet) {
      checkButton.disabled = true;

      const callAmount = currentBet - currentPlayerBet;

      // If player can't afford the call
      if (stack < callAmount) {
        callButton.disabled = true;
      } else {
        callButton.textContent = `Call $${callAmount}`;
      }

      // Set minimum raise
      if (stack <= callAmount + minBet) {
        raiseButton.disabled = true;
      }

      // Show raise button instead of bet
      betButton.style.display = 'none';
      raiseButton.style.display = 'inline-block';
    } else {
      // No bet to call
      checkButton.disabled = false;
      callButton.disabled = true;

      // Show bet button instead of raise
      betButton.style.display = 'inline-block';
      raiseButton.style.display = 'none';

      // If player can't afford minimum bet
      if (stack < minBet) {
        betButton.disabled = true;
      }
    }

    // If player is broke, disable all-in too
    if (stack === 0) {
      allInButton.disabled = true;
    }
  }

  function showWinnerOverlay(winner, message) {
    const overlay = document.getElementById('winner-overlay');
    const title = document.getElementById('winner-title');
    const info = document.getElementById('winner-info');
    const pot = document.getElementById('winner-pot');

    if (!overlay || !title || !info || !pot) return;

    title.textContent = `${winner.name} Wins!`;

    if (winner.handValue === 'N/A') {
      info.textContent = 'as the only remaining player';
    } else {
      info.textContent = `with Monster Total: ${winner.handValue}`;
    }

    pot.textContent = `Pot: $${winner.potWon}`;

    overlay.classList.add('visible');
  }

  // UI helpers
  function resetTable() {
    // Clear all cards
    document.querySelectorAll('.cards').forEach(el => {
      el.innerHTML = '';
    });

    // Clear power cards
    const powerCardsEl = document.getElementById('power-cards');
    if (powerCardsEl) powerCardsEl.innerHTML = '';

    // Reset arena
    const arenaLabel = document.getElementById('arena-label');
    if (arenaLabel) {
      arenaLabel.innerText = '';
      arenaLabel.className = 'arena-label';
    }

    const arenaContainer = document.getElementById('power-cards-container');
    if (arenaContainer) {
      arenaContainer.className = '';
      arenaContainer.style.borderColor = 'transparent';
    }

    // Reset player states
    document.querySelectorAll('.player').forEach(el => {
      el.classList.remove('active', 'folded');

      const betEl = el.querySelector('.player-bet');
      if (betEl) betEl.style.display = 'none';

      const chipsEl = el.querySelector('.chips-container');
      if (chipsEl) chipsEl.innerHTML = '';

      const totalEl = el.querySelector('[id$="-total"]');
      if (totalEl) totalEl.innerText = '';
    });

    // Reset game log if needed
    // const logEl = document.getElementById('game-log');
    // if (logEl) logEl.innerHTML = '';

    // Reset pot
    updatePotDisplay(0);

    // Hide betting controls
    const bettingControls = document.getElementById('betting-controls');
    if (bettingControls) bettingControls.classList.remove('visible');

    // Reset game stage
    updateGameStage('preflop');
  }

  function addToGameLog(message, type = '') {
    const logEl = document.getElementById('game-log');
    if (!logEl) return;

    const p = document.createElement('p');
    p.textContent = message;

    if (type) {
      p.classList.add(`log-${type}`);
    }

    logEl.appendChild(p);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function showMessage(message) {
    const messageEl = document.getElementById('message');
    if (!messageEl) return;

    messageEl.textContent = message;
    messageEl.classList.add('visible');

    // Auto-hide after 5 seconds
    setTimeout(() => {
      messageEl.classList.remove('visible');
    }, 5000);
  }

  // UI toggle helpers
  function toggleMultiplayerOverlay(show) {
    const overlay = document.querySelector('.multiplayer-overlay');
    if (overlay) {
      overlay.style.display = show ? 'flex' : 'none';
    }
  }

  function toggleRoomInfoSection(show) {
    const section = document.querySelector('.room-info-container');
    if (section) {
      section.style.display = show ? 'block' : 'none';
    }
  }

  function updateRoomDisplay() {
    const roomCodeDisplay = document.getElementById('room-code-display');
    const hudRoomCode = document.getElementById('hud-room-code');

    if (roomCodeDisplay) roomCodeDisplay.textContent = currentRoom;
    if (hudRoomCode) hudRoomCode.textContent = currentRoom;
  }

  function updateRoomListDisplay(rooms) {
    const listEl = document.getElementById('room-list');
    if (!listEl) return;

    if (rooms.length === 0) {
      listEl.innerHTML = '<p class="empty-rooms">No rooms available. Create one to start playing!</p>';
      return;
    }

    listEl.innerHTML = '';

    rooms.forEach(room => {
      const roomEl = document.createElement('div');
      roomEl.className = 'room-item';
      roomEl.innerHTML = `
          <span>Room ${room.roomCode}: ${room.playerCount}/${room.maxPlayers} players</span>
          <button class="button join-room-btn">Join</button>
        `;

      roomEl.querySelector('.join-room-btn').addEventListener('click', () => {
        playerName = document.getElementById('player-name').value.trim() || generateDefaultName();

        socket.emit('joinRoom', { roomCode: room.roomCode, playerName }, (response) => {
          if (response.success) {
            currentRoom = response.roomCode;
            updateRoomDisplay();
            toggleRoomInfoSection(true);
          } else {
            showMessage(response.error || 'Failed to join room');
          }
        });
      });

      listEl.appendChild(roomEl);
    });
  }

  // Utility functions
  function generateDefaultName() {
    return `Player_${Math.floor(Math.random() * 1000)}`;
  }

  function calculateCardBonus(card) {
    // Stub - actual calculation would use arena and power cards
    return 0;
  }

  function getElementIcon(element) {
    switch (element) {
      case 'Fire': return '<i class="fas fa-fire fa-icon" style="color: #FF4500;"></i>';
      case 'Water': return '<i class="fas fa-tint fa-icon" style="color: #1E90FF;"></i>';
      case 'Earth': return '<i class="fas fa-mountain fa-icon" style="color: #9ACD32;"></i>';
      case 'Air': return '<i class="fas fa-wind fa-icon" style="color: #ADD8E6;"></i>';
      case 'Electric': return '<i class="fas fa-bolt fa-icon" style="color: #FFD700;"></i>';
      default: return '';
    }
  }

  function getElementColor(element) {
    switch (element) {
      case 'Fire': return '#FF4500';
      case 'Water': return '#1E90FF';
      case 'Earth': return '#9ACD32';
      case 'Air': return '#ADD8E6';
      case 'Electric': return '#FFD700';
      default: return '#fff';
    }
  }

  function getElementGradient(element) {
    const gradients = {
      Fire: "linear-gradient(45deg, rgba(255,69,0,0.2), rgba(255,140,0,0.2), rgba(255,69,0,0.2))",
      Water: "linear-gradient(45deg, rgba(30,144,255,0.2), rgba(65,105,225,0.2), rgba(30,144,255,0.2))",
      Earth: "linear-gradient(45deg, rgba(154,205,50,0.2), rgba(107,142,35,0.2), rgba(154,205,50,0.2))",
      Air: "linear-gradient(45deg, rgba(173,216,230,0.2), rgba(135,206,250,0.2), rgba(173,216,230,0.2))",
      Electric: "linear-gradient(45deg, rgba(255,215,0,0.2), rgba(255,165,0,0.2), rgba(255,215,0,0.2))"
    };

    return gradients[element] || "none";
  }

  // Set up event listeners for UI
  function setupUIEventListeners() {
    // Create room
    document.getElementById('create-room-btn')?.addEventListener('click', createRoom);

    // Join room
    document.getElementById('join-with-code-btn')?.addEventListener('click', joinRoomWithCode);

    // Toggle ready
    document.getElementById('ready-btn')?.addEventListener('click', toggleReady);

    // Leave room
    document.getElementById('leave-room-btn')?.addEventListener('click', leaveRoom);
    document.getElementById('leave-game-btn')?.addEventListener('click', leaveRoom);

    // Refresh rooms
    document.getElementById('refresh-rooms-btn')?.addEventListener('click', refreshRoomList);

    // Game actions
    document.getElementById('check-button')?.addEventListener('click', () => sendGameAction('check'));
    document.getElementById('call-button')?.addEventListener('click', () => sendGameAction('call'));
    document.getElementById('fold-button')?.addEventListener('click', () => sendGameAction('fold'));
    document.getElementById('all-in-button')?.addEventListener('click', () => sendGameAction('allIn'));

    // Bet and raise need amount
    document.getElementById('bet-button')?.addEventListener('click', () => showBetSlider('bet'));
    document.getElementById('raise-button')?.addEventListener('click', () => showBetSlider('raise'));

    // Bet slider confirmation
    document.getElementById('confirm-bet-button')?.addEventListener('click', () => {
      const amount = parseInt(document.getElementById('bet-slider').value);
      const action = document.getElementById('bet-slider-container').dataset.action;
      sendGameAction(action, amount);
      hideBetSlider();
    });

    // Cancel bet
    document.getElementById('cancel-bet-button')?.addEventListener('click', hideBetSlider);

    // Continue after win
    document.getElementById('continue-button')?.addEventListener('click', () => {
      const overlay = document.getElementById('winner-overlay');
      if (overlay) overlay.classList.remove('visible');
    });
  }

  function sendGameAction(type, amount = 0) {
    socket.emit('gameAction', { type, amount });

    // Hide betting controls
    const controls = document.getElementById('betting-controls');
    if (controls) controls.classList.remove('visible');
  }

  function showBetSlider(action) {
    const container = document.getElementById('bet-slider-container');
    const slider = document.getElementById('bet-slider');
    const display = document.getElementById('bet-amount-display');

    if (!container || !slider || !display) return;

    // Get human player stack
    const humanEl = document.getElementById('player-human');
    if (!humanEl) return;

    const stackText = humanEl.querySelector('.player-stack')?.textContent || '';
    const stack = parseInt(stackText.replace(/[^0-9]/g, '')) || 0;

    // Get current bet
    const betEl = humanEl.querySelector('.player-bet');
    const currentBet = betEl && betEl.style.display !== 'none' ?
      parseInt(betEl.textContent.replace(/[^0-9]/g, '')) || 0 : 0;

    // Set min/max values
    const minBet = 10; // Big blind

    if (action === 'bet') {
      // For bets, minimum is big blind
      slider.min = minBet;
      slider.max = stack;
      slider.value = Math.min(Math.max(minBet, Math.floor(stack * 0.25)), stack);
    } else {
      // For raises, minimum is current bet + big blind
      const minRaise = 10; // Minimum raise amount
      slider.min = currentBet + minRaise;
      slider.max = currentBet + stack;
      slider.value = Math.min(Math.max(currentBet + minRaise, Math.floor((currentBet + stack) * 0.25)), currentBet + stack);
    }

    // Update display
    display.textContent = '$' + slider.value;

    // Store action for later
    container.dataset.action = action;

    // Show slider
    container.style.display = 'block';

    // Hide action buttons
    document.querySelectorAll('.betting-controls .button:not(.cancel-btn):not(.confirm-btn)').forEach(btn => {
      btn.style.display = 'none';
    });

    // Update slider on change
    slider.oninput = function () {
      display.textContent = '$' + this.value;
    };
  }

  function hideBetSlider() {
    const container = document.getElementById('bet-slider-container');
    if (container) container.style.display = 'none';

    // Show action buttons
    document.querySelectorAll('.betting-controls .button:not(.cancel-btn):not(.confirm-btn)').forEach(btn => {
      btn.style.display = 'inline-block';
    });

    // Update available actions
    updateActionButtons(0); // Will automatically determine current bet
  }

  // Handler for room updates
  function handleRoomUpdate(roomInfo) {
    const playerList = document.getElementById('player-list');
    if (!playerList) return;

    playerList.innerHTML = '';

    roomInfo.players.forEach(player => {
      const isCurrentPlayer = player.id === socket.id;
      const item = document.createElement('li');

      item.innerHTML = `
          <span>${player.name}${isCurrentPlayer ? ' (You)' : ''}${player.isHost ? ' (Host)' : ''}</span>
          <span class="${player.ready ? 'player-ready' : 'player-not-ready'}">${player.ready ? 'Ready' : 'Not Ready'}</span>
        `;

      playerList.appendChild(item);
    });

    // Update ready button for current player
    const currentPlayer = roomInfo.players.find(p => p.id === socket.id);
    if (currentPlayer) {
      const readyBtn = document.getElementById('ready-btn');
      if (readyBtn) {
        readyBtn.textContent = currentPlayer.ready ? 'Not Ready' : 'Ready';
        readyBtn.classList.toggle('ready', currentPlayer.ready);
        readyBtn.classList.toggle('not-ready', !currentPlayer.ready);
      }
    }
  }

  // Init and setup
  function init() {
    initThinClient();
    setupUIEventListeners();
  }

  // Start when DOM is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();