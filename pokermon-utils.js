/*
 * pokermon-utils.js
 * Utility functions for the PokerMon game
 */

// Fisher-Yates shuffle algorithm
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Create the monster deck
function createDeck() {
  let cards = [];
  for (let element of GAME.ELEMENTS) {
    for (let i = 1; i <= 13; i++) {
      cards.push({
        type: "monster",
        element: element,
        value: i,
        name: getMonsterName(element, i),
      });
    }
  }
  return cards;
}

// Get icon for element
function getIcon(element) {
  if (element === "Fire")
    return '<i class="fas fa-fire fa-icon" style="color: #FF4500;"></i>';
  if (element === "Water")
    return '<i class="fas fa-tint fa-icon" style="color: #1E90FF;"></i>';
  if (element === "Earth")
    return '<i class="fas fa-mountain fa-icon" style="color: #9ACD32;"></i>';
  if (element === "Air")
    return '<i class="fas fa-wind fa-icon" style="color: #ADD8E6;"></i>';
  if (element === "Electric")
    return '<i class="fas fa-bolt fa-icon" style="color: #FFD700;"></i>';
  return "";
}

// Get monster name based on element and value
function getMonsterName(element, value) {
  return GAME.MONSTER_NAMES[element][value - 1] || element + " " + value;
}

// Get power card name
function getPowerName(element, value) {
  if (element === "Fire")
    return value === 1 ? "Ember" : value === 5 ? "Inferno" : "Flame Burst";
  if (element === "Water")
    return value === 1 ? "Splash" : value === 5 ? "Tsunami" : "Aqua Strike";
  if (element === "Earth")
    return value === 1 ? "Pebble Toss" : value === 5 ? "Quake" : "Rock Smash";
  if (element === "Air")
    return value === 1 ? "Gust" : value === 5 ? "Hurricane" : "Wind Slash";
  if (element === "Electric")
    return value === 1 ? "Spark" : value === 5 ? "Thunder" : "Volt Surge";
  return element + " Power";
}

// Get arena name based on element
function getArenaName(element) {
  if (element === "Fire") return "Volcano Arena";
  if (element === "Water") return "Oceanic Arena";
  if (element === "Earth") return "Forest Arena";
  if (element === "Air") return "Sky Arena";
  if (element === "Electric") return "Lightning Arena";
  return element + " Arena";
}

// Get color for element
function getElementColor(element) {
  if (element === "Fire") return "#FF4500";
  if (element === "Water") return "#1E90FF";
  if (element === "Earth") return "#9ACD32";
  if (element === "Air") return "#ADD8E6";
  if (element === "Electric") return "#FFD700";
  return "#fff";
}

// Add message to game log
function addLog(msg, type = "") {
  const logDiv = document.getElementById("game-log");
  const p = document.createElement("p");
  p.textContent = msg;

  if (type) {
    p.classList.add("log-" + type);
  }

  logDiv.appendChild(p);
  logDiv.scrollTop = logDiv.scrollHeight;
}

// Update player stack displays
function updateStacks() {
  GAME.state.players.forEach((player) => {
    document.getElementById(
      `${player.id}-stack`
    ).innerHTML = `<i class="fas fa-coins stack-icon"></i> $${player.stack}`;

    // Update bet amounts
    if (player.bet > 0) {
      document.getElementById(`${player.id}-bet-amount`).textContent =
        "$" + player.bet;
      document.getElementById(`${player.id}-bet-amount`).style.display =
        "block";
    } else {
      document.getElementById(`${player.id}-bet-amount`).style.display = "none";
    }

    // Render chips based on bet amount
    renderChips(player);
  });
}

// Render chips for player bets
function renderChips(player) {
  const container = document.getElementById(`${player.id}-chips`);
  container.innerHTML = "";

  if (player.bet <= 0) return;

  // Create a visual representation of chips based on bet amount
  // Determine number of chips based on bet size
  const chipValues = [100, 25, 10, 5, 1];
  let remainingAmount = player.bet;
  let chipCount = 0;

  // Calculate how many of each chip value to display
  const chipCounts = chipValues.map((value) => {
    const count = Math.floor(remainingAmount / value);
    remainingAmount -= count * value;
    chipCount += Math.min(count, 4); // Limit to 4 of each chip type for visual clarity
    return Math.min(count, 4);
  });

  // Limit total chips displayed to 10 for performance
  let totalChips = Math.min(chipCount, 10);

  // Create a running count to track which chips to actually render
  let chipIndex = 0;

  // Create chips for each denomination
  chipValues.forEach((value, index) => {
    for (let i = 0; i < chipCounts[index] && chipIndex < totalChips; i++) {
      const chip = document.createElement("div");
      chip.className = "chip";

      // Add data attribute for chip value
      chip.setAttribute("data-value", value);

      // Add small value indicator inside the chip
      if (value >= 5) {
        chip.innerHTML = `<span style="font-size: 10px; font-weight: bold; color: rgba(255,255,255,0.8);">${value}</span>`;
      }

      container.appendChild(chip);
      chipIndex++;
    }
  });

  // Add a chip count indicator if there are more chips than we're showing
  if (player.bet > 100 && chipCount > totalChips) {
    const chipIndicator = document.createElement("div");
    chipIndicator.className = "chip-count";
    chipIndicator.textContent = "$" + player.bet;
    container.appendChild(chipIndicator);
  }
}

