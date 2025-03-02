// Enhanced script loader for PokerMon with better error handling
console.log("Enhanced loader script running");

// Flag to prevent multiple initializations
window.pokermonInitialized = false;

// Make sure we're fully loaded before continuing
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLoader);
} else {
  // DOM already loaded, run now
  initLoader();
}

function initLoader() {
  console.log("DOM loaded, starting enhanced script loader");

  const scripts = [
    "pokermon-core.js",
    "pokermon-utils.js",
    "pokermon-engine.js",
    "pokermon-main.js",
    "diagnostic-fix.js", // Add diagnostic script
    "pokermon-fixes.js",
  ];

  // Keep track of loaded scripts to prevent double loading
  const loadedScripts = new Set();

  function loadScript(index) {
    if (index >= scripts.length) {
      console.log("All scripts loaded successfully");

      // Extra check to directly verify GAME object
      setTimeout(function () {
        if (window.GAME) {
          console.log("GAME object verified after all scripts loaded:", {
            hasElements: !!window.GAME.ELEMENTS,
            hasUtils: !!window.GAME.utils,
            hasEngine: !!window.GAME.engine,
            hasState: !!window.GAME.state,
          });

          // Fix button handlers after all scripts are loaded
          if (typeof repairButtonHandlers === "function") {
            console.log("Running button repair from loader");
            repairButtonHandlers();
          }
        } else {
          console.error("GAME object missing after all scripts loaded!");
        }
      }, 500);

      return;
    }

    // Skip already loaded scripts
    if (loadedScripts.has(scripts[index])) {
      console.log(`Script already loaded: ${scripts[index]}, skipping`);
      loadScript(index + 1);
      return;
    }

    console.log(`Attempting to load: ${scripts[index]}`);
    const script = document.createElement("script");
    script.src = scripts[index];

    script.onload = function () {
      console.log(`Successfully loaded: ${scripts[index]}`);
      loadedScripts.add(scripts[index]);

      // Verify GAME object availability after core is loaded
      if (scripts[index] === "pokermon-core.js" && !window.GAME) {
        console.error("GAME object not created by core.js!");
      }

      // Continue loading next script
      loadScript(index + 1);
    };

    script.onerror = function (e) {
      console.error(`Failed to load: ${scripts[index]}`, e);
      alert(`Error loading ${scripts[index]} - check console for details`);
    };

    document.body.appendChild(script);
  }

  // Add direct event listener to the start button as a safety measure
  const startButton = document.getElementById("start-button");
  if (startButton) {
    console.log("Adding emergency click handler to start button");

    startButton.onclick = function () {
      console.log("Start button clicked (emergency handler)");

      if (window.pokermonInitialized) {
        console.log("Game already initialized, ignoring duplicate click");
        return;
      }

      window.pokermonInitialized = true;

      if (window.GAME && window.GAME.engine && window.GAME.engine.initGame) {
        window.GAME.engine.initGame();
      } else {
        console.error(
          "Cannot start game - GAME.engine.initGame not available!"
        );
        alert("Game initialization failed. Check console for details.");
      }
    };
  } else {
    console.warn("Start button not found yet in loader");
  }

  // Start loading scripts
  loadScript(0);
}

// Add this safety function for button repair
// Will be called by the loader and available in the global scope
function repairButtonHandlers() {
  console.log("Running emergency button handler repair");

  // Fix action buttons
  ["check", "call", "bet", "raise", "fold", "all-in"].forEach((action) => {
    const button = document.getElementById(`${action}-button`);
    if (button) {
      button.onclick = function () {
        console.log(`${action} clicked from emergency handler`);
        if (window.GAME && window.GAME.engine) {
          const capitalizedAction =
            action.charAt(0).toUpperCase() + action.slice(1);
          window.GAME.engine.processHumanAction(capitalizedAction);
        }
      };
    }
  });

  // Fix bet button specifically to show slider
  const betButton = document.getElementById("bet-button");
  if (betButton) {
    betButton.onclick = function () {
      const betSlider = document.getElementById("bet-slider");
      const betAmountDisplay = document.getElementById("bet-amount-display");
      const human = window.GAME.state.players.find((p) => p.isHuman);

      // Set minimum bet to BIG_BLIND (10)
      betSlider.min = window.GAME.BIG_BLIND;
      betSlider.max = human.stack;
      betSlider.value = Math.min(window.GAME.BIG_BLIND * 2, human.stack);
      betAmountDisplay.textContent = "$" + betSlider.value;

      // Show slider, hide buttons
      document.getElementById("bet-slider-container").style.display = "block";
      document.getElementById("check-button").style.display = "none";
      document.getElementById("call-button").style.display = "none";
      document.getElementById("bet-button").style.display = "none";
      document.getElementById("raise-button").style.display = "none";
      document.getElementById("fold-button").style.display = "none";
      document.getElementById("all-in-button").style.display = "none";
    };
  }

  // Fix slider buttons
  const confirmBetButton = document.getElementById("confirm-bet-button");
  if (confirmBetButton) {
    confirmBetButton.onclick = function () {
      const betAmount = parseInt(document.getElementById("bet-slider").value);
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

  const cancelBetButton = document.getElementById("cancel-bet-button");
  if (cancelBetButton) {
    cancelBetButton.onclick = function () {
      // Hide slider, show buttons
      document.getElementById("bet-slider-container").style.display = "none";
      document.getElementById("check-button").style.display = "inline-block";
      document.getElementById("call-button").style.display = "inline-block";
      document.getElementById("bet-button").style.display = "inline-block";
      document.getElementById("raise-button").style.display = "inline-block";
      document.getElementById("fold-button").style.display = "inline-block";
      document.getElementById("all-in-button").style.display = "inline-block";

      if (window.GAME && window.GAME.engine) {
        window.GAME.engine.updateActionButtons();
      }
    };
  }

  console.log("Emergency button repair complete");
}
