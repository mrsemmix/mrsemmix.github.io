/*
 * pokermon-engine.js
 * Core game engine and betting logic
 */

// Initialize game
function initGame() {
  console.log("Initializing game...");

  // Prevent multiple initializations
  if (GAME.state.gameStarted) {
    console.log("Game already started, ignoring duplicate initialization");
    return;
  }

  // Create and shuffle deck
  GAME.state.deck = GAME.utils.shuffle(GAME.utils.createDeck());

  // Initialize players
  GAME.state.players = [
    {
      id: "human",
      name: "You",
      hand: [],
      isHuman: true,
      active: true,
      bet: 0,
      totalBet: 0,
      stack: GAME.STARTING_STACK,
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
      stack: GAME.STARTING_STACK,
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
      stack: GAME.STARTING_STACK,
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
      stack: GAME.STARTING_STACK,
      folded: false,
      allIn: false,
    },
  ];

  // Reset game state
  GAME.state.arenaCard = null;
  GAME.state.powerCards = [];
  GAME.state.currentStage = "preflop";
  GAME.state.pot = 0;
  GAME.state.currentBet = 0;
  GAME.state.minRaise = GAME.BIG_BLIND;
  GAME.state.bettingRoundComplete = false;
  GAME.state.sidePots = [];
  GAME.state.mainPot = 0;
  GAME.state.gameStarted = true;
  GAME.state.hasBettingStarted = false;
  GAME.state.playersActedThisRound = [];

  // Clear all visual elements
  clearAllCards();

  // Update UI
  GAME.utils.updatePotDisplay();
  GAME.utils.updateStacks();
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
  GAME.utils.rotatePositions();

  GAME.utils.addLog("Game started. Dealing Monster Cards...", "action");

  // Reset player statuses
  GAME.state.players.forEach((player) => {
    const playerEl = document.getElementById(`player-${player.id}`);
    playerEl.classList.remove("active", "folded");
    document.getElementById(`${player.id}-bet-amount`).style.display = "none";
    document.getElementById(`${player.id}-chips`).innerHTML = "";
  });

  // Deal initial cards and start the game
  setTimeout(dealInitialCards, 500);
}

// Helper function to clear all cards
function clearAllCards() {
  GAME.state.players.forEach((player) => {
    const cardContainer = document.getElementById(`${player.id}-cards`);
    if (cardContainer) {
      cardContainer.innerHTML = "";
    }

    // Clear hand arrays as well
    if (player.hand) {
      player.hand = [];
    }
  });

  const powerCardContainer = document.getElementById("power-cards");
  if (powerCardContainer) {
    powerCardContainer.innerHTML = "";
  }
}