// Position blind buttons more effectively around the table
function positionBlindButtons() {
  // Get the table element
  const table = document.querySelector(".poker-table");
  if (!table) return;

  // Get the button elements
  const dealerBtn = document.getElementById("dealer-button");
  const sbBtn = document.getElementById("small-blind-button");
  const bbBtn = document.getElementById("big-blind-button");

  if (!dealerBtn || !sbBtn || !bbBtn) return;

  // Show all buttons
  dealerBtn.style.display = "flex";
  sbBtn.style.display = "flex";
  bbBtn.style.display = "flex";

  // Define position offsets for each player position
  const positions = {
    human: {
      // Left player
      dealer: { left: "120px", top: "40%" },
      sb: { left: "120px", top: "55%" },
      bb: { left: "120px", top: "70%" },
    },
    ai1: {
      // Top player
      dealer: { left: "35%", top: "100px" },
      sb: { left: "50%", top: "100px" },
      bb: { left: "65%", top: "100px" },
    },
    ai2: {
      // Right player
      dealer: { right: "120px", top: "40%" },
      sb: { right: "120px", top: "55%" },
      bb: { right: "120px", top: "70%" },
    },
    ai3: {
      // Bottom player
      dealer: { left: "35%", bottom: "100px" },
      sb: { left: "50%", bottom: "100px" },
      bb: { left: "65%", bottom: "100px" },
    },
  };

  // Map player indices to position keys
  const playerKeys = ["human", "ai1", "ai2", "ai3"];

  // Determine which player has which position
  const dealerPlayerKey = playerKeys[GAME.state.dealerPosition];
  const sbPlayerKey = playerKeys[(GAME.state.dealerPosition + 1) % 4];
  const bbPlayerKey = playerKeys[(GAME.state.dealerPosition + 2) % 4];

  // Apply positions
  // Dealer button
  if (positions[dealerPlayerKey].dealer.left)
    dealerBtn.style.left = positions[dealerPlayerKey].dealer.left;
  else dealerBtn.style.left = "auto";

  if (positions[dealerPlayerKey].dealer.right)
    dealerBtn.style.right = positions[dealerPlayerKey].dealer.right;
  else dealerBtn.style.right = "auto";

  if (positions[dealerPlayerKey].dealer.top)
    dealerBtn.style.top = positions[dealerPlayerKey].dealer.top;
  else dealerBtn.style.top = "auto";

  if (positions[dealerPlayerKey].dealer.bottom)
    dealerBtn.style.bottom = positions[dealerPlayerKey].dealer.bottom;
  else dealerBtn.style.bottom = "auto";

  // Small blind button
  if (positions[sbPlayerKey].sb.left)
    sbBtn.style.left = positions[sbPlayerKey].sb.left;
  else sbBtn.style.left = "auto";

  if (positions[sbPlayerKey].sb.right)
    sbBtn.style.right = positions[sbPlayerKey].sb.right;
  else sbBtn.style.right = "auto";

  if (positions[sbPlayerKey].sb.top)
    sbBtn.style.top = positions[sbPlayerKey].sb.top;
  else sbBtn.style.top = "auto";

  if (positions[sbPlayerKey].sb.bottom)
    sbBtn.style.bottom = positions[sbPlayerKey].sb.bottom;
  else sbBtn.style.bottom = "auto";

  // Big blind button
  if (positions[bbPlayerKey].bb.left)
    bbBtn.style.left = positions[bbPlayerKey].bb.left;
  else bbBtn.style.left = "auto";

  if (positions[bbPlayerKey].bb.right)
    bbBtn.style.right = positions[bbPlayerKey].bb.right;
  else bbBtn.style.right = "auto";

  if (positions[bbPlayerKey].bb.top)
    bbBtn.style.top = positions[bbPlayerKey].bb.top;
  else bbBtn.style.top = "auto";

  if (positions[bbPlayerKey].bb.bottom)
    bbBtn.style.bottom = positions[bbPlayerKey].bb.bottom;
  else bbBtn.style.bottom = "auto";

  // Add tooltips to clarify
  dealerBtn.title = "Dealer Button";
  sbBtn.title = "Small Blind: $" + GAME.SMALL_BLIND;
  bbBtn.title = "Big Blind: $" + GAME.BIG_BLIND;
}

