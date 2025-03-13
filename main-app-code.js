/**
 * pokermon-app.js
 * Main application entry point that initializes all components
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('PokerMon initializing...');
  
  // Create mode controller
  const modeController = new ModeController();
  
  // Create UI controller
  const uiController = new UIController(modeController);
  
  // Initialize UI first (creates and caches DOM elements)
  uiController.init();
  
  // Then initialize mode controller with UI elements
  modeController.init(uiController.elements);
  
  // Check URL parameters to determine initial mode
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  const room = urlParams.get('room');
  
  if (mode === 'online') {
    // Start in online mode if requested
    modeController.switchMode('online');
    
    // If room parameter is provided, attempt to join
    if (room) {
      // Allow some time for socket connection
      setTimeout(() => {
        const playerNameInput = document.getElementById('player-name');
        if (playerNameInput) {
          // Set a default name if input is empty
          if (!playerNameInput.value.trim()) {
            playerNameInput.value = `Player_${Math.floor(Math.random() * 1000)}`;
          }
          
          // Try to join the specified room
          modeController.joinRoom(room, playerNameInput.value);
        }
      }, 1000);
    }
  } else {
    // Default to offline mode
    modeController.switchMode('offline');
  }
  
  // Expose global objects for debugging (remove in production)
  window.appDebug = {
    modeController,
    uiController
  };
  
  console.log('PokerMon initialization complete');
});

/**
 * Share game button - creates a shareable link for multiplayer
 */
function shareGame() {
  if (!window.appDebug || !window.appDebug.modeController || !window.appDebug.modeController.roomCode) {
    alert('Cannot share: no active multiplayer game');
    return;
  }
  
  // Create URL with room code
  const url = new URL(window.location.href);
  url.searchParams.set('mode', 'online');
  url.searchParams.set('room', window.appDebug.modeController.roomCode);
  
  // Copy to clipboard
  navigator.clipboard.writeText(url.toString()).then(() => {
    alert('Shareable link copied to clipboard!');
  }).catch(err => {
    console.error('Failed to copy link:', err);
    alert('Share link: ' + url.toString());
  });
}

// Add share button if not already added
function addShareButton() {
  if (document.getElementById('share-game-btn')) return;
  
  const shareBtn = document.createElement('button');
  shareBtn.id = 'share-game-btn';
  shareBtn.className = 'button share-btn';
  shareBtn.innerHTML = '<i class="fas fa-share-alt"></i> Share Game';
  shareBtn.onclick = shareGame;
  
  // Add to multiplayer HUD if it exists
  const multiplayerHud = document.querySelector('.multiplayer-hud');
  if (multiplayerHud) {
    multiplayerHud.appendChild(shareBtn);
  } else {
    // Otherwise add to controls container
    const controlsContainer = document.querySelector('.controls-container');
    if (controlsContainer) {
      controlsContainer.appendChild(shareBtn);
    }
  }
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .share-btn {
      background: rgba(33, 150, 243, 0.6);
      margin-left: 10px;
    }
    .share-btn:hover {
      background: rgba(33, 150, 243, 0.8);
    }
  `;
  document.head.appendChild(style);
}

// Add share button when game starts
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(addShareButton, 2000);
});
