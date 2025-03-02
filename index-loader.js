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
        } else {
          console.error("GAME object missing after all scripts loaded!");
        }
      }, 100);

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