// Show player action (Check, Call, Bet, Fold)
function showPlayerAction(playerId, action, amount = 0) {
  const actionDiv = document.getElementById(`${playerId}-action`);
  actionDiv.className = "player-action " + action.toLowerCase();

  if (
    action === "Bet" ||
    action === "Raise" ||
    action === "Call" ||
    action === "All-In"
  ) {
    actionDiv.textContent = `${action} $${amount}`;
  } else {
    actionDiv.textContent = action;
  }

  actionDiv.classList.add("visible");

  // Hide action after a delay
  setTimeout(() => {
    actionDiv.classList.remove("visible");
  }, 2000);
}

// Show message to player
function showMessage(msg) {
  const messageDiv = document.getElementById("message");
  messageDiv.textContent = msg;
  messageDiv.classList.add("visible");
}

// Hide message
function hideMessage() {
  const messageDiv = document.getElementById("message");
  messageDiv.classList.remove("visible");
}

// Update game stage indicators
function updateGameStage(stage) {
  GAME.state.currentStage = stage;
  const dots = document.querySelectorAll(".stage-dot");
  dots.forEach((dot) => dot.classList.remove("active"));

  let activeIndex = 0;
  switch (stage) {
    case "preflop":
      activeIndex = 0;
      break;
    case "arena":
      activeIndex = 1;
      break;
    case "power1":
      activeIndex = 2;
      break;
    case "power2":
      activeIndex = 3;
      break;
    case "power3":
      activeIndex = 4;
      break;
  }

  if (activeIndex < dots.length) {
    dots[activeIndex].classList.add("active");
  }
}

// Update pot display
function updatePotDisplay() {
  document.getElementById("pot").textContent = "Pot: $" + GAME.state.pot;
}

// Update positions and blinds after each hand
function rotatePositions() {
  GAME.state.dealerPosition = (GAME.state.dealerPosition + 1) % 4;

  // Determine player positions and blinds
  for (let i = 0; i < 4; i++) {
    const position = (GAME.state.dealerPosition + i) % 4;
    const player = GAME.state.players[position];

    // Set position name
    const posIndex = i;
    const positionSpan = document.querySelector(
      `#player-${player.id} .player-position`
    );
    if (positionSpan) {
      positionSpan.textContent = GAME.POSITIONS[posIndex];

      // Update position classes
      positionSpan.className = "player-position";
      if (i === 0) {
        // Dealer (BTN)
        positionSpan.classList.add("dealer");
      } else if (i === 1) {
        // Small Blind (SB)
        positionSpan.classList.add("small-blind");
      } else if (i === 2) {
        // Big Blind (BB)
        positionSpan.classList.add("big-blind");
      }
    }
  }

  // Update blind button positions
  positionBlindButtons();
}

// Calculate card value including arena bonus and power card bonuses
function calculateCardValue(card) {
  let base = card.value;

  if (GAME.state.arenaCard) {
    // Add arena bonus based on element relationship
    let arenaBonus =
      GAME.BONUS_MATRIX[card.element][GAME.state.arenaCard.element];

    // Power card bonuses
    let powerBonus = 0;
    GAME.state.powerCards.forEach((pc) => {
      if (pc.element === card.element) {
        // Same element: add full power
        powerBonus += pc.power;
      } else if (isContradictingElement(pc.element, card.element)) {
        // Contradicting element: -1 regardless of power
        powerBonus -= 1;
      }
    });

    return base + arenaBonus + powerBonus;
  }

  return base;
}

// Check if elements contradict each other
function isContradictingElement(element1, element2) {
  // Using the bonusMatrix, contradicting elements have -2 relationship
  return GAME.BONUS_MATRIX[element1][element2] === -2;
}

