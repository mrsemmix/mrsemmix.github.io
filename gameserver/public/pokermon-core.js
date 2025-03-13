/*
 * debug-pokermon-core.js
 * Core game state and constants with additional debugging
 */

console.log("Debug pokermon-core.js loading...");

// Global Constants
const ELEMENTS = ["Fire", "Water", "Earth", "Air"];
const POSITIONS = ["BTN", "SB", "BB", "UTG", "MP", "CO"]; // Button, Small Blind, Big Blind, Under the Gun, Middle Position, Cut Off
const STARTING_STACK = 1000;
const SMALL_BLIND = 5;
const BIG_BLIND = 10;

// Monster names based on element and value (1-13)
const MONSTER_NAMES = {
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
};

const ARENA_NAMES = {
  Fire: ["Blaze Coliseum", "Lava Stadium", "Volcano"],
  Water: ["Wave Pavilion", "Grand Ocean", "River Basin"],
  Earth: ["Rock Fortress", "Stone Domain", "Terra Grounds"],
  Air: ["Skyport", "Wind Haven", "Cloud Oasis"],
};

const POWER_NAMES = {
  Fire: {
    1: "Ember",
    2: "Flame Flicker",
    3: "Blaze",
    4: "Firestorm",
    5: "Inferno",
  },
  Water: {
    1: "Splash",
    2: "Drizzle",
    3: "Torrent",
    4: "Deluge",
    5: "Tsunami",
  },
  Earth: {
    1: "Pebble Toss",
    2: "Rock Throw",
    3: "Boulder",
    4: "Landslide",
    5: "Earthquake",
  },
  Air: {
    1: "Gust",
    2: "Breeze",
    3: "Wind Slash",
    4: "Tempest",
    5: "Hurricane",
  },
};

const ARENA_BONUS_MATRIX = {
  Fire: { Fire: 4, Water: -4, Earth: -2, Air: 2 },
  Water: { Fire: -4, Water: 4, Earth: 2, Air: -2 },
  Earth: { Fire: -2, Water: 2, Earth: 4, Air: -4 },
  Air: { Fire: 2, Water: -2, Earth: -4, Air: 4 },
};

// Element gradients for visual effects
const ELEMENT_GRADIENTS = {
  Fire: "linear-gradient(45deg, rgba(255,69,0,0.2), rgba(255,140,0,0.2), rgba(255,69,0,0.2))",
  Water:
    "linear-gradient(45deg, rgba(30,144,255,0.2), rgba(65,105,225,0.2), rgba(30,144,255,0.2))",
  Earth:
    "linear-gradient(45deg, rgba(154,205,50,0.2), rgba(107,142,35,0.2), rgba(154,205,50,0.2))",
  Air: "linear-gradient(45deg, rgba(173,216,230,0.2), rgba(135,206,250,0.2), rgba(173,216,230,0.2))",
};

const GAME_STAGES = ["preflop", "arena", "power1", "power2", "power3"];

// AI thresholds for risk assessment
const AI_RISK_THRESHOLDS = {
  preflop: { low: 10, medium: 16, high: 20 },
  arena: { low: 12, medium: 18, high: 22 },
  power: { low: 15, medium: 22, high: 26 },
};

// Game state variables
let GameState = {
  deck: [],
  players: [],
  arenaCard: null,
  powerCards: [],
  currentStage: "preflop", // preflop, arena, power1, power2, power3, showdown
  dealerPosition: 3, // Start with human as dealer (BTN)
  activePlayerIndex: 0,
  currentBet: 0,
  pot: 0,
  minRaise: BIG_BLIND, // Minimum raise amount (starts as big blind)
  lastRaiseAmount: 0,
  lastRaiser: null,
  bettingRoundComplete: false,
  sidePots: [],
  mainPot: 0,
  gameStarted: false,
  // New state tracking for betting rounds
  hasBettingStarted: false,
  playersActedThisRound: [],
};

// Export the constants and game state
window.GAME = {
  // Constants
  ELEMENTS,
  POSITIONS,
  STARTING_STACK,
  SMALL_BLIND,
  BIG_BLIND,
  MONSTER_NAMES,
  BONUS_MATRIX: ARENA_BONUS_MATRIX,
  ARENA_NAMES,
  POWER_NAMES,
  GAME_STAGES,
  ELEMENT_GRADIENTS,
  AI_RISK_THRESHOLDS,

  // Game state - exported as reference
  state: GameState,
};

console.log("Debug GAME object initialized:", window.GAME);

// Add mode state
window.GAME.currentMode = 'offline'; // 'offline' or 'online'

// Add a function to switch modes
window.GAME.switchMode = function(mode) {
  window.GAME.currentMode = mode;
  console.log('Switched to ' + mode + ' mode');
};

// Export in Node.js environment (for server reuse)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.GAME;
}