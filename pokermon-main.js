/*
 * pokermon-main.js
 * Main initialization and event listeners
 */
console.log("pokermon-main.js loaded");

// When page loads
document.addEventListener("DOMContentLoaded", () => {
  console.log("PokerMon initializing in main.js...");

  // Clear any cards that might be left over from previous games
  clearAllCards();

  // Display start button
  const startButton = document.getElementById("start-button");
  if (startButton) {
    startButton.style.display = "block";
    console.log("Start button displayed");
  } else {
    console.error("Start button not found!");
  }

  // Hide message if it exists
  if (window.GAME && window.GAME.utils) {
    window.GAME.utils.hideMessage();
  } else {
    console.error("GAME.utils not available!");
  }

  // Set up event handlers
  setupEventListeners();
});

// Helper function to clear all cards
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

// Function to check and repair button handlers
function repairButtonHandlers() {
  console.log("Running automatic button handler repair");

  // Fix action buttons
  ["check", "call", "bet", "raise", "fold", "all-in"].forEach((action) => {
    const button = document.getElementById(`${action}-button`);
    if (button) {
      button.onclick = function () {
        console.log(`${action} clicked`);
        if (window.GAME && window.GAME.engine) {
          const capitalizedAction =
            action.charAt(0).toUpperCase() + action.slice(1);
          window.GAME.engine.processHumanAction(capitalizedAction);
        }
      };
      console.log(`Fixed ${action} button`);
    }
  });

  // Fix bet slider buttons
  const confirmBetButton = document.getElementById("confirm-bet-button");
  if (confirmBetButton) {
    confirmBetButton.onclick = function () {
      const betAmount = parseInt(document.getElementById("bet-slider").value);
      // Determine action based on current state
      let action = "Bet";
      if (window.GAME && window.GAME.state.currentBet > 0) {
        action = "Raise";
      }

      // Reset display
      document.getElementById("bet-slider-container").style.display = "none";
      document.getElementById("check-button").style.display = "inline-block";
      document.getElementById("call-button").style.display = "inline-block";
      document.getElementById("bet-button").style.display = "inline-block";
      document.getElementById("raise-button").style.display = "inline-block";
      document.getElementById("fold-button").style.display = "inline-block";
      document.getElementById("all-in-button").style.display = "inline-block";

      // Process the bet/raise
      if (window.GAME && window.GAME.engine) {
        window.GAME.engine.processHumanAction(action, betAmount);
      }
    };
    console.log("Fixed confirm bet button");
  }

  const cancelBetButton = document.getElementById("cancel-bet-button");
  if (cancelBetButton) {
    cancelBetButton.onclick = function () {
      // Hide bet slider
      document.getElementById("bet-slider-container").style.display = "none";

      // Show action buttons
      document.getElementById("check-button").style.display = "inline-block";
      document.getElementById("call-button").style.display = "inline-block";
      document.getElementById("bet-button").style.display = "inline-block";
      document.getElementById("raise-button").style.display = "inline-block";
      document.getElementById("fold-button").style.display = "inline-block";
      document.getElementById("all-in-button").style.display = "inline-block";

      // Update buttons
      if (window.GAME && window.GAME.engine) {
        window.GAME.engine.updateActionButtons();
      }
    };
    console.log("Fixed cancel bet button");
  }

  console.log("Button repair complete");
}