// Update player position and blind status display
function updatePositionLabels() {
  // First, clear all position labels
  GAME.state.players.forEach((player) => {
    const positionEl = document.querySelector(
      `#player-${player.id} .player-position`
    );
    if (positionEl) {
      positionEl.textContent = ""; // Clear all position text
      positionEl.className = "player-position"; // Reset all classes
    }
  });

  // Determine which positions each player has
  const dealerPlayerIndex = GAME.state.dealerPosition;
  const sbPlayerIndex = (GAME.state.dealerPosition + 1) % 4;
  const bbPlayerIndex = (GAME.state.dealerPosition + 2) % 4;
  const utgPlayerIndex = (GAME.state.dealerPosition + 3) % 4;

  // Apply position tags with specific styling
  const dealerPositionEl = document.querySelector(
    `#player-${GAME.state.players[dealerPlayerIndex].id} .player-position`
  );
  if (dealerPositionEl) {
    dealerPositionEl.textContent = "BTN";
    dealerPositionEl.className = "player-position dealer";
  }

  const sbPositionEl = document.querySelector(
    `#player-${GAME.state.players[sbPlayerIndex].id} .player-position`
  );
  if (sbPositionEl) {
    sbPositionEl.textContent = "SB";
    sbPositionEl.className = "player-position small-blind";
  }

  const bbPositionEl = document.querySelector(
    `#player-${GAME.state.players[bbPlayerIndex].id} .player-position`
  );
  if (bbPositionEl) {
    bbPositionEl.textContent = "BB";
    bbPositionEl.className = "player-position big-blind";
  }

  const utgPositionEl = document.querySelector(
    `#player-${GAME.state.players[utgPlayerIndex].id} .player-position`
  );
  if (utgPositionEl) {
    utgPositionEl.textContent = "UTG";
    utgPositionEl.className = "player-position";
  }

  // Also update the buttons positioning
  positionBlindButtons();
}

// Debug helper - print game state
function debugGameState(label = "Current Game State") {
  console.log(`==== ${label} ====`);
  console.log("Stage:", GAME.state.currentStage);
  console.log(
    "Active Player:",
    GAME.state.activePlayerIndex,
    GAME.state.players[GAME.state.activePlayerIndex]?.name
  );
  console.log("Current Bet:", GAME.state.currentBet);
  console.log("Pot:", GAME.state.pot);
  console.log("Players:");
  GAME.state.players.forEach((p, i) => {
    console.log(
      `  ${i}: ${p.name} - Stack: $${p.stack}, Bet: $${p.bet}, Folded: ${p.folded}, All-in: ${p.allIn}`
    );
  });
  console.log("Betting Started:", GAME.state.hasBettingStarted);
  console.log("Players Acted:", GAME.state.playersActedThisRound);
  console.log("================");
}

// Get player position type (early, middle, late)
function getPlayerPosition(player) {
  const posElement = document.querySelector(
    `#player-${player.id} .player-position`
  );
  if (!posElement) return "middle";

  const position = posElement.textContent;

  // Late positions have advantage
  if (position === "BTN" || position === "CO") return "late";
  // Early positions are disadvantaged
  if (position === "SB" || position === "BB" || position === "UTG")
    return "early";

  return "middle";
}

// Determine hand tier (high/medium/low/weak)
function calculateHandTier(handValue) {
  // Define base expected values for different stages
  let maxExpectedValue;

  if (GAME.state.currentStage === "preflop") {
    maxExpectedValue = 26; // Two cards, max 13 each
  } else if (GAME.state.currentStage === "arena") {
    maxExpectedValue = 34; // Adding arena bonuses (up to +8)
  } else if (GAME.state.currentStage.startsWith("power")) {
    // Add 5 points per power card
    const powerCount = parseInt(GAME.state.currentStage.charAt(5)) || 0;
    maxExpectedValue = 34 + powerCount * 5;
  } else {
    maxExpectedValue = 26; // Default
  }

  // Define strict tier thresholds (like blackjack's rules)
  const weakThreshold = maxExpectedValue * 0.4; // Bottom 40%
  const averageThreshold = maxExpectedValue * 0.6; // 40-60%
  const strongThreshold = maxExpectedValue * 0.75; // 60-75%
  // Premium is top 25%

  // Classify hand into tier
  if (handValue < weakThreshold) return "weak";
  if (handValue < averageThreshold) return "average";
  if (handValue < strongThreshold) return "strong";
  return "premium";
}

// Add these to the global GAME object
window.GAME.utils = {
  // Utility functions
  shuffle,
  createDeck,
  getIcon,
  getMonsterName,
  getPowerName,
  getArenaName,
  getElementColor,
  addLog,
  updateStacks,
  renderChips,
  positionBlindButtons,
  showPlayerAction,
  showMessage,
  hideMessage,
  updateGameStage,
  updatePotDisplay,
  rotatePositions,
  calculateCardValue,
  isContradictingElement,
  updatePositionLabels,
  debugGameState,
  getPlayerPosition,
  calculateHandTier,
};