// Reset for a new round (preserving stacks)
function resetRound() {
  console.log("Resetting for new round");

  // Create and shuffle deck
  GAME.state.deck = GAME.utils.shuffle(GAME.utils.createDeck());

  // Reset player states but keep stacks
  GAME.state.players.forEach((player) => {
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
  GAME.state.arenaCard = null;
  GAME.state.powerCards = [];
  GAME.state.currentStage = "preflop";
  GAME.state.pot = 0;
  GAME.state.currentBet = 0;
  GAME.state.minRaise = GAME.BIG_BLIND;
  GAME.state.bettingRoundComplete = false;
  GAME.state.sidePots = [];
  GAME.state.mainPot = 0;
  GAME.state.hasBettingStarted = false;
  GAME.state.playersActedThisRound = [];

  // Update UI
  GAME.utils.updatePotDisplay();
  GAME.utils.updateStacks();

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
  GAME.utils.updateGameStage("preflop");

  // Set positions and blinds
  GAME.utils.rotatePositions();

  GAME.utils.addLog("New round starting. Dealing Monster Cards...", "action");

  // Deal initial cards and start the game
  setTimeout(dealInitialCards, 500);
}

// Deal initial cards
function dealInitialCards() {
  console.log("Dealing initial cards...");

  // Clear any existing cards first
  GAME.state.players.forEach((player) => {
    player.hand = []; // Reset hand array
    const container = document.getElementById(`${player.id}-cards`);
    if (container) {
      container.innerHTML = ""; // Clear visual cards
    }
  });

  // Deal exactly 2 cards to each player
  for (let cardIndex = 0; cardIndex < 2; cardIndex++) {
    for (
      let playerIndex = 0;
      playerIndex < GAME.state.players.length;
      playerIndex++
    ) {
      const player = GAME.state.players[playerIndex];
      const card = GAME.state.deck.pop();

      // Add card to player's hand array
      player.hand.push(card);
      console.log(
        `Dealt card to ${player.name}, hand size: ${player.hand.length}`
      );

      // Create visual representation with animation
      const delay = 200 * (cardIndex * GAME.state.players.length + playerIndex);
      setTimeout(() => {
        const container = document.getElementById(`${player.id}-cards`);

        if (player.isHuman) {
          // Create the card HTML for human player
          let cardDiv = document.createElement("div");
          cardDiv.className = `card monster ${card.element.toLowerCase()}-card card-deal`;

          let iconHTML = GAME.utils.getIcon(card.element);
          cardDiv.innerHTML = `
            <div class="card-type">${iconHTML} ${card.element}</div>
            <div class="card-name">${card.name}</div>
            <div class="card-value">${card.value}</div>
            <div class="bonus-indicator">${
              GAME.utils.calculateCardValue(card) - card.value >= 0
                ? "+" + (GAME.utils.calculateCardValue(card) - card.value)
                : GAME.utils.calculateCardValue(card) - card.value
            }</div>
          `;
          container.appendChild(cardDiv);
        } else {
          // Create card back for AI players
          let cardDiv = document.createElement("div");
          cardDiv.className = "card card-back card-deal";
          container.appendChild(cardDiv);
        }
      }, delay);
    }
  }

  // After all cards are dealt, post blinds and start first betting round
  const totalDelay = 200 * (2 * GAME.state.players.length) + 500;
  setTimeout(() => {
    postBlinds();
    GAME.utils.updatePositionLabels();
    GAME.utils.positionBlindButtons();
    beginBettingRound();
  }, totalDelay);
}

// Post blinds
function postBlinds() {
  // Find small blind and big blind players
  const sbPositionIndex = (GAME.state.dealerPosition + 1) % 4;
  const bbPositionIndex = (GAME.state.dealerPosition + 2) % 4;

  // Reset all bets to zero first
  GAME.state.players.forEach((player) => {
    player.bet = 0;
    player.totalBet = 0;
  });

  // Post small blind
  const sbPlayer = GAME.state.players[sbPositionIndex];
  const sbAmount = Math.min(GAME.SMALL_BLIND, sbPlayer.stack);
  sbPlayer.bet = sbAmount;
  sbPlayer.totalBet = sbAmount;
  sbPlayer.stack -= sbAmount;
  GAME.state.pot += sbAmount;

  // Post big blind
  const bbPlayer = GAME.state.players[bbPositionIndex];
  const bbAmount = Math.min(GAME.BIG_BLIND, bbPlayer.stack);
  bbPlayer.bet = bbAmount;
  bbPlayer.totalBet = bbAmount;
  bbPlayer.stack -= bbAmount;
  GAME.state.pot += bbAmount;

  // Set current bet to big blind
  GAME.state.currentBet = bbAmount;

  // Log the blinds
  GAME.utils.addLog(`${sbPlayer.name} posts small blind: $${sbAmount}`, "bet");
  GAME.utils.addLog(`${bbPlayer.name} posts big blind: $${bbAmount}`, "bet");

  // Update UI
  GAME.utils.updateStacks();
  GAME.utils.updatePotDisplay();

  // Show player actions
  GAME.utils.showPlayerAction(sbPlayer.id, "Small Blind", sbAmount);
  GAME.utils.showPlayerAction(bbPlayer.id, "Big Blind", bbAmount);

  // Action starts with player after big blind (UTG)
  GAME.state.activePlayerIndex = (bbPositionIndex + 1) % 4;
  console.log(
    "First to act:",
    GAME.state.players[GAME.state.activePlayerIndex].name,
    "at index",
    GAME.state.activePlayerIndex
  );
}

// Check if betting round is complete
function isBettingRoundComplete() {
  console.log("Checking if betting round is complete...");

  // If no one has acted yet in this round, it can't be complete
  if (
    !GAME.state.hasBettingStarted ||
    GAME.state.playersActedThisRound.length === 0
  ) {
    console.log("Betting round not complete - no one has acted yet");
    return false;
  }

  // Get active players (not folded, not all-in)
  const activePlayers = GAME.state.players.filter((p) => !p.folded && !p.allIn);
  console.log(`Active Players :${activePlayers.map((p) => p.name + " ")}`)

  // Special case for big blind's option
  if (GAME.state.currentStage === "preflop" && GAME.state.lastRaiser === null) {
    // Find big blind player
    const bbPlayerIndex = (GAME.state.dealerPosition + 2) % 4;
    const bbPlayer = GAME.state.players[bbPlayerIndex];

    // If BB hasn't acted yet, we need to give them a chance to act
    if (
      !GAME.state.playersActedThisRound.includes(bbPlayer.id) &&
      !bbPlayer.folded &&
      !bbPlayer.allIn
    ) {
      console.log("BB hasn't acted yet, round not complete");
      return false;
    }
  }

  // Check if all active players have acted and matched the current bet
  const allActed = activePlayers.every((p) =>
    GAME.state.playersActedThisRound.includes(p.id)
  );
  const allMatchedOrAllIn = activePlayers.every(
    (p) => p.bet === GAME.state.currentBet || p.allIn
  );

  console.log(
    `All active players acted: ${allActed}, All matched bet: ${allMatchedOrAllIn}`
  );
  console.log(
    `Bet amounts: ${activePlayers
      .map((p) => p.name + ": $" + p.bet)
      .join(", ")}`
  );

  return allActed && allMatchedOrAllIn;
}

// Begin betting round
function beginBettingRound() {
  console.log("Starting betting round for stage:", GAME.state.currentStage);

  // Safety check to prevent multiple calls
  if (GAME.state._beginBettingRoundInProgress) {
    console.log("Already starting betting round, ignoring duplicate call");
    return;
  }

  GAME.state._beginBettingRoundInProgress = true;

  // Reset our tracking variables
  GAME.state.hasBettingStarted = true;
  GAME.state.playersActedThisRound = [];

  // Reset bets for the new round, preserving totalBet
  if (GAME.state.currentStage !== "preflop") {
    GAME.state.players.forEach((player) => {
      player.bet = 0; // Reset current round bet
    });

    // Reset currentBet to 0 except for preflop
    GAME.state.currentBet = 0;
    GAME.state.minRaise = GAME.BIG_BLIND;
  }

  // Reset betting round state
  GAME.state.bettingRoundComplete = false;
  GAME.state.lastRaiser = null;

  // Set the correct starting player based on the game stage
  if (GAME.state.currentStage === "preflop") {
    // Preflop starts with UTG (player after big blind)
    GAME.state.activePlayerIndex =
      (GAME.state.dealerPosition + 3) % GAME.state.players.length;
    console.log(
      "Preflop starting with player index:",
      GAME.state.activePlayerIndex
    );
  } else {
    // Postflop starts with first active player after dealer button
    GAME.state.activePlayerIndex =
      (GAME.state.dealerPosition + 1) % GAME.state.players.length;
    console.log(
      "Postflop starting with player index:",
      GAME.state.activePlayerIndex
    );
  }

  // Skip folded or all-in players
  let loopCount = 0;
  while (
    (GAME.state.players[GAME.state.activePlayerIndex].folded ||
      GAME.state.players[GAME.state.activePlayerIndex].allIn) &&
    loopCount < GAME.state.players.length
  ) {
    GAME.state.activePlayerIndex =
      (GAME.state.activePlayerIndex + 1) % GAME.state.players.length;
    loopCount++;
  }

  // If all players but one are folded or all-in, advance the game
  if (loopCount >= GAME.state.players.length - 1) {
    console.log("Only one active player or everyone all-in, advancing game");
    GAME.state._beginBettingRoundInProgress = false;
    advanceGame();
    return;
  }

  // Update player UI to show active player
  highlightActivePlayer();

  // Process non-human players immediately, activate human player for action
  if (!GAME.state.players[GAME.state.activePlayerIndex].isHuman) {
    setTimeout(() => {
      GAME.state._beginBettingRoundInProgress = false;
      processAIActions();
    }, 800);
  } else {
    GAME.state._beginBettingRoundInProgress = false;
    activateHumanPlayer();
  }
}

// Move to next player
function moveToNextPlayer() {
  console.log(
    "Moving to next player from",
    GAME.state.players[GAME.state.activePlayerIndex].name
  );

  // Mark current player as having acted
  const currentPlayer = GAME.state.players[GAME.state.activePlayerIndex];
  if (!GAME.state.playersActedThisRound.includes(currentPlayer.id)) {
    GAME.state.playersActedThisRound.push(currentPlayer.id);
  }

  console.log("Players acted this round:", GAME.state.playersActedThisRound);

  // Update UI
  GAME.utils.updateStacks();
  GAME.utils.updatePotDisplay();
  renderHands();

  // Check if betting round is complete
  if (isBettingRoundComplete()) {
    console.log("Betting round complete, advancing game");
    advanceGame();
    return;
  }

  // Otherwise, move to the next player
  GAME.state.activePlayerIndex =
    (GAME.state.activePlayerIndex + 1) % GAME.state.players.length;

  // Skip folded or all-in players
  let loopCount = 0;
  while (
    (GAME.state.players[GAME.state.activePlayerIndex].folded ||
      GAME.state.players[GAME.state.activePlayerIndex].allIn) &&
    loopCount < GAME.state.players.length
  ) {
    GAME.state.activePlayerIndex =
      (GAME.state.activePlayerIndex + 1) % GAME.state.players.length;
    loopCount++;
  }

  // If we've gone through all players, betting must be complete
  if (loopCount >= GAME.state.players.length) {
    console.log("No more players to act, advancing game");
    advanceGame();
    return;
  }

  // Update UI to show active player
  highlightActivePlayer();

  // Process AI player's action or activate human player
  if (!GAME.state.players[GAME.state.activePlayerIndex].isHuman) {
    // Add a delay before AI action for more natural flow
    setTimeout(() => processAIActions(), 800);
  } else {
    console.log("Human's turn, activating controls");
    activateHumanPlayer();
  }
}

// Activate human player for action
function activateHumanPlayer() {
  console.log("Activating human player for action");

  // Make sure the active player is the human player
  const human = GAME.state.players.find((p) => p.isHuman);
  const humanIndex = GAME.state.players.findIndex((p) => p.isHuman);

  // Explicitly check if the human player is active
  if (GAME.state.activePlayerIndex !== humanIndex) {
    console.error("Trying to activate human when not their turn!");
    return;
  }

  // Highlight active player visually
  GAME.state.players.forEach((player, index) => {
    const playerEl = document.getElementById(`player-${player.id}`);
    if (index === GAME.state.activePlayerIndex) {
      playerEl.classList.add("active");
    } else {
      playerEl.classList.remove("active");
    }
  });

  // Show betting controls for human player
  if (!human.folded && !human.allIn) {
    console.log("Showing betting controls for human player");
    const bettingControls = document.getElementById("betting-controls");
    bettingControls.classList.add("visible");

    // Reset button visibility
    document.getElementById("check-button").style.display = "inline-block";
    document.getElementById("call-button").style.display = "inline-block";
    document.getElementById("bet-button").style.display = "inline-block";
    document.getElementById("raise-button").style.display = "inline-block";
    document.getElementById("fold-button").style.display = "inline-block";
    document.getElementById("all-in-button").style.display = "inline-block";

    // Update available actions
    updateActionButtons();
    GAME.utils.showMessage("Your turn - choose your action");
  } else {
    console.log("Human player can't act (folded or all-in)");
    moveToNextPlayer();
  }
}

// Update available action buttons
function updateActionButtons() {
  const checkButton = document.getElementById("check-button");
  const callButton = document.getElementById("call-button");
  const betButton = document.getElementById("bet-button");
  const raiseButton = document.getElementById("raise-button");
  const allInButton = document.getElementById("all-in-button");

  // Get human player
  const human = GAME.state.players.find((p) => p.isHuman);

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
  const isBigBlind =
    GAME.state.currentStage === "preflop" &&
    document.querySelector(`#player-${human.id} .player-position`)
      .textContent === "BB";

  // If there's a bet (and it's higher than what the player has already bet), enable Call
  if (GAME.state.currentBet > human.bet) {
    checkButton.disabled = true;

    // Calculate call amount correctly
    const callAmount = GAME.state.currentBet - human.bet;

    // If human doesn't have enough to call, disable Call button
    if (human.stack < callAmount) {
      callButton.disabled = true;
    }

    // Enable/disable Raise based on stack size
    if (
      human.stack <= callAmount ||
      human.stack < GAME.BIG_BLIND // Use Big Blind as minimum raise
    ) {
      raiseButton.disabled = true;
    }

    // Show Raise instead of Bet when there's already a bet
    betButton.style.display = "none";
    raiseButton.style.display = "inline-block";
  }
  // If it's the big blind's option and no one has raised
  else if (
    isBigBlind &&
    human.bet === GAME.state.currentBet &&
    !GAME.state.lastRaiser
  ) {
    // Big blind can check or raise when no one has raised
    checkButton.disabled = false;
    callButton.disabled = true;

    // Show Bet instead of Raise when the BB checks
    betButton.style.display = "inline-block";
    raiseButton.style.display = "none";
  } else {
    // No bet or player has already matched the current bet, so enable Check and disable Call
    checkButton.disabled = false;
    callButton.disabled = true;

    // Show Bet instead of Raise when there's no bet
    betButton.style.display = "inline-block";
    raiseButton.style.display = "none";
  }

  // Update call button text
  if (callButton.disabled === false) {
    const callAmount = GAME.state.currentBet - human.bet;
    callButton.textContent = `Call $${callAmount}`;
  } else {
    callButton.textContent = "Call";
  }

  // If human can't bet the minimum, disable bet button
  if (human.stack < GAME.BIG_BLIND) {
    betButton.disabled = true;
  }
}

// Action functions
function makeCheck(player) {
  GAME.utils.addLog(`${player.name} checks.`, "action");
  GAME.utils.showPlayerAction(player.id, "Check");

  moveToNextPlayer();
}

function makeCall(player) {
  // Calculate the correct amount to call (difference between current bet and player's bet)
  const callAmount = GAME.state.currentBet - player.bet;
  console.log(
    `${player.name} calling. Current bet: ${GAME.state.currentBet}, Player bet: ${player.bet}, Call amount: ${callAmount}`
  );

  if (player.stack <= callAmount) {
    // All-in call (can only call with what you have)
    const allInAmount = player.stack;
    GAME.state.pot += allInAmount;
    player.bet += allInAmount;
    player.totalBet += allInAmount;
    player.stack = 0;
    player.allIn = true;

    GAME.utils.addLog(
      `${player.name} calls all-in with $${allInAmount}!`,
      "bet"
    );
    GAME.utils.showPlayerAction(player.id, "All-In", player.bet);
  } else {
    // Regular call
    player.stack -= callAmount;
    GAME.state.pot += callAmount;
    player.bet = GAME.state.currentBet;
    player.totalBet += callAmount;

    GAME.utils.addLog(`${player.name} calls $${callAmount}.`, "action");
    GAME.utils.showPlayerAction(player.id, "Call", callAmount);
  }

  moveToNextPlayer();
}

function makeBet(player, amount) {
  // Ensure bets are round numbers
  const betAmount = Math.floor(amount);

  // Use Big Blind as minimum bet instead of half pot
  const minimumBet = GAME.BIG_BLIND;
  const actualBetAmount = Math.max(betAmount, minimumBet);

  // Cap at player's stack
  const finalBetAmount = Math.min(actualBetAmount, player.stack);

  console.log(
    `${player.name} betting $${finalBetAmount}. Stack before: $${player.stack}`
  );

  player.stack -= finalBetAmount;
  GAME.state.pot += finalBetAmount;
  player.bet = finalBetAmount;
  player.totalBet += finalBetAmount;
  GAME.state.currentBet = finalBetAmount;
  GAME.state.minRaise = GAME.BIG_BLIND; // Use Big Blind as minimum raise
  GAME.state.lastRaiser = player;

  GAME.utils.addLog(`${player.name} bets $${finalBetAmount}.`, "bet");
  GAME.utils.showPlayerAction(player.id, "Bet", finalBetAmount);

  moveToNextPlayer();
}

function makeRaise(player, amount) {
  // Ensure raises are round numbers
  const raiseTotal = Math.floor(amount);

  // Calculate the actual amount player needs to add
  const raiseAmount = raiseTotal - player.bet;

  // Check if this is a valid raise
  const minimumRaiseTotal = GAME.state.currentBet + GAME.BIG_BLIND;

  // Use the larger of minimum raise or intended raise
  const finalRaiseTotal = Math.max(raiseTotal, minimumRaiseTotal);

  // Cap at player's available stack
  const maxRaiseTotal = player.bet + player.stack;
  const finalTotal = Math.min(finalRaiseTotal, maxRaiseTotal);

  // Calculate actual amount to add
  const actualRaiseAmount = finalTotal - player.bet;

  console.log(
    `${player.name} raising to $${finalTotal}. Current bet: ${GAME.state.currentBet}, Adding: ${actualRaiseAmount}`
  );

  player.stack -= actualRaiseAmount;
  GAME.state.pot += actualRaiseAmount;
  GAME.state.lastRaiseAmount = finalTotal - GAME.state.currentBet;
  GAME.state.minRaise = GAME.BIG_BLIND;
  GAME.state.currentBet = finalTotal;
  player.bet = finalTotal;
  player.totalBet += actualRaiseAmount;
  GAME.state.lastRaiser = player;

  GAME.utils.addLog(`${player.name} raises to $${finalTotal}.`, "bet");
  GAME.utils.showPlayerAction(player.id, "Raise", finalTotal);

  moveToNextPlayer();
}

function makeFold(player) {
  player.folded = true;
  player.active = false;

  GAME.utils.addLog(`${player.name} folds.`, "fold");
  GAME.utils.showPlayerAction(player.id, "Fold");

  document.getElementById(`player-${player.id}`).classList.add("folded");

  // Check if only one player remains
  const remainingPlayers = GAME.state.players.filter((p) => !p.folded);
  if (remainingPlayers.length === 1) {
    // Immediately advance to showdown if only one player remains
    setTimeout(() => advanceGame(), 1000);
    return;
  }

  moveToNextPlayer();
}

// Process human player action
/**
 * Processes a human player's poker action
 * @param {string} action - The poker action ("Check", "Call", "Bet", "Raise", "Fold", "All-In")
 * @param {number} betAmount - The amount to bet or raise (if applicable)
 * @returns {boolean} - Whether the action was successfully processed
 */
function processHumanAction(action, betAmount = 0) {
  const human = GAME.state.players.find((p) => p.isHuman);
  console.log(`Processing human action: ${action}, amount: ${betAmount}`);

  // Return value indicates whether action was successfully processed
  let actionSuccess = false;

  switch (action) {
    case "Check":
      actionSuccess = handleCheck(human);
      break;
    case "Call":
      actionSuccess = handleCall(human);
      break;
    case "Bet":
      actionSuccess = handleBet(human, betAmount);
      break;
    case "Raise":
      actionSuccess = handleRaise(human, betAmount);
      break;
    case "Fold":
      actionSuccess = handleFold(human);
      break;
    case "All-In":
      actionSuccess = handleAllIn(human);
      break;
    default:
      console.error(`Unknown action: ${action}`);
      return false;
  }

  if (!actionSuccess) return false;

  // Update UI
  GAME.utils.updateStacks();
  GAME.utils.updatePotDisplay();
  renderHands();

  // Hide betting controls
  document.getElementById("betting-controls").classList.remove("visible");

  // Move to next player or next stage
  moveToNextPlayer();

  return true;
}

/**
 * Handles the Check action
 * @param {Object} player - The player object
 * @returns {boolean} - Whether the check was valid
 */
function handleCheck(player) {
  // Check is valid when:
  // 1. No current bet on the table
  // 2. Player has already matched the current bet
  // 3. Special case: Big Blind in preflop when no one has raised yet
  const isBigBlind = 
    GAME.state.currentStage === "preflop" &&
    document.querySelector(`#player-${player.id} .player-position`).textContent === "BB";
  
  const canCheck = 
    GAME.state.currentBet === 0 || 
    player.bet === GAME.state.currentBet ||
    (isBigBlind && player.bet === GAME.state.currentBet && !GAME.state.lastRaiser);

  if (!canCheck) {
    alert("Cannot check when there's a bet. Choose Call or Fold.");
    return false;
  }

  GAME.utils.addLog("You checked.", "action");
  GAME.utils.showPlayerAction(player.id, "Check");
  return true;
}

/**
 * Handles the Call action
 * @param {Object} player - The player object
 * @returns {boolean} - Whether the call was valid
 */
function handleCall(player) {
  if (GAME.state.currentBet <= player.bet) {
    alert("Nothing to call.");
    return false;
  }

  // Calculate the correct call amount (limited by player's stack)
  const callAmount = Math.min(
    GAME.state.currentBet - player.bet,
    player.stack
  );

  console.log(
    `Human calling $${callAmount}. Current bet: ${GAME.state.currentBet}, Player bet: ${player.bet}`
  );

  player.stack -= callAmount;
  GAME.state.pot += callAmount;
  player.bet += callAmount;
  player.totalBet += callAmount;

  // Check for all-in
  if (player.stack === 0) {
    player.allIn = true;
    GAME.utils.addLog(
      "You called $" + callAmount + " and are all-in!",
      "bet"
    );
    GAME.utils.showPlayerAction(player.id, "All-In", callAmount);
  } else {
    GAME.utils.addLog("You called $" + callAmount + ".", "action");
    GAME.utils.showPlayerAction(player.id, "Call", callAmount);
  }
  
  return true;
}

/**
 * Handles the Bet action (first bet in a betting round)
 * @param {Object} player - The player object
 * @param {number} betAmount - The amount to bet
 * @returns {boolean} - Whether the bet was valid
 */
function handleBet(player, betAmount) {
  // Ensure bets are whole numbers
  betAmount = Math.floor(betAmount);

  // Validate bet amount
  if (betAmount < GAME.BIG_BLIND) {
    alert("Minimum bet is $" + GAME.BIG_BLIND);
    return false;
  }

  if (betAmount > player.stack) {
    alert("You don't have enough chips for this bet.");
    return false;
  }

  // Process bet
  player.stack -= betAmount;
  GAME.state.pot += betAmount;
  player.bet = betAmount;
  player.totalBet += betAmount;
  GAME.state.currentBet = betAmount;
  
  // The minimum raise is now the size of this bet
  GAME.state.minRaise = betAmount;
  GAME.state.lastRaiser = player;

  GAME.utils.addLog(`You bet $${betAmount}.`, "bet");
  GAME.utils.showPlayerAction(player.id, "Bet", betAmount);
  
  return true;
}

/**
 * Handles the Raise action
 * @param {Object} player - The player object
 * @param {number} betAmount - The total amount to bet (current bet + raise)
 * @returns {boolean} - Whether the raise was valid
 */
function handleRaise(player, betAmount) {
  // Ensure raises are whole numbers
  betAmount = Math.floor(betAmount);

  // Calculate the raise size (how much is being added to the current bet)
  const raiseSize = betAmount - GAME.state.currentBet;
  const callAmount = GAME.state.currentBet - player.bet;
  const totalRequired = callAmount + raiseSize;
  
  // Validate raise amount - must be at least the minimum raise
  if (betAmount <= GAME.state.currentBet) {
    alert(
      "Your raise must exceed the current bet of $" + GAME.state.currentBet
    );
    return false;
  }
  
  if (raiseSize < GAME.state.minRaise) {
    alert(
      `Your raise must be at least $${GAME.state.minRaise} more than the current bet.`
    );
    return false;
  }

  if (totalRequired > player.stack) {
    alert("You don't have enough chips for this raise.");
    return false;
  }

  // Process raise
  player.stack -= totalRequired;
  GAME.state.pot += totalRequired;
  GAME.state.lastRaiseAmount = raiseSize;
  GAME.state.minRaise = raiseSize; // Next raise must be at least this size
  GAME.state.currentBet = betAmount;
  player.bet = betAmount;
  player.totalBet += totalRequired;
  GAME.state.lastRaiser = player;

  GAME.utils.addLog(`You raised to $${betAmount}.`, "bet");
  GAME.utils.showPlayerAction(player.id, "Raise", betAmount);
  
  return true;
}

/**
 * Handles the Fold action
 * @param {Object} player - The player object
 * @returns {boolean} - Whether the fold was valid
 */
function handleFold(player) {
  player.folded = true;
  player.active = false;
  GAME.utils.addLog("You folded.", "fold");
  GAME.utils.showPlayerAction(player.id, "Fold");

  // Add folded class to player div
  document.getElementById(`player-${player.id}`).classList.add("folded");

  // Check if only one active player remains after folding
  const remainingPlayers = GAME.state.players.filter((p) => !p.folded);
  if (remainingPlayers.length === 1) {
    // Hide betting controls immediately
    document.getElementById("betting-controls").classList.remove("visible");
    GAME.utils.updateStacks();
    GAME.utils.updatePotDisplay();

    // Advance to showdown with a delay
    setTimeout(() => {
      advanceGame();
    }, 1000);
  }
  
  return true;
}

/**
 * Handles the All-In action
 * @param {Object} player - The player object
 * @returns {boolean} - Always returns true as all-in is always valid
 */
function handleAllIn(player) {
  // Calculate all-in amount (current bet plus remaining stack)
  const allInAmount = player.bet + player.stack;
  const actualAllInAmount = player.stack; // What's being added to the pot
  const isRaise = allInAmount > GAME.state.currentBet;

  if (!isRaise) {
    // All-in as a call (or partial call)
    GAME.state.pot += actualAllInAmount;
    player.bet += actualAllInAmount;
    player.totalBet += actualAllInAmount;
    player.stack = 0;
    player.allIn = true;

    GAME.utils.addLog(`You went all-in with $${allInAmount}!`, "bet");
    GAME.utils.showPlayerAction(player.id, "All-In", allInAmount);
  } else {
    // All-in as a raise
    const raiseAmount = allInAmount - GAME.state.currentBet;
    
    // Check if this all-in constitutes a "real raise" (meets min raise requirement)
    // If it's a real raise, it reopens betting
    if (raiseAmount >= GAME.state.minRaise) {
      GAME.state.lastRaiseAmount = raiseAmount;
      GAME.state.minRaise = raiseAmount; // Next raise must be at least this size
      GAME.state.lastRaiser = player;
    }

    GAME.state.currentBet = allInAmount;
    GAME.state.pot += actualAllInAmount;
    player.bet = allInAmount;
    player.totalBet += allInAmount;
    player.stack = 0;
    player.allIn = true;

    GAME.utils.addLog(`You went all-in with $${allInAmount}!`, "bet");
    GAME.utils.showPlayerAction(player.id, "All-In", allInAmount);
  }
  
  const raiseAmount = allInAmount - GAME.state.currentBet;
  const human = GAME.state.players.find((p) => p.isHuman);
  // Check if this all-in constitutes a "real raise" (meets min raise requirement)
  if (isRaise) {
    resetPlayerActionsAfterRaise(human);
  }


  return true;
}

// Process AI Actions
function processAIActions() {
  if (
    !GAME.state.players[GAME.state.activePlayerIndex] ||
    GAME.state.players[GAME.state.activePlayerIndex].isHuman
  ) {
    return;
  }

  const ai = GAME.state.players[GAME.state.activePlayerIndex];

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
    const handValue = ai.hand.reduce(
      (sum, card) => sum + GAME.utils.calculateCardValue(card),
      0
    );

    // Calculate hand strength tier based on game stage
    const handTier = GAME.utils.calculateHandTier(handValue);

    // Get a count of active players (not folded)
    const activePlayers = GAME.state.players.filter((p) => !p.folded).length;

    // Special case for Big Blind in preflop
    const isBigBlind =
      GAME.state.currentStage === "preflop" &&
      document.querySelector(`#player-${ai.id} .player-position`)
        .textContent === "BB";

    // Track if any AI has already raised in this round to reduce re-raising
    const aiRaiseCount = GAME.state.players.filter(
      (p) => !p.isHuman && !p.folded && p.bet > 0 && p === GAME.state.lastRaiser
    ).length;

    // Add this logic to reduce the chance that AIs keep raising each other
    const shouldLimitRaises = aiRaiseCount >= 1;

    // If there's no bet, or BB with option to check
    if (
      GAME.state.currentBet === 0 ||
      (isBigBlind && ai.bet === GAME.state.currentBet && !GAME.state.lastRaiser)
    ) {
      // Premium hands always bet
      if (handTier === "premium") {
        // Round to integer and use Big Blind as minimum
        const betSize = Math.min(
          Math.max(Math.floor(GAME.state.pot * 0.6), GAME.BIG_BLIND),
          ai.stack
        );
        makeBet(ai, betSize);
      }
      // Strong hands bet with 70% probability
      else if (handTier === "strong" && Math.random() < 0.7) {
        // Round to integer and use Big Blind as minimum
        const betSize = Math.min(
          Math.max(Math.floor(GAME.state.pot * 0.4), GAME.BIG_BLIND),
          ai.stack
        );
        makeBet(ai, betSize);
      }
      // Average hands in late position bet with 40% probability
      else if (
        handTier === "average" &&
        GAME.utils.getPlayerPosition(ai) === "late" &&
        Math.random() < 0.4
      ) {
        // Round to integer and use Big Blind as minimum
        const betSize = Math.min(
          Math.max(Math.floor(GAME.state.pot * 0.25), GAME.BIG_BLIND),
          ai.stack
        );
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
      const callAmount = GAME.state.currentBet - ai.bet;

      // Premium hands might raise, but not if there have been too many raises already
      if (
        handTier === "premium" &&
        (!shouldLimitRaises || Math.random() < 0.2)
      ) {
        if (ai.stack > callAmount * 2) {
          // Have enough to raise
          const raiseSize = Math.min(
            Math.floor(GAME.state.currentBet * 1.5),
            ai.stack + ai.bet
          );
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
          const raiseSize = Math.min(
            Math.floor(GAME.state.currentBet * 1.3),
            ai.stack + ai.bet
          );
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
      else if (
        Math.random() < (shouldLimitRaises ? 0.05 : 0.15) &&
        GAME.utils.getPlayerPosition(ai) === "late" &&
        GAME.state.currentStage === "preflop"
      ) {
        if (ai.stack > callAmount * 2) {
          const raiseSize = Math.min(
            Math.floor(GAME.state.currentBet * 1.2),
            ai.stack + ai.bet
          );
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

function processAIRaise(aiPlayer, newBetAmount) {
  // Reset player actions after the AI raises
  resetPlayerActionsAfterRaise(aiPlayer);
  
  // Your existing code to show the action...
  GAME.utils.addLog(`${aiPlayer.name} raised to $${newBetAmount}.`, "bet");
  GAME.utils.showPlayerAction(aiPlayer.id, "Raise", newBetAmount);
}

function processAIAllIn(aiPlayer, allInAmount) {
  // Only reset action tracking if it's a legitimate raise
  const isRaise = allInAmount > GAME.state.currentBet;
  const raiseAmount = allInAmount - GAME.state.currentBet;
  
  if (isRaise && raiseAmount >= GAME.state.minRaise) {
    resetPlayerActionsAfterRaise(aiPlayer);
  }
  
  // Your existing code to show the action...
  GAME.utils.addLog(`${aiPlayer.name} went all-in with $${allInAmount}!`, "bet");
  GAME.utils.showPlayerAction(aiPlayer.id, "All-In", allInAmount);
}

// Highlight active player
function highlightActivePlayer() {
  GAME.state.players.forEach((player, index) => {
    const playerEl = document.getElementById(`player-${player.id}`);
    if (index === GAME.state.activePlayerIndex) {
      playerEl.classList.add("active");
    } else {
      playerEl.classList.remove("active");
    }
  });
}

// Advance to next game stage
function advanceGame() {
  GAME.utils.hideMessage();

  // Check if only one player remains
  const activePlayers = GAME.state.players.filter((p) => !p.folded);
  if (activePlayers.length === 1) {
    // One player wins by default
    setTimeout(() => {
      showdown(true);
    }, 1000);
    return;
  }

  // Reset betting round variables
  GAME.state.hasBettingStarted = false;
  GAME.state.playersActedThisRound = [];
  GAME.state.bettingRoundComplete = false;

  // Advance to next stage
  if (GAME.state.currentStage === "preflop") {
    // After preflop, reveal arena
    setTimeout(() => {
      revealArena();
      // Wait a bit before starting the next betting round
      setTimeout(() => {
        beginBettingRound();
      }, 2000);
    }, 1000);
  } else if (GAME.state.currentStage === "arena") {
    // After arena, add first power card
    setTimeout(() => {
      addPowerCard(); // This sets stage to power1
      // Wait before starting next betting round
      setTimeout(() => {
        beginBettingRound();
      }, 2000);
    }, 1000);
  } else if (GAME.state.currentStage === "power1") {
    // After first power card, add second power card
    setTimeout(() => {
      addPowerCard(); // This sets stage to power2
      // Wait before starting next betting round
      setTimeout(() => {
        beginBettingRound();
      }, 2000);
    }, 1000);
  } else if (GAME.state.currentStage === "power2") {
    // After second power card, add third and final power card
    setTimeout(() => {
      addPowerCard(); // This sets stage to power3
      // Wait before starting next betting round
      setTimeout(() => {
        beginBettingRound();
      }, 2000);
    }, 1000);
  } else if (GAME.state.currentStage === "power3") {
    // After final power round, go to showdown
    setTimeout(() => {
      showdown();
    }, 1000);
  }
}

// Reveal arena card
function revealArena() {
  let arenaElement =
    GAME.ELEMENTS[Math.floor(Math.random() * GAME.ELEMENTS.length)];
  GAME.state.arenaCard = {
    type: "arena",
    element: arenaElement,
    name: GAME.utils.getArenaName(arenaElement),
    modifiers: GAME.BONUS_MATRIX,
  };

  // Update UI
  let arenaLabel = document.getElementById("arena-label");
  arenaLabel.innerText =
    GAME.state.arenaCard.name + " (" + GAME.state.arenaCard.element + ")";
  arenaLabel.style.color = GAME.utils.getElementColor(
    GAME.state.arenaCard.element
  );
  arenaLabel.classList.add("active");

  // Update arena container
  const container = document.getElementById("power-cards-container");
  container.className = GAME.state.arenaCard.element.toLowerCase() + "-arena";
  container.style.borderColor = GAME.utils.getElementColor(
    GAME.state.arenaCard.element
  );
  container.style.background =
    GAME.ELEMENT_GRADIENTS[GAME.state.arenaCard.element];
  container.style.backgroundSize = "400% 400%";
  container.style.animation = "gradientAnimation 15s ease infinite";

  GAME.utils.addLog(`Arena revealed: ${arenaLabel.innerText}`, "action");

  // Update hand displays to show bonuses
  renderHands();

  // Update game stage
  GAME.utils.updateGameStage("arena");
}

// Add power card
function addPowerCard() {
  let powerElement =
    GAME.ELEMENTS[Math.floor(Math.random() * GAME.ELEMENTS.length)];
  let powerValue = Math.floor(Math.random() * 5) + 1;
  let powerCard = {
    type: "power",
    element: powerElement,
    power: powerValue,
    name: GAME.utils.getPowerName(powerElement, powerValue),
  };

  GAME.state.powerCards.push(powerCard);

  GAME.utils.addLog(
    `Power Card dealt: ${powerCard.name} (${powerCard.element} +${powerCard.power})`,
    "action"
  );

  renderPowerCards();
  renderHands();

  // Update game stage
  if (GAME.state.powerCards.length === 1) {
    GAME.utils.updateGameStage("power1");
  } else if (GAME.state.powerCards.length === 2) {
    GAME.utils.updateGameStage("power2");
  } else if (GAME.state.powerCards.length === 3) {
    GAME.utils.updateGameStage("power3");
  }
}

// Render cards for all players
function renderHands() {
  GAME.state.players.forEach((player) => {
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

    // Make sure hand exists and is an array with length
    if (
      !player.hand ||
      !Array.isArray(player.hand) ||
      player.hand.length === 0
    ) {
      console.error(`No valid hand for player ${player.id}`);
      return;
    }

    player.hand.forEach((card) => {
      let cardDiv = document.createElement("div");

      if (player.isHuman || GAME.state.currentStage === "showdown") {
        // Show actual cards for human player or at showdown
        cardDiv.className = `card monster ${card.element.toLowerCase()}-card`;

        // Calculate bonus from arena and power cards
        let bonus = GAME.utils.calculateCardValue(card) - card.value;
        let bonusClass = bonus >= 0 ? "bonus-positive" : "bonus-negative";

        let iconHTML = GAME.utils.getIcon(card.element);
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
    if (
      (player.isHuman || GAME.state.currentStage === "showdown") &&
      player.hand.length > 0
    ) {
      const total = player.hand.reduce(
        (sum, card) => sum + GAME.utils.calculateCardValue(card),
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

  GAME.state.powerCards.forEach((card) => {
    let cardDiv = document.createElement("div");
    cardDiv.className = `card power ${card.element.toLowerCase()}-card`;

    let iconHTML = GAME.utils.getIcon(card.element);
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

// Final showdown
function showdown(singleWinner = false) {
  GAME.state.currentStage = "showdown";

  // Reveal all cards
  renderHands();

  // Calculate final hand values
  let results = [];
  GAME.state.players.forEach((player, index) => {
    if (player.folded) {
      results.push({ player, name: player.name, value: -Infinity });
    } else {
      const handValue = player.hand.reduce(
        (sum, card) => sum + GAME.utils.calculateCardValue(card),
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
    GAME.utils.addLog(
      `${winner.name} wins ${GAME.state.pot} as the only remaining player!`,
      "win"
    );
  } else {
    GAME.utils.addLog(
      `Showdown! ${winner.name} wins with ${winner.value} points and takes ${GAME.state.pot}!`,
      "win"
    );
  }

  // Award pot to winner
  winner.player.stack += GAME.state.pot;

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

    let bonus = GAME.utils.calculateCardValue(card) - card.value;
    let bonusClass = bonus >= 0 ? "bonus-positive" : "bonus-negative";

    let iconHTML = GAME.utils.getIcon(card.element);
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

  winnerPot.textContent = `Pot: $${GAME.state.pot}`;

  // Show overlay
  winnerOverlay.classList.add("visible");

  // Update stacks
  GAME.utils.updateStacks();

  // Show restart button
  document.getElementById("restart-button").style.display = "block";
}

function resetPlayerActionsAfterRaise(raiser) {
  GAME.state.playersActedThisRound = [raiser.id];
  console.log(`Raise detected! Resetting player actions. Only ${raiser.name} has acted now.`);
}

// Export the functions
window.GAME.engine = {
  initGame,
  resetRound,
  dealInitialCards,
  postBlinds,
  isBettingRoundComplete,
  beginBettingRound,
  moveToNextPlayer,
  activateHumanPlayer,
  updateActionButtons,
  makeCheck,
  makeCall,
  makeBet,
  makeRaise,
  makeFold,
  processHumanAction,
  processAIActions,
  highlightActivePlayer,
  advanceGame,
  revealArena,
  addPowerCard,
  renderHands,
  renderPowerCards,
  showdown,
};
