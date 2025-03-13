/*
 * pokermon-main.js
 * Main initialization and event listeners
 */

(function () {
  // Main game initialization flag
  let pokermonInitialized = false;
  initializeGame()
  /**
   * Main initialization function
   */
  function initializeGame() {
    console.log("PokerMon initializing...");

    // Clear any cards that might be left over from previous games
    clearAllCards();

    // Show start button
    const startButton = document.getElementById("start-button");
    if (startButton) {
      startButton.style.display = "block";
      console.log("Start button displayed");
    } else {
      console.error("Start button not found!");
    }

    // Hide any active messages
    if (window.GAME && window.GAME.utils) {
      window.GAME.utils.hideMessage();
    }

    // Set up all event handlers
    setupEventListeners();
    // Call these in your initializeGame function
    addMultiplayerUI();
    addMultiplayerStyles();
  }

  function addMultiplayerUI() {
    // Check if it already exists
    if (document.querySelector('.multiplayer-ui')) return;

    // Create the multiplayer UI
    const multiplayerUI = document.createElement('div');
    multiplayerUI.className = 'multiplayer-ui';
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
        
        <!-- Room code input for joining -->
        <div class="join-room-container">
          <div class="input-group">
            <label for="room-code-input">Room Code:</label>
            <input type="text" id="room-code-input" placeholder="Enter room code" maxlength="6">
          </div>
          <button id="join-with-code-btn" class="button">Join</button>
        </div>
      </div>
    `;

    document.body.appendChild(multiplayerUI);

    // Add event listeners
    document.getElementById('create-room-btn').addEventListener('click', () => {
      const name = document.getElementById('player-name').value || 'Player_' + Math.floor(Math.random() * 1000);
      window.ModeController.createRoom(name);
    });

    document.getElementById('join-with-code-btn').addEventListener('click', () => {
      const code = document.getElementById('room-code-input').value;
      const name = document.getElementById('player-name').value || 'Player_' + Math.floor(Math.random() * 1000);
      if (code) {
        window.ModeController.joinRoom(code, name);
      }
    });
  }

  function addMultiplayerStyles() {
    const style = document.createElement('style');
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
      
      /* Add more styles here */
    `;

    document.head.appendChild(style);
  }

  /**
   * Clears all cards from the UI
   */
  function clearAllCards() {
    // Clear player cards
    const playerIds = ["human", "ai1", "ai2", "ai3"];
    playerIds.forEach((id) => {
      const cardContainer = document.getElementById(`${id}-cards`);
      if (cardContainer) {
        cardContainer.innerHTML = "";
      }
    });

    // Clear power cards
    const powerCardContainer = document.getElementById("power-cards");
    if (powerCardContainer) {
      powerCardContainer.innerHTML = "";
    }
  }

  /**
   * Set up all UI event handlers
   */
  function setupEventListeners() {
    console.log("Setting up event listeners");

    // Start button
    setupStartButton();

    // Game control buttons
    setupGameControlButtons();

    // Poker action buttons
    setupPokerActionButtons();

    // Bet slider functionality
    setupBetSlider();

    // Utility buttons
    setupUtilityButtons();

    console.log("Event listeners setup complete");
  }

  /**
   * Setup the game start button
   */
  function setupStartButton() {
    const startButton = document.getElementById("start-button");
    if (startButton) {
      startButton.onclick = function () {
        console.log("Start button clicked");

        // Prevent multiple initializations
        if (pokermonInitialized) {
          console.log("Game already initialized, ignoring duplicate click");
          return;
        }

        pokermonInitialized = true;

        if (window.GAME && window.GAME.engine && window.GAME.engine.initGame) {
          window.GAME.engine.initGame();
        } else {
          console.error("GAME.engine.initGame not available!");
          alert(
            "Game initialization failed - the engine is not properly loaded"
          );
        }
      };
    }
  }

  /**
   * Setup game control buttons (restart, continue)
   */
  function setupGameControlButtons() {
    // Restart button
    const restartButton = document.getElementById("restart-button");
    if (restartButton) {
      restartButton.onclick = function () {
        console.log("Restart button clicked");
        if (window.GAME && window.GAME.engine) {
          window.GAME.engine.resetRound();
        }
      };
    }

    // Continue button in winner overlay
    const continueButton = document.getElementById("continue-button");
    if (continueButton) {
      continueButton.onclick = function () {
        const overlay = document.getElementById("winner-overlay");
        if (overlay) {
          overlay.classList.remove("visible");
        }
        if (window.GAME && window.GAME.engine) {
          window.GAME.engine.resetRound();
        }
      };
    }
  }

  /**
   * Setup poker action buttons (check, call, bet, raise, fold, all-in)
   */
  function setupPokerActionButtons() {
    // Simple action buttons (check, call, fold, all-in)
    setupSimpleActionButton("check", "Check");
    setupSimpleActionButton("call", "Call");
    setupSimpleActionButton("fold", "Fold");
    setupSimpleActionButton("all-in", "All-In");

    // Bet button - requires slider interaction
    const betButton = document.getElementById("bet-button");
    if (betButton) {
      betButton.onclick = function () {
        console.log("Bet button clicked");
        showBetControls("Bet");
      };
    }

    // Raise button - requires slider interaction
    const raiseButton = document.getElementById("raise-button");
    if (raiseButton) {
      raiseButton.onclick = function () {
        console.log("Raise button clicked");
        showBetControls("Raise");
      };
    }
  }

  /**
   * Helper function to set up a simple poker action button
   * @param {string} action - The action name in lowercase
   * @param {string} capitalizedAction - The action name with first letter capitalized
   */
  function setupSimpleActionButton(action, capitalizedAction) {
    const button = document.getElementById(`${action}-button`);
    if (button) {
      button.onclick = function () {
        console.log(`${action} button clicked`);
        if (window.GAME && window.GAME.engine) {
          window.GAME.engine.processHumanAction(capitalizedAction);
        }
      };
    }
  }

  /**
   * Set up the bet slider and associated buttons
   */
  function setupBetSlider() {
    // Bet slider
    const betSlider = document.getElementById("bet-slider");
    if (betSlider) {
      betSlider.oninput = function (e) {
        // Ensure round numbers for bets
        const roundValue = Math.floor(e.target.value);
        document.getElementById("bet-amount-display").textContent =
          "$" + roundValue;
      };
    }

    // Confirm bet button
    const confirmBetButton = document.getElementById("confirm-bet-button");
    if (confirmBetButton) {
      confirmBetButton.onclick = function () {
        const betAmount = parseInt(document.getElementById("bet-slider").value);
        let action = "Bet";

        // Determine if it's a bet or raise based on current state
        if (window.GAME && window.GAME.state.currentBet > 0) {
          action = "Raise";
        }

        // Hide bet controls and show regular action buttons
        hideBetControls();

        // Process the bet/raise
        if (window.GAME && window.GAME.engine) {
          window.GAME.engine.processHumanAction(action, betAmount);
        }
      };
    }

    // Cancel bet button
    const cancelBetButton = document.getElementById("cancel-bet-button");
    if (cancelBetButton) {
      cancelBetButton.onclick = function () {
        hideBetControls();

        // Update buttons state
        if (window.GAME && window.GAME.engine) {
          window.GAME.engine.updateActionButtons();
        }
      };
    }
  }

  /**
   * Setup utility buttons like the clear log button
   */
  function setupUtilityButtons() {
    // Clear log button
    const clearLogButton = document.getElementById("clear-log");
    if (clearLogButton) {
      clearLogButton.onclick = function () {
        const gameLog = document.getElementById("game-log");
        if (gameLog) {
          gameLog.innerHTML = "";
        }
      };
    }
  }

  /**
   * Show bet slider controls for bet/raise actions
   * @param {string} actionType - Either "Bet" or "Raise"
   */
  function showBetControls(actionType) {
    const betSlider = document.getElementById("bet-slider");
    const betAmountDisplay = document.getElementById("bet-amount-display");
    const human = window.GAME
      ? window.GAME.state.players.find((p) => p.isHuman)
      : null;

    if (!betSlider || !betAmountDisplay || !human) {
      console.error("Missing required elements for bet action");
      return;
    }

    // Set min/max/value based on action type
    if (actionType === "Bet") {
      // For a bet, minimum is the big blind
      const minBet = window.GAME.BIG_BLIND;
      betSlider.min = minBet;
      betSlider.max = human.stack;
      betSlider.value = Math.min(minBet * 2, human.stack);
    } else if (actionType === "Raise") {
      // For a raise, minimum is current bet plus min raise
      const minRaise =
        window.GAME.state.currentBet +
        (window.GAME.state.minRaise || window.GAME.BIG_BLIND);
      betSlider.min = minRaise;
      betSlider.max = human.stack + human.bet;
      betSlider.value = Math.min(minRaise * 2, human.stack + human.bet);
    }

    // Update display
    betAmountDisplay.textContent = "$" + betSlider.value;

    // Hide action buttons, show bet controls
    document.getElementById("bet-slider-container").style.display = "block";

    // Hide all action buttons
    const actionButtons = ["check", "call", "bet", "raise", "fold", "all-in"];
    actionButtons.forEach((btn) => {
      document.getElementById(`${btn}-button`).style.display = "none";
    });
  }

  /**
   * Hide bet slider controls and show action buttons
   */
  function hideBetControls() {
    // Hide bet slider
    document.getElementById("bet-slider-container").style.display = "none";

    // Show all action buttons
    const actionButtons = ["check", "call", "bet", "raise", "fold", "all-in"];
    actionButtons.forEach((btn) => {
      document.getElementById(`${btn}-button`).style.display = "inline-block";
    });
  }

  // Export initialization flag for external access
  window.pokermonInitialized = pokermonInitialized;
})();