// Set up all event listeners
function setupEventListeners() {
  console.log("Setting up event listeners");

  // Start button
  const startButton = document.getElementById("start-button");
  if (startButton) {
    console.log("Adding click listener to Start button");
    startButton.onclick = function () {
      console.log("Start button clicked");

      // Prevent multiple initializations
      if (window.pokermonInitialized) {
        console.log("Game already initialized, ignoring duplicate click");
        return;
      }

      window.pokermonInitialized = true;

      if (window.GAME && window.GAME.engine && window.GAME.engine.initGame) {
        window.GAME.engine.initGame();
      } else {
        console.error("GAME.engine.initGame not available!", window.GAME);
        alert("Game initialization failed - the engine is not properly loaded");
      }
    };
  }

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

  // Check button
  const checkButton = document.getElementById("check-button");
  if (checkButton) {
    checkButton.onclick = function () {
      console.log("Check button clicked");
      if (window.GAME && window.GAME.engine) {
        window.GAME.engine.processHumanAction("Check");
      }
    };
  }

  // Call button
  const callButton = document.getElementById("call-button");
  if (callButton) {
    callButton.onclick = function () {
      console.log("Call button clicked");
      if (window.GAME && window.GAME.engine) {
        window.GAME.engine.processHumanAction("Call");
      }
    };
  }

  // Bet button
  const betButton = document.getElementById("bet-button");
  if (betButton) {
    betButton.onclick = function () {
      console.log("Bet button clicked");
      const betSlider = document.getElementById("bet-slider");
      const betAmountDisplay = document.getElementById("bet-amount-display");
      const human = window.GAME
        ? window.GAME.state.players.find((p) => p.isHuman)
        : null;

      if (!betSlider || !betAmountDisplay || !human) {
        console.error("Missing required elements for bet action");
        return;
      }

      // Set min to Big Blind instead of half pot
      const minBet = window.GAME.BIG_BLIND;
      betSlider.min = minBet;
      betSlider.max = human.stack;
      betSlider.value = Math.min(minBet * 2, human.stack);

      // Update display
      betAmountDisplay.textContent = "$" + betSlider.value;

      // Show bet controls
      document.getElementById("bet-slider-container").style.display = "block";

      // Hide action buttons
      document.getElementById("check-button").style.display = "none";
      document.getElementById("call-button").style.display = "none";
      document.getElementById("bet-button").style.display = "none";
      document.getElementById("raise-button").style.display = "none";
      document.getElementById("fold-button").style.display = "none";
      document.getElementById("all-in-button").style.display = "none";
    };
  }

  // Raise button
  const raiseButton = document.getElementById("raise-button");
  if (raiseButton) {
    raiseButton.onclick = function () {
      console.log("Raise button clicked");
      const betSlider = document.getElementById("bet-slider");
      const betAmountDisplay = document.getElementById("bet-amount-display");
      const human = window.GAME
        ? window.GAME.state.players.find((p) => p.isHuman)
        : null;

      if (!betSlider || !betAmountDisplay || !human) {
        console.error("Missing required elements for raise action");
        return;
      }

      // Correctly calculate minimum raise - current bet plus big blind
      const minRaise = window.GAME.state.currentBet + window.GAME.BIG_BLIND;

      // Set min/max/value
      betSlider.min = minRaise;
      betSlider.max = human.stack + human.bet;
      betSlider.value = Math.min(minRaise * 2, human.stack + human.bet);

      // Update display
      betAmountDisplay.textContent = "$" + betSlider.value;

      // Show bet controls
      document.getElementById("bet-slider-container").style.display = "block";

      // Hide action buttons
      document.getElementById("check-button").style.display = "none";
      document.getElementById("call-button").style.display = "none";
      document.getElementById("bet-button").style.display = "none";
      document.getElementById("raise-button").style.display = "none";
      document.getElementById("fold-button").style.display = "none";
      document.getElementById("all-in-button").style.display = "none";
    };
  }

  // Fold button
  const foldButton = document.getElementById("fold-button");
  if (foldButton) {
    foldButton.onclick = function () {
      console.log("Fold button clicked");
      if (window.GAME && window.GAME.engine) {
        window.GAME.engine.processHumanAction("Fold");
      }
    };
  }

  // All-in button
  const allInButton = document.getElementById("all-in-button");
  if (allInButton) {
    allInButton.onclick = function () {
      console.log("All-in button clicked");
      if (window.GAME && window.GAME.engine) {
        window.GAME.engine.processHumanAction("All-In");
      }
    };
  }

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
      console.log("Confirm bet button clicked");
      const betAmount = parseInt(document.getElementById("bet-slider").value);
      const human = window.GAME
        ? window.GAME.state.players.find((p) => p.isHuman)
        : null;

      // Determine action based on current state
      let action = "Bet";
      if (window.GAME.state.currentBet > 0) {
        action = "Raise";
      }

      // Reset display
      document.getElementById("bet-slider-container").style.display = "none";
      document.getElementById("check-button").style.display = "inline-block";
      document.getElementById("call-button").style.display = "inline-block";
      document.getElementById("bet-button").style.display = "inline-block";
      document.getElementById("raise-button").style.display = "inline-block";
      document.getElementById("fold-button").style.display = "inline-block";
      document.getElementById("all-in-button").style.display = "inline-block";

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
      console.log("Cancel bet button clicked");
      // Hide bet slider
      document.getElementById("bet-slider-container").style.display = "none";

      // Show action buttons
      document.getElementById("check-button").style.display = "inline-block";
      document.getElementById("call-button").style.display = "inline-block";
      document.getElementById("bet-button").style.display = "inline-block";
      document.getElementById("raise-button").style.display = "inline-block";
      document.getElementById("fold-button").style.display = "inline-block";
      document.getElementById("all-in-button").style.display = "inline-block";

      // Update buttons
      if (window.GAME && window.GAME.engine) {
        window.GAME.engine.updateActionButtons();
      }
    };
  }

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

  console.log("Event listeners setup complete");

  // Add automatic button repair after a short delay
  setTimeout(repairButtonHandlers, 1000);
}

// Prevent multiple initializations from window.load
window.addEventListener("load", function () {
  console.log("Window load event - checking start button again");

  // Fix buttons after load
  setTimeout(repairButtonHandlers, 1000);

  const startButton = document.getElementById("start-button");
  if (startButton) {
    startButton.addEventListener(
      "click",
      function (e) {
        console.log("Start button clicked via window.load handler");

        // Prevent double initialization and default behavior
        if (window.pokermonInitialized) {
          console.log(
            "Game already initialized via window.load, ignoring click"
          );
          e.preventDefault();
          e.stopPropagation();
          return false;
        }

        window.pokermonInitialized = true;

        if (window.GAME && window.GAME.engine && window.GAME.engine.initGame) {
          window.GAME.engine.initGame();
        }
      },
      true
    );
  }
});
