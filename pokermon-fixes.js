/*
 * pokermon-fixes.js
 * Critical fixes for PokerMon game
 * Add this script at the end of index.html
 */

// Wait for all scripts to load
window.addEventListener("load", function () {
  // Allow time for all scripts to initialize
  setTimeout(applyGameFixes, 1000);
});

// Apply all necessary fixes to the game
function applyGameFixes() {
  console.log("Applying critical game fixes");

  // Fix all button handlers
  fixButtonHandlers();

  // Monitor for active human player and ensure controls are visible
  setInterval(checkHumanTurn, 1000);

  console.log("Game fixes applied");
}

// Fix all button handlers
function fixButtonHandlers() {
  // Fix bet button to show slider
  const betButton = document.getElementById("bet-button");
  if (betButton) {
    betButton.onclick = function () {
      console.log("Bet button clicked - fixed handler");
      const betSlider = document.getElementById("bet-slider");
      const betAmountDisplay = document.getElementById("bet-amount-display");
      const human = window.GAME.state.players.find((p) => p.isHuman);

      // Set min to Big Blind
      const minBet = window.GAME.BIG_BLIND;
      betSlider.min = minBet;
      betSlider.max = human.stack;
      betSlider.value = Math.min(minBet * 2, human.stack);
      betAmountDisplay.textContent = "$" + betSlider.value;

      // Show slider
      document.getElementById("bet-slider-container").style.display = "block";

      // Hide buttons
      document.getElementById("check-button").style.display = "none";
      document.getElementById("call-button").style.display = "none";
      document.getElementById("bet-button").style.display = "none";
      document.getElementById("raise-button").style.display = "none";
      document.getElementById("fold-button").style.display = "none";
      document.getElementById("all-in-button").style.display = "none";
    };
  }

  // Fix raise button to show slider with proper values
  const raiseButton = document.getElementById("raise-button");
  if (raiseButton) {
    raiseButton.onclick = function () {
      console.log("Raise button clicked - fixed handler");
      const betSlider = document.getElementById("bet-slider");
      const betAmountDisplay = document.getElementById("bet-amount-display");
      const human = window.GAME.state.players.find((p) => p.isHuman);

      // Calculate minimum raise
      const minRaise = window.GAME.state.currentBet + window.GAME.BIG_BLIND;

      // Set slider values
      betSlider.min = minRaise;
      betSlider.max = human.stack + human.bet;
      betSlider.value = Math.min(
        minRaise + window.GAME.BIG_BLIND,
        human.stack + human.bet
      );
      betAmountDisplay.textContent = "$" + betSlider.value;

      // Show slider
      document.getElementById("bet-slider-container").style.display = "block";

      // Hide buttons
      document.getElementById("check-button").style.display = "none";
      document.getElementById("call-button").style.display = "none";
      document.getElementById("bet-button").style.display = "none";
      document.getElementById("raise-button").style.display = "none";
      document.getElementById("fold-button").style.display = "none";
      document.getElementById("all-in-button").style.display = "none";
    };
  }

  // Fix slider to update the displayed amount
  const betSlider = document.getElementById("bet-slider");
  if (betSlider) {
    betSlider.oninput = function () {
      console.log("Slider moved to: " + this.value);
      document.getElementById("bet-amount-display").textContent =
        "$" + this.value;
    };
  }

  // Fix continue button to restart game properly
  const continueButton = document.getElementById("continue-button");
  if (continueButton) {
    continueButton.onclick = function () {
      console.log("Continue button clicked - fixed handler");
      // Hide winner overlay
      document.getElementById("winner-overlay").classList.remove("visible");

      // Reset for a new round
      if (window.GAME && window.GAME.engine) {
        window.GAME.engine.resetRound();
      }
    };
  }

  // Also fix restart button as backup
  const restartButton = document.getElementById("restart-button");
  if (restartButton) {
    restartButton.onclick = function () {
      console.log("Restart button clicked - fixed handler");
      if (window.GAME && window.GAME.engine) {
        window.GAME.engine.resetRound();
      }
    };
  }

  // Fix confirm bet button
  const confirmBetButton = document.getElementById("confirm-bet-button");
  if (confirmBetButton) {
    confirmBetButton.onclick = function () {
      console.log("Confirm bet button clicked - fixed handler");
      const betAmount = parseInt(document.getElementById("bet-slider").value);

      // Determine action based on current state
      let action = "Bet";
      if (window.GAME.state.currentBet > 0) {
        action = "Raise";
      }

      // Hide slider, show buttons
      document.getElementById("bet-slider-container").style.display = "none";
      document.getElementById("check-button").style.display = "inline-block";
      document.getElementById("call-button").style.display = "inline-block";
      document.getElementById("bet-button").style.display = "inline-block";
      document.getElementById("raise-button").style.display = "inline-block";
      document.getElementById("fold-button").style.display = "inline-block";
      document.getElementById("all-in-button").style.display = "inline-block";

      // Process bet
      window.GAME.engine.processHumanAction(action, betAmount);
    };
  }
}

// Check if it's the human player's turn and ensure controls are visible
function checkHumanTurn() {
  if (!window.GAME || !window.GAME.state) return;

  const humanIndex = window.GAME.state.players.findIndex((p) => p.isHuman);

  // If it's the human's turn, make sure controls are visible
  if (window.GAME.state.activePlayerIndex === humanIndex) {
    const controls = document.getElementById("betting-controls");
    if (controls && !controls.classList.contains("visible")) {
      console.log("Forcing betting controls visible during human turn");
      controls.classList.add("visible");

      // Update available actions
      if (window.GAME.engine && window.GAME.engine.updateActionButtons) {
        window.GAME.engine.updateActionButtons();
      }
    }
  }
}