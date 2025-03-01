/* Global Constants and Variables */
const elements = ["Fire", "Water", "Earth", "Air", "Electric"];
const positions = ["BTN", "SB", "BB", "UTG", "MP", "CO"]; // Button, Small Blind, Big Blind, Under the Gun, Middle Position, Cut Off
const startingStack = 1000;
const smallBlind = 5;
const bigBlind = 10;

// Monster names based on element and value (1-13)
const monsterNames = {
  Fire: [
    "Fire Imp",
    "Ember Sprite",
    "Flame Whelp",
    "Blaze Pup",
    "Cinder Hound",
    "Lava Golem",
    "Burning Drake",
    "Flare Serpent",
    "Scorch Fiend",
    "Pyro Beast",
    "Ember Lord",
    "Inferno King",
    "Lava Titan",
  ],
  Water: [
    "Water Sprite",
    "Mist Nymph",
    "Ripple Imp",
    "Droplet Pixie",
    "Brook Guardian",
    "Aqua Sentinel",
    "Tidal Fighter",
    "Wave Ruler",
    "Deepwater Fiend",
    "Ocean Warrior",
    "Tsunami Bringer",
    "Abyss Monarch",
    "Ocean Emperor",
  ],
  Earth: [
    "Earth Pixie",
    "Soil Sprite",
    "Pebble Imp",
    "Mudling",
    "Rock Guard",
    "Stone Sentinel",
    "Terra Warrior",
    "Gravel Golem",
    "Earth Brute",
    "Landshaper",
    "Geo Lord",
    "Terra Titan",
    "Earth Emperor",
  ],
  Air: [
    "Air Imp",
    "Breeze Sprite",
    "Gustling",
    "Wind Wisp",
    "Zephyr Knight",
    "Air Scout",
    "Sky Warrior",
    "Cloud Strider",
    "Tempest Caller",
    "Wind Ruler",
    "Storm Bringer",
    "Sky Lord",
    "Storm King",
  ],
  Electric: [
    "Spark Imp",
    "Voltage Sprite",
    "Shockling",
    "Static Whelp",
    "Electric Hound",
    "Volt Golem",
    "Current Serpent",
    "Lightning Beast",
    "Thunder Fiend",
    "Storm Brute",
    "Electric Lord",
    "Volt Emperor",
    "Thunder Emperor",
  ],
};

// BONUS MATRIX: Updated with complementary element loop
// water -> fire -> air -> earth -> electric -> water
const bonusMatrix = {
  Fire: { Fire: 4, Water: -4, Earth: 1, Air: 2, Electric: -3 },
  Water: { Water: 4, Fire: 2, Earth: 1, Air: -4, Electric: -3 },
  Earth: { Earth: 4, Water: 2, Fire: -3, Air: -4, Electric: 1 },
  Air: { Air: 4, Water: 2, Earth: -3, Fire: -4, Electric: 1 },
  Electric: { Electric: 4, Water: 2, Earth: -4, Air: 1, Fire: -3 }
};

// Element gradients for visual effects
const elementGradients = {
  Fire: "linear-gradient(45deg, rgba(255,69,0,0.2), rgba(255,140,0,0.2), rgba(255,69,0,0.2))",
  Water:
    "linear-gradient(45deg, rgba(30,144,255,0.2), rgba(65,105,225,0.2), rgba(30,144,255,0.2))",
  Earth:
    "linear-gradient(45deg, rgba(154,205,50,0.2), rgba(107,142,35,0.2), rgba(154,205,50,0.2))",
  Air: "linear-gradient(45deg, rgba(173,216,230,0.2), rgba(135,206,250,0.2), rgba(173,216,230,0.2))",
  Electric:
    "linear-gradient(45deg, rgba(255,215,0,0.2), rgba(255,165,0,0.2), rgba(255,215,0,0.2))",
};

// AI thresholds for risk assessment
const aiRiskThresholds = {
  preflop: { low: 10, medium: 16, high: 20 },
  arena: { low: 12, medium: 18, high: 22 },
  power: { low: 15, medium: 22, high: 26 },
};

// Game state variables
let deck = [];
let players = [];
let arenaCard = null;
let powerCards = [];
let currentStage = "preflop"; // preflop, arena, power1, power2, power3, showdown
let dealerPosition = 3; // Start with human as dealer (BTN)
let activePlayerIndex = 0;
let currentBet = 0;
let pot = 0;
let minRaise = bigBlind; // Minimum raise amount (starts as big blind)
let lastRaiseAmount = 0;
let lastRaiser = null;
let bettingRoundComplete = false;
let sidePots = [];
let mainPot = 0;
let gameStarted = false;

