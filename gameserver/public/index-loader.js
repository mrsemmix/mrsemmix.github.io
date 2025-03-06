// Enhanced script loader for PokerMon with better error handling
console.log("Enhanced loader script running for thin client");

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
  console.log("DOM loaded, starting thin client loader");

  // Only load core and utils, not engine or main
  const scripts = [
    "pokermon-core.js",    // Load this for constants and state structure
    "pokermon-utils.js",   // Load this for utility functions
    // "pokermon-engine.js", // Don't load this - contains game logic
    // "pokermon-main.js",   // Don't load this - contains game initialization
  ];

  // Keep track of loaded scripts to prevent double loading
  const loadedScripts = new Set();

  function loadScript(index) {
    if (index >= scripts.length) {
      console.log("Core scripts loaded, loading thin client...");

      // After core scripts, load the thin client
      const thinClientScript = document.createElement("script");
      thinClientScript.src = "pokermon-thin-client.js";

      thinClientScript.onload = function () {
        console.log("Thin client loaded successfully");

        // Create empty game engine object to prevent errors
        if (window.GAME && !window.GAME.engine) {
          window.GAME.engine = {
            renderHands: function () { console.log("Placeholder renderHands called"); },
            renderPowerCards: function () { console.log("Placeholder renderPowerCards called"); }
          };
        }
      };

      thinClientScript.onerror = function (e) {
        console.error("Failed to load thin client:", e);
        alert("Error loading thin client - check console for details");
      };

      document.body.appendChild(thinClientScript);
      return;
    }

    // Skip already loaded scripts
    if (loadedScripts.has(scripts[index])) {
      console.log(`Script already loaded: ${scripts[index]}, skipping`);
      loadScript(index + 1);
      return;
    }

    console.log(`Loading: ${scripts[index]}`);
    const script = document.createElement("script");
    script.src = scripts[index];

    script.onload = function () {
      console.log(`Successfully loaded: ${scripts[index]}`);
      loadedScripts.add(scripts[index]);

      // Continue loading next script
      loadScript(index + 1);
    };

    script.onerror = function (e) {
      console.error(`Failed to load: ${scripts[index]}`, e);
      alert(`Error loading ${scripts[index]} - check console for details`);
    };

    document.body.appendChild(script);
  }

  // Start loading scripts
  loadScript(0);
}