// Diagnostic script to test button functionality and fix initialization issues
console.log("Diagnostic script loaded");

// Make sure DOM is fully loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDiagnostic);
} else {
  // DOM already loaded, run now
  initDiagnostic();
}

function initDiagnostic() {
  console.log("Running diagnostic check...");

  // Check if GAME object exists
  if (!window.GAME) {
    console.error("GAME object missing!");
    return;
  }

  console.log("GAME object structure:", {
    hasUtils: !!window.GAME.utils,
    hasEngine: !!window.GAME.engine,
    hasState: !!window.GAME.state,
  });

  // Check start button
  const startButton = document.getElementById("start-button");
  if (!startButton) {
    console.error("Start button not found!");
    return;
  }

  console.log("Start button found:", startButton);

  // Check if initGame exists
  if (!window.GAME.engine || !window.GAME.engine.initGame) {
    console.error("initGame function missing!");
    // Fix: Create the missing function
    window.GAME.engine = window.GAME.engine || {};
    window.GAME.engine.initGame = function () {
      console.log("Emergency initGame function running");
      alert("Game initialized via emergency function!");
      // Add basic initialization here
    };
  }

  // Add a direct event listener to the start button
  startButton.addEventListener("click", function () {
    console.log("Start button clicked (diagnostic listener)");
    try {
      window.GAME.engine.initGame();
    } catch (e) {
      console.error("Error starting game:", e);
      alert("Error starting game: " + e.message);
    }
  });

  // Modify the button style to show it's been enhanced
  startButton.style.boxShadow = "0 0 10px green";
  console.log("Diagnostic check complete - start button enhanced");
}