/* --- Helper Functions --- */

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
  for (let element of elements) {
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
  return monsterNames[element][value - 1] || element + " " + value;
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
  players.forEach((player) => {
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
  const table = document.querySelector('.poker-table');
  if (!table) return;
  
  // Get the button elements
  const dealerBtn = document.getElementById('dealer-button');
  const sbBtn = document.getElementById('small-blind-button');
  const bbBtn = document.getElementById('big-blind-button');
  
  if (!dealerBtn || !sbBtn || !bbBtn) return;
  
  // Show all buttons
  dealerBtn.style.display = 'flex';
  sbBtn.style.display = 'flex';
  bbBtn.style.display = 'flex';
  
  // Get table dimensions
  const tableWidth = table.offsetWidth;
  const tableHeight = table.offsetHeight;
  
  // Define position offsets for each player position
  const positions = {
    human: { // Left player
      dealer: { left: '120px', top: '40%' }, 
      sb: { left: '120px', top: '55%' }, 
      bb: { left: '120px', top: '70%' }
    },
    ai1: { // Top player
      dealer: { left: '35%', top: '100px' }, 
      sb: { left: '50%', top: '100px' }, 
      bb: { left: '65%', top: '100px' }
    },
    ai2: { // Right player
      dealer: { right: '120px', top: '40%' }, 
      sb: { right: '120px', top: '55%' }, 
      bb: { right: '120px', top: '70%' }
    },
    ai3: { // Bottom player
      dealer: { left: '35%', bottom: '100px' }, 
      sb: { left: '50%', bottom: '100px' }, 
      bb: { left: '65%', bottom: '100px' }
    }
  };
  
  // Map player indices to position keys
  const playerKeys = ['human', 'ai1', 'ai2', 'ai3'];
  
  // Determine which player has which position
  const dealerPlayerKey = playerKeys[dealerPosition];
  const sbPlayerKey = playerKeys[(dealerPosition + 1) % 4];
  const bbPlayerKey = playerKeys[(dealerPosition + 2) % 4];
  
  // Apply positions
  // Dealer button
  if (positions[dealerPlayerKey].dealer.left) dealerBtn.style.left = positions[dealerPlayerKey].dealer.left;
  else dealerBtn.style.left = 'auto';
  
  if (positions[dealerPlayerKey].dealer.right) dealerBtn.style.right = positions[dealerPlayerKey].dealer.right;
  else dealerBtn.style.right = 'auto';
  
  if (positions[dealerPlayerKey].dealer.top) dealerBtn.style.top = positions[dealerPlayerKey].dealer.top;
  else dealerBtn.style.top = 'auto';
  
  if (positions[dealerPlayerKey].dealer.bottom) dealerBtn.style.bottom = positions[dealerPlayerKey].dealer.bottom;
  else dealerBtn.style.bottom = 'auto';
  
  // Small blind button
  if (positions[sbPlayerKey].sb.left) sbBtn.style.left = positions[sbPlayerKey].sb.left;
  else sbBtn.style.left = 'auto';
  
  if (positions[sbPlayerKey].sb.right) sbBtn.style.right = positions[sbPlayerKey].sb.right;
  else sbBtn.style.right = 'auto';
  
  if (positions[sbPlayerKey].sb.top) sbBtn.style.top = positions[sbPlayerKey].sb.top;
  else sbBtn.style.top = 'auto';
  
  if (positions[sbPlayerKey].sb.bottom) sbBtn.style.bottom = positions[sbPlayerKey].sb.bottom;
  else sbBtn.style.bottom = 'auto';
  
  // Big blind button
  if (positions[bbPlayerKey].bb.left) bbBtn.style.left = positions[bbPlayerKey].bb.left;
  else bbBtn.style.left = 'auto';
  
  if (positions[bbPlayerKey].bb.right) bbBtn.style.right = positions[bbPlayerKey].bb.right;
  else bbBtn.style.right = 'auto';
  
  if (positions[bbPlayerKey].bb.top) bbBtn.style.top = positions[bbPlayerKey].bb.top;
  else bbBtn.style.top = 'auto';
  
  if (positions[bbPlayerKey].bb.bottom) bbBtn.style.bottom = positions[bbPlayerKey].bb.bottom;
  else bbBtn.style.bottom = 'auto';
  
  // Add tooltips to clarify
  dealerBtn.title = "Dealer Button";
  sbBtn.title = "Small Blind: $" + smallBlind;
  bbBtn.title = "Big Blind: $" + bigBlind;
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

function updateActionButtons() {
  const checkButton = document.getElementById("check-button");
  const callButton = document.getElementById("call-button");
  const betButton = document.getElementById("bet-button");
  const raiseButton = document.getElementById("raise-button");
  const allInButton = document.getElementById("all-in-button");

  // Get human player
  const human = players.find((p) => p.isHuman);

  // Reset all buttons
  checkButton.disabled = false;
  callButton.disabled = false;
  betButton.disabled = false;
  raiseButton.disabled = false;
  allInButton.disabled = false;

  // Handle all-in case
  if (human.stack === 0) {
    checkButton.disabled = true;
    callButton.disabled = true;
    betButton.disabled = true;
    raiseButton.disabled = true;
    allInButton.disabled = true;
    return;
  }

  // Special case for Big Blind in preflop
  const isBigBlind = currentStage === "preflop" && 
                     document.querySelector(`#player-${human.id} .player-position`).textContent === "BB";
  
  // If there's a bet (and it's higher than what the player has already bet), enable Call
  if (currentBet > human.bet) {
    checkButton.disabled = true;

    // If human doesn't have enough to call, disable Call button
    if (human.stack < currentBet - human.bet) {
      callButton.disabled = true;
    }

    // Enable/disable Raise based on stack size
    if (human.stack <= currentBet - human.bet || human.stack < minRaise) {
      raiseButton.disabled = true;
    }

    // Show Raise instead of Bet when there's already a bet
    betButton.style.display = "none";
    raiseButton.style.display = "inline-block";
  } 
  // If it's the big blind's option and no one has raised
  else if (isBigBlind && human.bet === currentBet && !lastRaiser) {
    // Big blind can check or raise when no one has raised
    checkButton.disabled = false;
    callButton.disabled = true;
    
    // Show Bet instead of Raise when the BB checks
    betButton.style.display = "inline-block";
    raiseButton.style.display = "none";
  }
  else {
    // No bet or player has already matched the current bet, so enable Check and disable Call
    checkButton.disabled = false;
    callButton.disabled = true;

    // Show Bet instead of Raise when there's no bet
    betButton.style.display = "inline-block";
    raiseButton.style.display = "none";
  }

  // Update call button text
  if (callButton.disabled === false) {
    const callAmount = currentBet - human.bet;
    callButton.textContent = `Call $${callAmount}`;
  } else {
    callButton.textContent = "Call";
  }

  // If human can't bet the minimum, disable bet button
  if (human.stack < bigBlind) {
    betButton.disabled = true;
  }
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
  currentStage = stage;
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
  document.getElementById("pot").textContent = "Pot: $" + pot;
}

// Update positions and blinds after each hand
function rotatePositions() {
  dealerPosition = (dealerPosition + 1) % 4;

  // Determine player positions and blinds
  for (let i = 0; i < 4; i++) {
    const position = (dealerPosition + i) % 4;
    const player = players[position];

    // Set position name
    const posIndex = i;
    const positionSpan = document.querySelector(
      `#player-${player.id} .player-position`
    );
    if (positionSpan) {
      positionSpan.textContent = positions[posIndex];

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

/* --- Core Game Functions --- */

// Calculate card value including arena bonus and power card bonuses
function calculateCardValue(card) {
  let base = card.value;

  if (arenaCard) {
    // Add arena bonus based on new element relationship
    let arenaBonus = bonusMatrix[card.element][arenaCard.element];

    // Power card bonuses
    let powerBonus = 0;
    powerCards.forEach((pc) => {
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
  return bonusMatrix[element1][element2] === -2;
}

// Reveal arena card
function revealArena() {
  let arenaElement = elements[Math.floor(Math.random() * elements.length)];
  arenaCard = {
    type: "arena",
    element: arenaElement,
    name: getArenaName(arenaElement),
    modifiers: bonusMatrix,
  };

  // Update UI
  let arenaLabel = document.getElementById("arena-label");
  arenaLabel.innerText = arenaCard.name + " (" + arenaCard.element + ")";
  arenaLabel.style.color = getElementColor(arenaCard.element);
  arenaLabel.classList.add("active");

  // Update arena container
  const container = document.getElementById("power-cards-container");
  container.className = arenaCard.element.toLowerCase() + "-arena";
  container.style.borderColor = getElementColor(arenaCard.element);
  container.style.background = elementGradients[arenaCard.element];
  container.style.backgroundSize = "400% 400%";
  container.style.animation = "gradientAnimation 15s ease infinite";

  addLog(`Arena revealed: ${arenaLabel.innerText}`, "action");

  // Update hand displays to show bonuses
  renderHands();

  // Update game stage
  updateGameStage("arena");
}

// Add power card
function addPowerCard() {
  let powerElement = elements[Math.floor(Math.random() * elements.length)];
  let powerValue = Math.floor(Math.random() * 5) + 1;
  let powerCard = {
    type: "power",
    element: powerElement,
    power: powerValue,
    name: getPowerName(powerElement, powerValue),
  };

  powerCards.push(powerCard);

  addLog(
    `Power Card dealt: ${powerCard.name} (${powerCard.element} +${powerCard.power})`,
    "action"
  );

  renderPowerCards();
  renderHands();

  // Update game stage
  if (powerCards.length === 1) {
    updateGameStage("power1");
  } else if (powerCards.length === 2) {
    updateGameStage("power2");
  } else if (powerCards.length === 3) {
    updateGameStage("power3");
  }
}

// Initialize game
function initGame() {
  // Create and shuffle deck
  deck = shuffle(createDeck());

  // Initialize players
  players = [
    {
      id: "human",
      name: "You",
      hand: [],
      isHuman: true,
      active: true,
      bet: 0,
      totalBet: 0,
      stack: startingStack,
      folded: false,
      allIn: false,
    },
    {
      id: "ai1",
      name: "AI 1",
      hand: [],
      isHuman: false,
      active: true,
      bet: 0,
      totalBet: 0,
      stack: startingStack,
      folded: false,
      allIn: false,
    },
    {
      id: "ai2",
      name: "AI 2",
      isHuman: false,
      hand: [],
      active: true,
      bet: 0,
      totalBet: 0,
      stack: startingStack,
      folded: false,
      allIn: false,
    },
    {
      id: "ai3",
      name: "AI 3",
      isHuman: false,
      hand: [],
      active: true,
      bet: 0,
      totalBet: 0,
      stack: startingStack,
      folded: false,
      allIn: false,
    },
  ];

  // Reset game state
  arenaCard = null;
  powerCards = [];
  currentStage = "preflop";
  pot = 0;
  currentBet = 0;
  minRaise = bigBlind;
  bettingRoundComplete = false;
  sidePots = [];
  mainPot = 0;
  gameStarted = true;

  // Update UI
  updatePotDisplay();
  updateStacks();
  document.getElementById("human-total").innerText = "";
  document.getElementById("ai1-total").innerText = "";
  document.getElementById("ai2-total").innerText = "";
  document.getElementById("ai3-total").innerText = "";
  document.getElementById("arena-label").innerText = "";
  document.getElementById("arena-label").className = "arena-label";
  document.getElementById("power-cards-container").className = "";
  document.getElementById("power-cards-container").style.borderColor =
    "transparent";
  document.getElementById("power-cards").innerHTML = "";
  document.getElementById("game-log").innerHTML = "";

  // Hide and show buttons
  document.getElementById("start-button").style.display = "none";
  document.getElementById("restart-button").style.display = "none";
  document.getElementById("betting-controls").classList.remove("visible");
  document.getElementById("bet-slider-container").style.display = "none";

  // Set positions and blinds
  rotatePositions();

  addLog("Game started. Dealing Monster Cards...", "action");

  // Reset player statuses
  players.forEach((player) => {
    const playerEl = document.getElementById(`player-${player.id}`);
    playerEl.classList.remove("active", "folded");
    document.getElementById(`${player.id}-bet-amount`).style.display = "none";
    document.getElementById(`${player.id}-chips`).innerHTML = "";
  });

  // Deal initial cards and start the game
  setTimeout(dealInitialCards, 500);
}

// Reset for a new round (preserving stacks)
function resetRound() {
  // Create and shuffle deck
  deck = shuffle(createDeck());

  // Reset player states but keep stacks
  players.forEach((player) => {
    player.hand = [];
    player.active = true;
    player.bet = 0;
    player.totalBet = 0;
    player.folded = false;
    player.allIn = false;

    // Explicitly clear all cards
    const cardContainer = document.getElementById(`${player.id}-cards`);
    if (cardContainer) {
      cardContainer.innerHTML = "";
    }

    // Reset UI elements
    document.getElementById(`${player.id}-total`).innerText = "";
    document.getElementById(`${player.id}-bet-amount`).style.display = "none";
    document.getElementById(`${player.id}-chips`).innerHTML = "";

    // Remove folded class from player elements
    document
      .getElementById(`player-${player.id}`)
      .classList.remove("folded", "active");
  });

  // Reset game state
  arenaCard = null;
  powerCards = [];
  currentStage = "preflop";
  pot = 0;
  currentBet = 0;
  minRaise = bigBlind;
  bettingRoundComplete = false;
  sidePots = [];
  mainPot = 0;

  // Update UI
  updatePotDisplay();
  updateStacks();

  // Clear all display areas
  document.getElementById("arena-label").innerText = "";
  document.getElementById("arena-label").className = "arena-label";
  document.getElementById("power-cards-container").className = "";
  document.getElementById("power-cards-container").style.borderColor =
    "transparent";

  // Explicitly clear power cards
  const powerCardContainer = document.getElementById("power-cards");
  if (powerCardContainer) {
    powerCardContainer.innerHTML = "";
  }

  // Hide winner overlay if showing
  document.getElementById("winner-overlay").classList.remove("visible");

  // Hide and show buttons
  document.getElementById("restart-button").style.display = "none";
  document.getElementById("betting-controls").classList.remove("visible");
  document.getElementById("bet-slider-container").style.display = "none";

  // Update game stage
  updateGameStage("preflop");

  // Set positions and blinds
  rotatePositions();

  addLog("New round starting. Dealing Monster Cards...", "action");

  // Deal initial cards and start the game
  setTimeout(dealInitialCards, 500);
}

// Deal initial cards
function dealInitialCards() {
  // Deal two cards to each player with animation
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < players.length; j++) {
      const player = players[j];
      const card = deck.pop();
      player.hand.push(card);

      // Simulate card dealing animation
      setTimeout(() => {
        const container = document.getElementById(`${player.id}-cards`);

        if (player.isHuman) {
          // Create the card HTML
          let cardDiv = document.createElement("div");
          cardDiv.className = `card monster ${card.element.toLowerCase()}-card card-deal`;

          let iconHTML = getIcon(card.element);
          cardDiv.innerHTML = `
            <div class="card-type">${iconHTML} ${card.element}</div>
            <div class="card-name">${card.name}</div>
            <div class="card-value">${card.value}</div>
            <div class="bonus-indicator">${
              calculateCardValue(card) - card.value >= 0
                ? "+" + (calculateCardValue(card) - card.value)
                : calculateCardValue(card) - card.value
            }</div>
          `;

          container.appendChild(cardDiv);
        } else {
          // Create card back for AI players
          let cardDiv = document.createElement("div");
          cardDiv.className = "card card-back card-deal";
          container.appendChild(cardDiv);
        }
      }, 200 * (i * players.length + j));
    }
  }

  // After all cards are dealt, post blinds and start first betting round
  setTimeout(() => {
    postBlinds();
    updatePositionLabels(); // Add this line to update position indicators
    positionBlindButtons(); // Update button positions
    beginBettingRound();
  }, 2000);
}

function postBlinds() {
  // Find small blind and big blind players
  const sbPositionIndex = (dealerPosition + 1) % 4;
  const bbPositionIndex = (dealerPosition + 2) % 4;

  // Reset all bets to zero first
  players.forEach(player => {
    player.bet = 0;
    player.totalBet = 0;
  });

  // Post small blind
  const sbPlayer = players[sbPositionIndex];
  const sbAmount = Math.min(smallBlind, sbPlayer.stack);
  sbPlayer.bet = sbAmount;
  sbPlayer.totalBet = sbAmount;
  sbPlayer.stack -= sbAmount;
  pot += sbAmount;

  // Post big blind
  const bbPlayer = players[bbPositionIndex];
  const bbAmount = Math.min(bigBlind, bbPlayer.stack);
  bbPlayer.bet = bbAmount;
  bbPlayer.totalBet = bbAmount;
  bbPlayer.stack -= bbAmount;
  pot += bbAmount;

  // Set current bet to big blind
  currentBet = bbAmount;

  // Log the blinds
  addLog(`${sbPlayer.name} posts small blind: $${sbAmount}`, "bet");
  addLog(`${bbPlayer.name} posts big blind: $${bbAmount}`, "bet");

  // Update UI
  updateStacks();
  updatePotDisplay();

  // Show player actions
  showPlayerAction(sbPlayer.id, "Small Blind", sbAmount);
  showPlayerAction(bbPlayer.id, "Big Blind", bbAmount);

  // Action starts with player after big blind (UTG)
  activePlayerIndex = (bbPositionIndex + 1) % 4;
}

// Render cards for all players
function renderHands() {
  players.forEach((player) => {
    const container = document.getElementById(`${player.id}-cards`);
    container.innerHTML = "";

    if (player.folded) {
      const folded = document.createElement("div");
      folded.textContent = "Folded";
      folded.style.fontSize = "16px";
      folded.style.color = "#aaa";
      folded.style.textAlign = "center";
      folded.style.marginTop = "20px";
      container.appendChild(folded);

      // Add folded class to player div
      document.getElementById(`player-${player.id}`).classList.add("folded");
      return;
    }

    player.hand.forEach((card) => {
      let cardDiv = document.createElement("div");

      if (player.isHuman || currentStage === "showdown") {
        // Show actual cards for human player or at showdown
        cardDiv.className = `card monster ${card.element.toLowerCase()}-card`;

        // Calculate bonus from arena and power cards
        let bonus = calculateCardValue(card) - card.value;
        let bonusClass = bonus >= 0 ? "bonus-positive" : "bonus-negative";

        let iconHTML = getIcon(card.element);
        cardDiv.innerHTML = `
          <div class="card-type">${iconHTML} ${card.element}</div>
          <div class="card-name">${card.name}</div>
          <div class="card-value">${card.value}</div>
          <div class="bonus-indicator ${bonusClass}">${
          bonus >= 0 ? "+" + bonus : bonus
        }</div>
        `;
      } else {
        // Show card backs for AI players
        cardDiv.className = "card card-back";
      }

      container.appendChild(cardDiv);
    });

    // Update total hand value
    if (player.isHuman || currentStage === "showdown") {
      const total = player.hand.reduce(
        (sum, card) => sum + calculateCardValue(card),
        0
      );
      document.getElementById(
        `${player.id}-total`
      ).innerText = `Total: ${total}`;
    } else {
      document.getElementById(`${player.id}-total`).innerText = "";
    }
  });
}

// Render power cards
function renderPowerCards() {
  const container = document.getElementById("power-cards");
  container.innerHTML = "";

  powerCards.forEach((card) => {
    let cardDiv = document.createElement("div");
    cardDiv.className = `card power ${card.element.toLowerCase()}-card`;

    let iconHTML = getIcon(card.element);
    cardDiv.innerHTML = `
      <div class="card-type">${iconHTML} ${card.element}</div>
      <div class="card-name">${card.name}</div>
      <div class="card-value">+${card.power}</div>
    `;

    container.appendChild(cardDiv);

    // Add card deal animation
    cardDiv.classList.add("card-deal");
  });
}

function beginBettingRound() {
  // Reset bets for the new round, preserving totalBet
  players.forEach((player) => {
    player.bet = 0; // Reset current round bet
  });
  
  // Reset betting round state
  bettingRoundComplete = false;
  lastRaiser = null;
  
  // Reset currentBet to 0 except for preflop
  if (currentStage !== "preflop") {
    currentBet = 0;
    minRaise = bigBlind;
  }
  
  console.log("Starting betting round for stage: " + currentStage);
  
  // Set the correct starting player based on the game stage
  if (currentStage === "preflop") {
    // Preflop starts with UTG (player after big blind)
    activePlayerIndex = (dealerPosition + 3) % players.length;
    console.log("Preflop starting with player index: " + activePlayerIndex);
  } else {
    // Postflop starts with SB position or first active player after dealer
    activePlayerIndex = (dealerPosition + 1) % players.length;
    console.log("Postflop starting with player index: " + activePlayerIndex);
  }
  
  // Skip folded or all-in players
  let loopCount = 0;
  while ((players[activePlayerIndex].folded || players[activePlayerIndex].allIn) && loopCount < players.length) {
    activePlayerIndex = (activePlayerIndex + 1) % players.length;
    loopCount++;
  }
  
  // If all players but one are folded or all-in, advance the game
  if (loopCount >= players.length - 1) {
    advanceGame();
    return;
  }
  
  // Process AI players immediately, activate human player for action
  if (!players[activePlayerIndex].isHuman) {
    processAIActions();
  } else {
    activateHumanPlayer();
  }
}

// Activate human player for action
function activateHumanPlayer() {
  // Highlight active player
  players.forEach((player, index) => {
    const playerEl = document.getElementById(`player-${player.id}`);
    if (index === activePlayerIndex) {
      playerEl.classList.add("active");
    } else {
      playerEl.classList.remove("active");
    }
  });

  // Show betting controls for human player
  if (
    players[activePlayerIndex].isHuman &&
    !players[activePlayerIndex].folded &&
    !players[activePlayerIndex].allIn
  ) {
    document.getElementById("betting-controls").classList.add("visible");
    updateActionButtons();
    showMessage("Your turn - choose your action");
  }
}

// Improved version of isBettingRoundComplete that properly handles folds
function isBettingRoundComplete() {
  // Count active non-all-in players
  const activePlayers = players.filter(p => !p.folded && !p.allIn);
  
  // If there's only 0 or 1 active players, betting is done
  if (activePlayers.length <= 1) {
    return true;
  }
  
  // Check if all active players have matched the current bet
  // or if everyone has acted after the last raiser
  
  // If there's no current bet, everyone needs to have acted
  if (currentBet === 0) {
    // In this case, we need to make sure every active player has had a chance to act
    // This is challenging to track precisely, so we'll use the fact that if we've gone
    // around the table once and no one has bet, we're done
    return allPlayersHaveActed();
  }
  
  // If there's a current bet, all active players must have matched it or folded
  return activePlayers.every(player => player.bet === currentBet);
}
// Fix 4: Update processHumanAction to handle call amounts correctly
function processHumanAction(action, betAmount = 0) {
  const human = players.find((p) => p.isHuman);

  if (action === "Check") {
    // Special case for Big Blind in preflop
    const isBigBlind = currentStage === "preflop" && 
                       document.querySelector(`#player-${human.id} .player-position`).textContent === "BB";
    
    if (currentBet === 0 || human.bet === currentBet || (isBigBlind && human.bet === currentBet && !lastRaiser)) {
      addLog("You checked.", "action");
      showPlayerAction(human.id, "Check");
    } else {
      alert("Cannot check when there's a bet. Choose Call or Fold.");
      return false;
    }
  } else if (action === "Call") {
    if (currentBet > human.bet) {
      // Calculate the correct call amount (difference between current bet and player's bet)
      const callAmount = Math.min(currentBet - human.bet, human.stack);
      human.stack -= callAmount;
      pot += callAmount;
      human.bet += callAmount;
      human.totalBet += callAmount;

      // Check for all-in
      if (human.stack === 0) {
        human.allIn = true;
        addLog("You called $" + callAmount + " and are all-in!", "bet");
        showPlayerAction(human.id, "All-In", callAmount);
      } else {
        addLog("You called $" + callAmount + ".", "action");
        showPlayerAction(human.id, "Call", callAmount);
      }
    } else {
      alert("Nothing to call.");
      return false;
    }
  } else if (action === "Bet" || action === "Raise") {
    // Validate bet amount
    if (action === "Bet" && currentBet > 0 && !(currentStage === "preflop" && 
        document.querySelector(`#player-${human.id} .player-position`).textContent === "BB" && 
        human.bet === currentBet && !lastRaiser)) {
      alert("Cannot bet when there's already a bet. Use Raise instead.");
      return false;
    }

    if (action === "Raise" && betAmount <= currentBet) {
      alert("Your raise must exceed the current bet ($" + currentBet + ").");
      return false;
    }

    if (action === "Bet" && betAmount < bigBlind) {
      alert("Minimum bet is $" + bigBlind + ".");
      return false;
    }

    if (action === "Raise" && betAmount - currentBet < minRaise) {
      alert(
        "Minimum raise is $" +
          minRaise +
          " above current bet ($" +
          currentBet +
          ")."
      );
      return false;
    }

    if (betAmount > human.stack + human.bet) {
      alert("You don't have enough chips for this bet/raise.");
      return false;
    }

    // Process bet/raise
    const actualRaiseAmount = betAmount - human.bet;
    human.stack -= actualRaiseAmount;
    pot += actualRaiseAmount;
    lastRaiseAmount = betAmount - currentBet;
    minRaise = lastRaiseAmount; // Set new minimum raise
    currentBet = betAmount;
    human.bet = betAmount;
    human.totalBet += actualRaiseAmount;
    lastRaiser = human;

    // Check for all-in
    if (human.stack === 0) {
      human.allIn = true;
      addLog(`You went all-in with $${betAmount}!`, "bet");
      showPlayerAction(human.id, "All-In", betAmount);
    } else {
      addLog(`You ${action.toLowerCase()}d to $${betAmount}.`, "action");
      showPlayerAction(human.id, action, betAmount);
    }
  } else if (action === "Fold") {
    human.folded = true;
    human.active = false;
    addLog("You folded.", "fold");
    showPlayerAction(human.id, "Fold");

    // Add folded class to player div
    document.getElementById(`player-${human.id}`).classList.add("folded");
    
    // Special check - if only one active player remains after folding
    const remainingPlayers = players.filter(p => !p.folded);
    if (remainingPlayers.length === 1) {
      // Hide betting controls immediately
      document.getElementById("betting-controls").classList.remove("visible");
      updateStacks();
      updatePotDisplay();
      
      // Advance to showdown with a delay
      setTimeout(() => {
        advanceGame();
      }, 1000);
      return true;
    }
  } else if (action === "All-In") {
    // All-in is a special case
    const allInAmount = human.bet + human.stack;

    if (allInAmount <= currentBet) {
      // All-in as a call (or partial call)
      const actualAllInAmount = human.stack; // Only add what's in the stack
      pot += actualAllInAmount;
      human.bet += actualAllInAmount;
      human.totalBet += actualAllInAmount;
      human.stack = 0;
      human.allIn = true;

      addLog(`You went all-in with $${allInAmount}!`, "bet");
      showPlayerAction(human.id, "All-In", allInAmount);
    } else {
      // All-in as a raise
      const actualRaiseAmount = human.stack;
      
      if (allInAmount - currentBet >= minRaise) {
        // Valid raise
        lastRaiseAmount = allInAmount - currentBet;
        minRaise = lastRaiseAmount;
        lastRaiser = human;
      }

      currentBet = allInAmount;
      pot += actualRaiseAmount;
      human.bet = allInAmount;
      human.totalBet += actualRaiseAmount;
      human.stack = 0;
      human.allIn = true;

      addLog(`You went all-in with $${allInAmount}!`, "bet");
      showPlayerAction(human.id, "All-In", allInAmount);
    }
  }

  // Update UI
  updateStacks();
  updatePotDisplay();
  renderHands();

  // Hide betting controls
  document.getElementById("betting-controls").classList.remove("visible");

  // Move to next player or next stage
  moveToNextPlayer();

  return true;
}

// Fix to ensure correct call amounts for AI players too
function processAIActions() {
  if (!players[activePlayerIndex] || players[activePlayerIndex].isHuman) {
    return;
  }
  
  const ai = players[activePlayerIndex];
  
  if (ai.folded || ai.allIn) {
    // Skip if AI folded or is all-in
    moveToNextPlayer();
    return;
  }
  
  // Highlight active AI
  highlightActivePlayer();
  
  // Improved AI logic with better decision making
  setTimeout(() => {
    // Calculate hand value
    const handValue = ai.hand.reduce((sum, card) => sum + calculateCardValue(card), 0);
    
    // Calculate hand strength tier based on game stage
    const handTier = calculateHandTier(handValue);
    
    // Get a count of active players (not folded)
    const activePlayers = players.filter(p => !p.folded).length;
    
    // Special case for Big Blind in preflop
    const isBigBlind = currentStage === "preflop" && 
                       document.querySelector(`#player-${ai.id} .player-position`).textContent === "BB";
    
    // Track if any AI has already raised in this round to reduce re-raising
    const aiRaiseCount = players.filter(p => 
      !p.isHuman && !p.folded && p.bet > 0 && p === lastRaiser
    ).length;
    
    // Add this logic to reduce the chance that AIs keep raising each other
    const shouldLimitRaises = aiRaiseCount >= 1;
    
    // If there's no bet, or BB with option to check
    if (currentBet === 0 || (isBigBlind && ai.bet === currentBet && !lastRaiser)) {
      // Premium hands always bet
      if (handTier === "premium") {
        const betSize = Math.min(Math.max(pot * 0.6, bigBlind * 2), ai.stack);
        makeBet(ai, betSize);
      }
      // Strong hands bet with 70% probability
      else if (handTier === "strong" && Math.random() < 0.7) {
        const betSize = Math.min(Math.max(pot * 0.4, bigBlind), ai.stack);
        makeBet(ai, betSize);
      }
      // Average hands in late position bet with 40% probability
      else if (handTier === "average" && getPlayerPosition(ai) === "late" && Math.random() < 0.4) {
        const betSize = Math.min(Math.max(pot * 0.25, bigBlind), ai.stack);
        makeBet(ai, betSize);
      }
      // Otherwise check
      else {
        makeCheck(ai);
      }
    } 
    // There's already a bet
    else {
      // Calculate correct call amount
      const callAmount = currentBet - ai.bet;
      
      // Premium hands might raise, but not if there have been too many raises already
      if (handTier === "premium" && (!shouldLimitRaises || Math.random() < 0.2)) {
        if (ai.stack > callAmount * 2) {
          // Have enough to raise
          const raiseSize = Math.min(currentBet * 1.5, ai.stack + ai.bet);
          makeRaise(ai, raiseSize);
        } else {
          // Not enough to raise, call
          makeCall(ai);
        }
      }
      // Strong hands call and sometimes raise (but with low probability if raises are limited)
      else if (handTier === "strong") {
        const raiseProb = shouldLimitRaises ? 0.15 : 0.3;
        
        if (Math.random() < raiseProb && ai.stack > callAmount * 2) {
          const raiseSize = Math.min(currentBet * 1.3, ai.stack + ai.bet);
          makeRaise(ai, raiseSize);
        } else {
          makeCall(ai);
        }
      }
      // Average hands call small bets
      else if (handTier === "average" && callAmount <= ai.stack * 0.3) {
        makeCall(ai);
      }
      // Weak hands call very small bets
      else if (handTier === "weak" && callAmount <= ai.stack * 0.15) {
        makeCall(ai);
      }
      // Occasionally bluff, but very rarely if raises are limited
      else if (Math.random() < (shouldLimitRaises ? 0.05 : 0.15) && getPlayerPosition(ai) === "late" && currentStage === "preflop") {
        if (ai.stack > callAmount * 2) {
          const raiseSize = Math.min(currentBet * 1.2, ai.stack + ai.bet);
          makeRaise(ai, raiseSize);
        } else {
          makeCall(ai);
        }
      }
      // Otherwise fold
      else {
        makeFold(ai);
      }
    }
  }, 800);
}

// Helper functions to improve code readability and maintainability
function makeBet(player, amount) {
  player.stack -= amount;
  pot += amount;
  player.bet = amount;
  player.totalBet += amount;
  currentBet = amount;
  minRaise = amount;
  lastRaiser = player;
  
  addLog(`${player.name} bets $${amount}.`, "bet");
  showPlayerAction(player.id, "Bet", amount);
  
  moveToNextPlayer();
}

function makeRaise(player, amount) {
  const raiseAmount = amount - player.bet;
  player.stack -= raiseAmount;
  pot += raiseAmount;
  lastRaiseAmount = amount - currentBet;
  minRaise = lastRaiseAmount;
  currentBet = amount;
  player.bet = amount;
  player.totalBet += raiseAmount;
  lastRaiser = player;
  
  addLog(`${player.name} raises to $${amount}.`, "bet");
  showPlayerAction(player.id, "Raise", amount);
  
  moveToNextPlayer();
}


function makeCall(player) {
  // Calculate the correct amount to call (difference between current bet and player's bet)
  const callAmount = currentBet - player.bet;
  
  if (player.stack <= callAmount) {
    // All-in call (can only call with what you have)
    const allInAmount = player.stack;
    pot += allInAmount;
    player.bet += allInAmount;
    player.totalBet += allInAmount;
    player.stack = 0;
    player.allIn = true;
    
    addLog(`${player.name} calls all-in with $${allInAmount}!`, "bet");
    showPlayerAction(player.id, "All-In", player.bet);
  } else {
    // Regular call
    player.stack -= callAmount;
    pot += callAmount;
    player.bet = currentBet;
    player.totalBet += callAmount;
    
    addLog(`${player.name} calls $${callAmount}.`, "action");
    showPlayerAction(player.id, "Call", callAmount);
  }
  
  moveToNextPlayer();
}

function makeCheck(player) {
  addLog(`${player.name} checks.`, "action");
  showPlayerAction(player.id, "Check");
  
  moveToNextPlayer();
}

// Fixed version of makeFold for proper handling
function makeFold(player) {
  player.folded = true;
  player.active = false;
  
  addLog(`${player.name} folds.`, "fold");
  showPlayerAction(player.id, "Fold");
  
  document.getElementById(`player-${player.id}`).classList.add("folded");
  
  // Special check - if only one active player remains after folding
  const remainingPlayers = players.filter(p => !p.folded);
  if (remainingPlayers.length === 1) {
    // Immediately advance the game if only one player remains
    setTimeout(() => advanceGame(), 1000);
    return;
  }
  
  moveToNextPlayer();
}


// Determine hand tier (like blackjack dealer rules)
function calculateHandTier(handValue) {
  // Define base expected values for different stages
  let maxExpectedValue;

  if (currentStage === "preflop") {
    maxExpectedValue = 26; // Two cards, max 13 each
  } else if (currentStage === "arena") {
    maxExpectedValue = 34; // Adding arena bonuses (up to +8)
  } else if (currentStage.startsWith("power")) {
    // Add 5 points per power card
    const powerCount = parseInt(currentStage.charAt(5)) || 0;
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

// Determine if AI should bluff (rare chance)
function determineIfShouldBluff(ai, handTier) {
  // Base bluff chance
  let bluffChance = 0;

  // Premium hands never bluff
  if (handTier === "premium") return false;

  // Base bluff chance by hand tier
  if (handTier === "weak") bluffChance = 0.08; // 8% chance with weak hands
  if (handTier === "average") bluffChance = 0.05; // 5% chance with average hands
  if (handTier === "strong") bluffChance = 0.02; // 2% chance with strong hands

  // Adjust by position
  const position = getPlayerPosition(ai);
  if (position === "late") bluffChance += 0.05; // More likely in late position

  // Adjust by pot size (more likely to bluff for small pots)
  if (pot < bigBlind * 5) bluffChance += 0.03;

  // Adjust by game stage (more likely to bluff pre-flop)
  if (currentStage === "preflop") bluffChance += 0.04;

  return Math.random() < bluffChance;
}

// Get player position type
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

// Execute bluff
function executeBluff(ai) {
  if (currentBet === 0) {
    // No bet yet - make a bet that suggests strength
    const bluffSize = Math.min(Math.max(pot * 0.7, bigBlind * 2), ai.stack);

    ai.stack -= bluffSize;
    pot += bluffSize;
    ai.bet = bluffSize;
    ai.totalBet += bluffSize;
    currentBet = bluffSize;
    minRaise = bluffSize;
    lastRaiser = ai;

    addLog(`${ai.name} bets $${bluffSize}.`, "bet");
    showPlayerAction(ai.id, "Bet", bluffSize);
  } else {
    // There's a bet - raise to suggest strength
    const callAmount = currentBet - ai.bet;

    if (ai.stack > callAmount * 2) {
      // Enough to raise
      const raiseSize = Math.min(currentBet * 2, ai.stack + ai.bet);
      const raiseAmount = raiseSize - ai.bet;

      ai.stack -= raiseAmount;
      pot += raiseAmount;
      lastRaiseAmount = raiseSize - currentBet;
      minRaise = lastRaiseAmount;
      currentBet = raiseSize;
      ai.bet = raiseSize;
      ai.totalBet += raiseAmount;
      lastRaiser = ai;

      addLog(`${ai.name} raises to $${raiseSize}.`, "bet");
      showPlayerAction(ai.id, "Raise", raiseSize);
    } else {
      // Not enough to raise meaningfully, just call
      if (ai.stack <= callAmount) {
        // All-in call
        pot += ai.stack;
        ai.bet += ai.stack;
        ai.totalBet += ai.stack;
        ai.stack = 0;
        ai.allIn = true;

        addLog(`${ai.name} calls all-in with $${ai.bet}!`, "bet");
        showPlayerAction(ai.id, "All-In", ai.bet);
      } else {
        // Regular call
        ai.stack -= callAmount;
        pot += callAmount;
        ai.bet = currentBet;
        ai.totalBet += callAmount;

        addLog(`${ai.name} calls $${callAmount}.`, "action");
        showPlayerAction(ai.id, "Call", callAmount);
      }
    }
  }

  // Continue game flow
  moveToNextPlayer();
}

// Execute normal play based on hand tier (clear rules like blackjack)
function executeNormalPlay(ai, handTier) {
  // Rules similar to blackjack's "dealer stands on 17"
  if (currentBet === 0) {
    // No bet yet

    // Rule 1: Premium hands always bet 3/4 pot
    if (handTier === "premium") {
      const betSize = Math.min(Math.max(pot * 0.75, bigBlind * 2), ai.stack);

      ai.stack -= betSize;
      pot += betSize;
      ai.bet = betSize;
      ai.totalBet += betSize;
      currentBet = betSize;
      minRaise = betSize;
      lastRaiser = ai;

      addLog(`${ai.name} bets $${betSize}.`, "bet");
      showPlayerAction(ai.id, "Bet", betSize);
    }
    // Rule 2: Strong hands bet 1/2 pot
    else if (handTier === "strong") {
      const betSize = Math.min(Math.max(pot * 0.5, bigBlind), ai.stack);

      ai.stack -= betSize;
      pot += betSize;
      ai.bet = betSize;
      ai.totalBet += betSize;
      currentBet = betSize;
      minRaise = betSize;
      lastRaiser = ai;

      addLog(`${ai.name} bets $${betSize}.`, "bet");
      showPlayerAction(ai.id, "Bet", betSize);
    }
    // Rule 3: Average hands in late position bet 1/3 pot
    else if (handTier === "average" && getPlayerPosition(ai) === "late") {
      const betSize = Math.min(Math.max(pot * 0.3, bigBlind), ai.stack);

      ai.stack -= betSize;
      pot += betSize;
      ai.bet = betSize;
      ai.totalBet += betSize;
      currentBet = betSize;
      minRaise = betSize;
      lastRaiser = ai;

      addLog(`${ai.name} bets $${betSize}.`, "bet");
      showPlayerAction(ai.id, "Bet", betSize);
    }
    // Rule 4: All other cases, check
    else {
      addLog(`${ai.name} checks.`, "action");
      showPlayerAction(ai.id, "Check");
    }
  } else {
    // There's a bet already
    const callAmount = currentBet - ai.bet;

    // Rule 5: Premium hands raise pot-sized
    if (handTier === "premium") {
      if (ai.stack > callAmount * 2) {
        // Have enough to raise
        const raiseSize = Math.min(currentBet * 2, ai.stack + ai.bet);
        const raiseAmount = raiseSize - ai.bet;

        ai.stack -= raiseAmount;
        pot += raiseAmount;
        lastRaiseAmount = raiseSize - currentBet;
        minRaise = lastRaiseAmount;
        currentBet = raiseSize;
        ai.bet = raiseSize;
        ai.totalBet += raiseAmount;
        lastRaiser = ai;

        addLog(`${ai.name} raises to $${raiseSize}.`, "bet");
        showPlayerAction(ai.id, "Raise", raiseSize);
      } else {
        // Not enough to raise, call all-in
        if (ai.stack <= callAmount) {
          pot += ai.stack;
          ai.bet += ai.stack;
          ai.totalBet += ai.stack;
          ai.stack = 0;
          ai.allIn = true;

          addLog(`${ai.name} calls all-in with $${ai.bet}!`, "bet");
          showPlayerAction(ai.id, "All-In", ai.bet);
        } else {
          ai.stack -= callAmount;
          pot += callAmount;
          ai.bet = currentBet;
          ai.totalBet += callAmount;

          addLog(`${ai.name} calls $${callAmount}.`, "action");
          showPlayerAction(ai.id, "Call", callAmount);
        }
      }
    }
    // Rule 6: Strong hands always call, occasionally raise
    else if (handTier === "strong") {
      if (Math.random() < 0.3 && ai.stack > callAmount * 3) {
        // 30% chance to raise with strong hand
        const raiseSize = Math.min(currentBet * 1.5, ai.stack + ai.bet);
        const raiseAmount = raiseSize - ai.bet;

        ai.stack -= raiseAmount;
        pot += raiseAmount;
        lastRaiseAmount = raiseSize - currentBet;
        minRaise = lastRaiseAmount;
        currentBet = raiseSize;
        ai.bet = raiseSize;
        ai.totalBet += raiseAmount;
        lastRaiser = ai;

        addLog(`${ai.name} raises to $${raiseSize}.`, "bet");
        showPlayerAction(ai.id, "Raise", raiseSize);
      } else if (ai.stack <= callAmount) {
        // All-in call
        pot += ai.stack;
        ai.bet += ai.stack;
        ai.totalBet += ai.stack;
        ai.stack = 0;
        ai.allIn = true;

        addLog(`${ai.name} calls all-in with $${ai.bet}!`, "bet");
        showPlayerAction(ai.id, "All-In", ai.bet);
      } else {
        // Regular call
        ai.stack -= callAmount;
        pot += callAmount;
        ai.bet = currentBet;
        ai.totalBet += callAmount;

        addLog(`${ai.name} calls $${callAmount}.`, "action");
        showPlayerAction(ai.id, "Call", callAmount);
      }
    }
    // Rule 7: Average hands call small bets (≤20% of stack)
    else if (handTier === "average" && callAmount <= ai.stack * 0.2) {
      if (ai.stack <= callAmount) {
        // All-in call
        pot += ai.stack;
        ai.bet += ai.stack;
        ai.totalBet += ai.stack;
        ai.stack = 0;
        ai.allIn = true;

        addLog(`${ai.name} calls all-in with $${ai.bet}!`, "bet");
        showPlayerAction(ai.id, "All-In", ai.bet);
      } else {
        // Regular call
        ai.stack -= callAmount;
        pot += callAmount;
        ai.bet = currentBet;
        ai.totalBet += callAmount;

        addLog(`${ai.name} calls $${callAmount}.`, "action");
        showPlayerAction(ai.id, "Call", callAmount);
      }
    }
    // Rule 8: Weak hands call very small bets (≤10% of stack)
    else if (handTier === "weak" && callAmount <= ai.stack * 0.1) {
      ai.stack -= callAmount;
      pot += callAmount;
      ai.bet = currentBet;
      ai.totalBet += callAmount;

      addLog(`${ai.name} calls small bet $${callAmount}.`, "action");
      showPlayerAction(ai.id, "Call", callAmount);
    }
    // Rule 9: Otherwise fold
    else {
      ai.folded = true;
      ai.active = false;

      addLog(`${ai.name} folds.`, "fold");
      showPlayerAction(ai.id, "Fold");

      document.getElementById(`player-${ai.id}`).classList.add("folded");
    }
  }

  // Continue game flow
  moveToNextPlayer();
}

// Fixed version of moveToNextPlayer with better handling of folded players
function moveToNextPlayer() {
  // Update UI
  updateStacks();
  updatePotDisplay();
  renderHands();
  
  // If betting round is complete, advance to the next stage
  if (isBettingRoundComplete()) {
    console.log("Betting round complete, advancing game");
    advanceGame();
    return;
  }
  
  // Otherwise, move to the next player
  activePlayerIndex = (activePlayerIndex + 1) % players.length;
  
  // Skip folded or all-in players
  let loopCount = 0;
  while ((players[activePlayerIndex].folded || players[activePlayerIndex].allIn) && loopCount < players.length) {
    activePlayerIndex = (activePlayerIndex + 1) % players.length;
    loopCount++;
  }
  
  // If we've looped through all players, betting must be complete
  if (loopCount >= players.length) {
    console.log("No more active players to act, advancing game");
    advanceGame();
    return;
  }
  
  // Process AI player's action or activate human player
  if (!players[activePlayerIndex].isHuman) {
    // Add a delay before AI action for a more natural flow
    setTimeout(processAIActions, 800);
  } else {
    activateHumanPlayer();
  }
}

// Helper to highlight active player
function highlightActivePlayer() {
  players.forEach((player, index) => {
    const playerEl = document.getElementById(`player-${player.id}`);
    if (index === activePlayerIndex) {
      playerEl.classList.add("active");
    } else {
      playerEl.classList.remove("active");
    }
  });
}

function advanceGame() {
  hideMessage();
  
  // Check if only one player remains
  const activePlayers = players.filter(p => !p.folded);
  if (activePlayers.length === 1) {
    // One player wins by default
    setTimeout(() => {
      showdown(true);
    }, 1000);
    return;
  }
  
  // Reset for next stage
  bettingRoundComplete = false;
  
  // Otherwise advance to next stage properly
  if (currentStage === "preflop") {
    // After preflop, reveal arena
    setTimeout(() => {
      revealArena();
      // Wait a bit before starting the next betting round
      setTimeout(() => {
        beginBettingRound();
      }, 2000);
    }, 1000);
  } 
  else if (currentStage === "arena") {
    // After arena, add first power card
    setTimeout(() => {
      addPowerCard(); // This sets stage to power1
      // Wait before starting next betting round
      setTimeout(() => {
        beginBettingRound();
      }, 2000);
    }, 1000);
  } 
  else if (currentStage === "power1") {
    // After first power card, add second power card
    setTimeout(() => {
      addPowerCard(); // This sets stage to power2
      // Wait before starting next betting round
      setTimeout(() => {
        beginBettingRound();
      }, 2000);
    }, 1000);
  } 
  else if (currentStage === "power2") {
    // After second power card, add third and final power card
    setTimeout(() => {
      addPowerCard(); // This sets stage to power3
      // Wait before starting next betting round
      setTimeout(() => {
        beginBettingRound();
      }, 2000);
    }, 1000);
  } 
  else if (currentStage === "power3") {
    // After final power round, go to showdown
    setTimeout(() => {
      showdown();
    }, 1000);
  }
}

// Determine hand tier (like blackjack dealer rules)
function calculateHandTier(handValue) {
  // Define base expected values for different stages
  let maxExpectedValue;
  
  if (currentStage === "preflop") {
    maxExpectedValue = 26; // Two cards, max 13 each
  } else if (currentStage === "arena") {
    maxExpectedValue = 34; // Adding arena bonuses (up to +8)
  } else if (currentStage.startsWith("power")) {
    // Add 5 points per power card
    const powerCount = parseInt(currentStage.charAt(5)) || 0;
    maxExpectedValue = 34 + (powerCount * 5);
  } else {
    maxExpectedValue = 26; // Default
  }
  
  // Define strict tier thresholds (like blackjack's rules)
  const weakThreshold = maxExpectedValue * 0.40;    // Bottom 40%
  const averageThreshold = maxExpectedValue * 0.60;  // 40-60%
  const strongThreshold = maxExpectedValue * 0.75;   // 60-75%
  // Premium is top 25%
  
  // Classify hand into tier
  if (handValue < weakThreshold) return "weak";
  if (handValue < averageThreshold) return "average";
  if (handValue < strongThreshold) return "strong";
  return "premium";
}

// Determine if AI should bluff (rare chance)
function determineIfShouldBluff(ai, handTier) {
  // Base bluff chance
  let bluffChance = 0;
  
  // Premium hands never bluff
  if (handTier === "premium") return false;
  
  // Base bluff chance by hand tier
  if (handTier === "weak") bluffChance = 0.08;     // 8% chance with weak hands
  if (handTier === "average") bluffChance = 0.05;  // 5% chance with average hands
  if (handTier === "strong") bluffChance = 0.02;   // 2% chance with strong hands
  
  // Adjust by position
  const position = getPlayerPosition(ai);
  if (position === "late") bluffChance += 0.05;    // More likely in late position
  
  // Adjust by pot size (more likely to bluff for small pots)
  if (pot < bigBlind * 5) bluffChance += 0.03;
  
  // Adjust by game stage (more likely to bluff pre-flop)
  if (currentStage === "preflop") bluffChance += 0.04;
  
  return Math.random() < bluffChance;
}

// Get player position type
function getPlayerPosition(player) {
  const positionEl = document.querySelector(`#player-${player.id} .player-position`);
  if (!positionEl) return "middle";
  
  const position = positionEl.textContent;
  
  // Late positions have advantage
  if (position === "BTN" || position === "CO") return "late";
  // Early positions are disadvantaged
  if (position === "SB" || position === "BB" || position === "UTG") return "early";
  
  return "middle";
}

function allPlayersHaveActed() {
  // In a real implementation, you would track player actions in a round
  // For simplicity, we'll assume all have acted if no bets are present
  return players.filter(p => !p.folded && p.bet > 0).length === 0;
}

// Show final showdown
function showdown(singleWinner = false) {
  currentStage = "showdown";

  // Reveal all cards
  renderHands();

  // Calculate final hand values
  let results = [];
  players.forEach((player, index) => {
    if (player.folded) {
      results.push({ player, name: player.name, value: -Infinity });
    } else {
      const handValue = player.hand.reduce(
        (sum, card) => sum + calculateCardValue(card),
        0
      );
      results.push({ player, name: player.name, value: handValue });
    }
  });

  // Sort by hand value (highest first)
  results.sort((a, b) => b.value - a.value);

  // Find winner(s)
  const winner = results[0];

  if (singleWinner) {
    addLog(`${winner.name} wins $${pot} as the only remaining player!`, "win");
  } else {
    addLog(
      `Showdown! ${winner.name} wins with ${winner.value} points and takes $${pot}!`,
      "win"
    );
  }

  // Award pot to winner
  winner.player.stack += pot;

  // Show winner overlay
  const winnerOverlay = document.getElementById("winner-overlay");
  const winnerTitle = document.getElementById("winner-title");
  const winnerInfo = document.getElementById("winner-info");
  const winnerCards = document.getElementById("winner-cards");
  const winnerPot = document.getElementById("winner-pot");

  winnerTitle.textContent = `${winner.name} Wins!`;

  if (singleWinner) {
    winnerInfo.textContent = `as the only remaining player`;
  } else {
    winnerInfo.textContent = `with Monster Total: ${winner.value}`;
  }

  // Display winner's cards
  winnerCards.innerHTML = "";
  winner.player.hand.forEach((card) => {
    let cardDiv = document.createElement("div");
    cardDiv.className = `card monster ${card.element.toLowerCase()}-card winner-glow`;

    let bonus = calculateCardValue(card) - card.value;
    let bonusClass = bonus >= 0 ? "bonus-positive" : "bonus-negative";

    let iconHTML = getIcon(card.element);
    cardDiv.innerHTML = `
      <div class="card-type">${iconHTML} ${card.element}</div>
      <div class="card-name">${card.name}</div>
      <div class="card-value">${card.value}</div>
      <div class="bonus-indicator ${bonusClass}">${
      bonus >= 0 ? "+" + bonus : bonus
    }</div>
    `;

    winnerCards.appendChild(cardDiv);
  });

  winnerPot.textContent = `Pot: $${pot}`;

  // Show overlay
  winnerOverlay.classList.add("visible");

  // Update stacks
  updateStacks();

  // Show restart button
  document.getElementById("restart-button").style.display = "block";
}

/* --- Event Listeners --- */

// Start button
document.getElementById("start-button").addEventListener("click", () => {
  initGame();
});

// Restart button
document.getElementById("restart-button").addEventListener("click", () => {
  resetRound();
});

// Continue button in winner overlay
document.getElementById("continue-button").addEventListener("click", () => {
  document.getElementById("winner-overlay").classList.remove("visible");
  resetRound();
});

// Check button
document.getElementById("check-button").addEventListener("click", () => {
  processHumanAction("Check");
});

// Call button
document.getElementById("call-button").addEventListener("click", () => {
  processHumanAction("Call");
});

// Bet button
document.getElementById("bet-button").addEventListener("click", () => {
  // Show bet slider
  const betSlider = document.getElementById("bet-slider");
  const betAmountDisplay = document.getElementById("bet-amount-display");
  const human = players.find((p) => p.isHuman);

  // Set min/max/value
  betSlider.min = Math.max(bigBlind, minRaise);
  betSlider.max = human.stack;
  betSlider.value = Math.min(Math.max(bigBlind, pot / 2), human.stack);

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
});

// Raise button
document.getElementById("raise-button").addEventListener("click", () => {
  // Show bet slider
  const betSlider = document.getElementById("bet-slider");
  const betAmountDisplay = document.getElementById("bet-amount-display");
  const human = players.find((p) => p.isHuman);

  // Set min/max/value
  betSlider.min = currentBet + minRaise;
  betSlider.max = human.stack + human.bet;
  betSlider.value = Math.min(currentBet + minRaise, human.stack + human.bet);

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
});

// Fold button
document.getElementById("fold-button").addEventListener("click", () => {
  processHumanAction("Fold");
});

// All-in button
document.getElementById("all-in-button").addEventListener("click", () => {
  processHumanAction("All-In");
});

// Bet slider
document.getElementById("bet-slider").addEventListener("input", (e) => {
  document.getElementById("bet-amount-display").textContent =
    "$" + e.target.value;
});

// Confirm bet button
document.getElementById("confirm-bet-button").addEventListener("click", () => {
  const betAmount = parseInt(document.getElementById("bet-slider").value);
  const action = currentBet > 0 ? "Raise" : "Bet";

  // Reset display
  document.getElementById("bet-slider-container").style.display = "none";
  document.getElementById("check-button").style.display = "inline-block";
  document.getElementById("call-button").style.display = "inline-block";
  document.getElementById("bet-button").style.display = "inline-block";
  document.getElementById("fold-button").style.display = "inline-block";
  document.getElementById("all-in-button").style.display = "inline-block";

  // Process the bet/raise
  processHumanAction(action, betAmount);
});

// Cancel bet button
document.getElementById("cancel-bet-button").addEventListener("click", () => {
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
  updateActionButtons();
});

// Clear log button
document.getElementById("clear-log").addEventListener("click", () => {
  document.getElementById("game-log").innerHTML = "";
});

// Initialize the application when page loads
document.addEventListener("DOMContentLoaded", () => {
  // Set up event handlers
  document.getElementById("start-button").style.display = "block";
  hideMessage();
});

// Update player position and blind status display
function updatePositionLabels() {
  // First, clear all position labels
  players.forEach(player => {
    const positionEl = document.querySelector(`#player-${player.id} .player-position`);
    if (positionEl) {
      positionEl.textContent = ""; // Clear all position text
      positionEl.className = "player-position"; // Reset all classes
    }
  });
  
  // Determine which positions each player has
  const dealerPlayerIndex = dealerPosition;
  const sbPlayerIndex = (dealerPosition + 1) % 4;
  const bbPlayerIndex = (dealerPosition + 2) % 4;
  const utgPlayerIndex = (dealerPosition + 3) % 4;
  
  // Apply position tags with specific styling
  const dealerPositionEl = document.querySelector(`#player-${players[dealerPlayerIndex].id} .player-position`);
  if (dealerPositionEl) {
    dealerPositionEl.textContent = "BTN";
    dealerPositionEl.className = "player-position dealer";
  }
  
  const sbPositionEl = document.querySelector(`#player-${players[sbPlayerIndex].id} .player-position`);
  if (sbPositionEl) {
    sbPositionEl.textContent = "SB";
    sbPositionEl.className = "player-position small-blind";
  }
  
  const bbPositionEl = document.querySelector(`#player-${players[bbPlayerIndex].id} .player-position`);
  if (bbPositionEl) {
    bbPositionEl.textContent = "BB";
    bbPositionEl.className = "player-position big-blind";
  }
  
  const utgPositionEl = document.querySelector(`#player-${players[utgPlayerIndex].id} .player-position`);
  if (utgPositionEl) {
    utgPositionEl.textContent = "UTG";
    utgPositionEl.className = "player-position";
  }
  
  // Also update the buttons positioning
  positionBlindButtons();
}

// Make position labels more noticeable
const css = `
.player .player-position {
  font-size: 14px;
  font-weight: bold;
  padding: 3px 8px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.15);
  margin-left: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.player .player-position.dealer {
  background: rgba(233, 30, 99, 0.7);
  color: white;
  box-shadow: 0 0 8px rgba(233, 30, 99, 0.7);
}

.player .player-position.small-blind {
  background: rgba(33, 150, 243, 0.7);
  color: white;
  box-shadow: 0 0 8px rgba(33, 150, 243, 0.7);
}

.player .player-position.big-blind {
  background: rgba(255, 152, 0, 0.7);
  color: white;
  box-shadow: 0 0 8px rgba(255, 152, 0, 0.7);
}
`;

// Add the CSS to the page
const style = document.createElement('style');
style.textContent = css;
document.head.appendChild(style);

function debugGameState() {
  console.log("===== GAME STATE DEBUG =====");
  console.log("Current Stage:", currentStage);
  console.log("Active Player Index:", activePlayerIndex);
  console.log("Current Bet:", currentBet);
  console.log("Pot:", pot);
  console.log("Dealer Position:", dealerPosition);
  
  console.log("Players:");
  players.forEach((player, index) => {
    console.log(`${index}: ${player.name} - Stack: $${player.stack}, Bet: $${player.bet}, Total Bet: $${player.totalBet}, Folded: ${player.folded}, All-in: ${player.allIn}`);
  });
  
  console.log("==========================");
}