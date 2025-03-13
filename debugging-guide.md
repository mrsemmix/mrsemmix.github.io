# PokerMon Testing and Debugging Guide

## Introduction

This guide outlines strategies for testing and debugging the PokerMon game implementation. Given the complex nature of the game with both offline and online modes, a structured approach to testing is essential.

## Test Environment Setup

### Local Development Testing

1. **Setup local server:**
   ```bash
   npm install
   node server/server.js
   ```

2. **Access the game:**
   - Open `http://localhost:3000` in your browser
   - For offline mode: Use default URL
   - For online mode: Add `?mode=online` parameter

3. **Browser testing:**
   - Use Chrome DevTools for debugging
   - Enable "Preserve log" option to see network activity
   - Use multiple browser windows for multiplayer testing

## Test Categories

### 1. Unit Testing Game Logic

Test individual game mechanics in isolation:

- **Card Dealing:** Verify cards are dealt properly and unique
- **Betting Logic:** Test all betting scenarios (check, call, bet, raise, fold, all-in)
- **Element Bonuses:** Verify correct calculation of card values with arena and power cards
- **Game Stages:** Test proper progression through all game stages
- **Hand Evaluation:** Verify correct winner determination

### 2. AI Testing

Verify AI behavior:

- **Decision Making:** Test AI decisions in various game scenarios
- **Strategy Variation:** Verify different AI personalities make different decisions
- **Response to Player Actions:** Test AI responses to player betting patterns
- **Element Preferences:** Verify AI considers element bonuses in decisions

### 3. UI Testing

Verify all UI components:

- **Card Rendering:** Test correct display of monster and power cards
- **Player Information:** Verify stack sizes, bets, and position indicators
- **Game Stage Indicators:** Test stage progression visualization
- **Action Buttons:** Verify availability of appropriate actions
- **Animations:** Test deal animations and action indicators

### 4. Multiplayer Testing

Test online mode functionality:

- **Room Creation:** Verify creating and joining rooms
- **Player Synchronization:** Test player ready status and game start
- **State Synchronization:** Verify all players see the same game state
- **Action Broadcasting:** Test actions properly broadcast to all players
- **Disconnection Handling:** Test how the game handles player disconnects

## Debugging Techniques

### Console Logging

Add strategic console logs with clear context:

```javascript
console.log(`[GameManager] Processing action: ${action.type} from ${playerId}`);
```

Use the debug objects exposed in `pokermon-app.js`:

```javascript
console.log(window.appDebug.modeController.gameManager.state);
```

### Socket.io Debugging

For multiplayer issues:

1. Enable Socket.io debugging by adding to the URL:
   `?debug=socket.io`

2. Add server-side logging:
   ```javascript
   io.on('connection', (socket) => {
     console.log(`[${new Date().toISOString()}] Socket connected: ${socket.id}`);
   });
   ```

### Game State Inspection

Add a debug panel to inspect game state:

```javascript
function addDebugPanel() {
  const debugPanel = document.createElement('div');
  debugPanel.id = 'debug-panel';
  debugPanel.style = 'position:fixed;bottom:0;right:0;background:rgba(0,0,0,0.8);color:white;padding:10px;max-height:300px;overflow:auto;';
  
  const updateBtn = document.createElement('button');
  updateBtn.innerText = 'Update';
  updateBtn.onclick = () => {
    debugPanel.innerHTML = '<pre>' + 
      JSON.stringify(window.appDebug.modeController.gameManager.state, null, 2) + 
      '</pre>';
  };
  
  debugPanel.appendChild(updateBtn);
  document.body.appendChild(debugPanel);
}
```

### Common Issues and Solutions

#### Client-Side Issues

1. **Cards not rendering properly:**
   - Check if card objects have all required properties
   - Verify CSS classes are applied correctly

2. **Action buttons unavailable:**
   - Check current game state to see if action should be valid
   - Verify player turn is correct

3. **AI not making decisions:**
   - Check console for errors
   - Verify game state progression is working

#### Server-Side Issues

1. **Socket connections failing:**
   - Check CORS settings
   - Verify socket server is running
   - Check for network blocking issues

2. **Game state inconsistency:**
   - Add logging for state broadcasts
   - Compare client and server states
   - Check for race conditions

3. **Room management issues:**
   - Log room creation and joining events
   - Verify player IDs are consistent

## Test Scenarios

### Offline Mode Testing

1. **Basic Game Flow:**
   - Start game
   - Play through all stages
   - Verify winner determination

2. **Edge Case Betting:**
   - Test minimum bet enforcement
   - Test all-in scenarios
   - Test side pot creation

3. **Element Interactions:**
   - Verify arena bonuses
   - Test power card effects

### Online Mode Testing

1. **Room Management:**
   - Create room
   - Join with multiple players
   - Handle player ready states

2. **Game Synchronization:**
   - Verify all players see the same cards and actions
   - Test turn progression
   - Verify hand resolution

3. **Error Recovery:**
   - Test disconnection handling
   - Test rejoining a room
   - Test server restart scenarios

## Bug Reporting Template

When reporting bugs, include:

1. **Environment:**
   - Browser type and version
   - Device information
   - Game mode (offline/online)

2. **Steps to Reproduce:**
   - Clear list of actions to reproduce the issue
   - Game state information if available

3. **Expected vs. Actual Behavior:**
   - What should have happened
   - What actually happened

4. **Console Errors:**
   - Any error messages from browser console

5. **Screenshots/Videos:**
   - Visual evidence of the issue
