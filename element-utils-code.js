/**
 * element-utils.js
 * Utility functions for handling element interactions and bonuses
 */

class ElementUtils {
  constructor() {
    // Element relationship matrix (core bonus values)
    this.relationshipMatrix = {
      Fire: { Fire: 4, Water: -4, Earth: -2, Air: 2 },
      Water: { Fire: -4, Water: 4, Earth: 2, Air: -2 },
      Earth: { Fire: -2, Water: 2, Earth: 4, Air: -4 },
      Air: { Fire: 2, Water: -2, Earth: -4, Air: 4 }
    };
    
    // Element colors for UI
    this.elementColors = {
      Fire: '#FF4500',
      Water: '#1E90FF',
      Earth: '#9ACD32',
      Air: '#ADD8E6'
    };
    
    // Element icons (FontAwesome)
    this.elementIcons = {
      Fire: 'fa-fire',
      Water: 'fa-tint',
      Earth: 'fa-mountain',
      Air: 'fa-wind'
    };
    
    // Element gradients for backgrounds
    this.elementGradients = {
      Fire: "linear-gradient(45deg, rgba(255,69,0,0.2), rgba(255,140,0,0.2), rgba(255,69,0,0.2))",
      Water: "linear-gradient(45deg, rgba(30,144,255,0.2), rgba(65,105,225,0.2), rgba(30,144,255,0.2))",
      Earth: "linear-gradient(45deg, rgba(154,205,50,0.2), rgba(107,142,35,0.2), rgba(154,205,50,0.2))",
      Air: "linear-gradient(45deg, rgba(173,216,230,0.2), rgba(135,206,250,0.2), rgba(173,216,230,0.2))"
    };
  }
  
  /**
   * Get arena bonus for a monster card
   * @param {String} cardElement - Monster card element
   * @param {String} arenaElement - Arena element
   * @returns {Number} Bonus value
   */
  getArenaBonus(cardElement, arenaElement) {
    if (!cardElement || !arenaElement) return 0;
    if (!this.relationshipMatrix[cardElement]) return 0;
    
    return this.relationshipMatrix[cardElement][arenaElement] || 0;
  }
  
  /**
   * Get power card bonus for a monster card
   * @param {String} cardElement - Monster card element
   * @param {Object} powerCard - Power card object
   * @returns {Number} Bonus value
   */
  getPowerCardBonus(cardElement, powerCard) {
    if (!cardElement || !powerCard || !powerCard.element) return 0;
    
    // Same element: add full power value
    if (cardElement === powerCard.element) {
      return powerCard.power || 0;
    }
    
    // Contradicting element: -1 regardless of power
    if (this.isContradictingElement(cardElement, powerCard.element)) {
      return -1;
    }
    
    // Other elements: no effect
    return 0;
  }
  
  /**
   * Check if two elements contradict each other
   * @param {String} element1 - First element
   * @param {String} element2 - Second element
   * @returns {Boolean} True if elements contradict
   */
  isContradictingElement(element1, element2) {
    if (!this.relationshipMatrix[element1]) return false;
    
    // Elements contradict if their relationship is strongly negative (-4)
    return this.relationshipMatrix[element1][element2] === -4;
  }
  
  /**
   * Calculate total card value with all bonuses
   * @param {Object} card - Monster card
   * @param {String} arenaElement - Arena element (optional)
   * @param {Array} powerCards - Array of power cards (optional)
   * @returns {Number} Total card value
   */
  calculateCardValue(card, arenaElement, powerCards = []) {
    if (!card || !card.element || !card.value) return 0;
    
    let totalValue = card.value;
    
    // Add arena bonus
    if (arenaElement) {
      totalValue += this.getArenaBonus(card.element, arenaElement);
    }
    
    // Add power card bonuses
    if (powerCards && powerCards.length > 0) {
      powerCards.forEach(powerCard => {
        totalValue += this.getPowerCardBonus(card.element, powerCard);
      });
    }
    
    return totalValue;
  }
  
  /**
   * Calculate hand strength (0-1 scale)
   * @param {Array} hand - Array of monster cards
   * @param {String} arenaElement - Arena element (optional)
   * @param {Array} powerCards - Array of power cards (optional)
   * @returns {Number} Hand strength (0-1)
   */
  calculateHandStrength(hand, arenaElement, powerCards = []) {
    if (!hand || hand.length === 0) return 0;
    
    // Calculate total hand value
    let totalValue = 0;
    hand.forEach(card => {
      totalValue += this.calculateCardValue(card, arenaElement, powerCards);
    });
    
    // Determine maximum possible value based on current stage
    let maxPossibleValue = 26; // Base max for two cards (13x2)
    
    // Add arena bonus (max +8 if both cards match arena)
    if (arenaElement) {
      maxPossibleValue += 8;
    }
    
    // Add power card bonuses (max +5 per power card)
    if (powerCards && powerCards.length > 0) {
      maxPossibleValue += powerCards.length * 5;
    }
    
    // Calculate normalized strength (0-1)
    return Math.min(1, Math.max(0, totalValue / maxPossibleValue));
  }
  
  /**
   * Get element icon HTML
   * @param {String} element - Element name
   * @returns {String} HTML icon
   */
  getElementIconHTML(element) {
    if (!element || !this.elementIcons[element]) return '';
    
    const color = this.elementColors[element] || '#ffffff';
    return `<i class="fas ${this.elementIcons[element]} fa-icon" style="color: ${color};"></i>`;
  }
  
  /**
   * Get element color
   * @param {String} element - Element name
   * @returns {String} Color code
   */
  getElementColor(element) {
    return this.elementColors[element] || '#ffffff';
  }
  
  /**
   * Get element gradient
   * @param {String} element - Element name
   * @returns {String} CSS gradient
   */
  getElementGradient(element) {
    return this.elementGradients[element] || 'none';
  }
  
  /**
   * Get monster name based on element and value
   * @param {String} element - Monster element
   * @param {Number} value - Monster value
   * @returns {String} Monster name
   */
  getMonsterName(element, value) {
    // Monster name database
    const monsterNames = {
      Fire: [
        "Fire Imp", "Ember Sprite", "Flame Whelp", "Blaze Pup", "Cinder Hound",
        "Lava Golem", "Burning Drake", "Flare Serpent", "Scorch Fiend", "Pyro Beast",
        "Ember Lord", "Inferno King", "Lava Titan"
      ],
      Water: [
        "Water Sprite", "Mist Nymph", "Ripple Imp", "Droplet Pixie", "Brook Guardian",
        "Aqua Sentinel", "Tidal Fighter", "Wave Ruler", "Deepwater Fiend", "Ocean Warrior",
        "Tsunami Bringer", "Abyss Monarch", "Ocean Emperor"
      ],
      Earth: [
        "Earth Pixie", "Soil Sprite", "Pebble Imp", "Mudling", "Rock Guard",
        "Stone Sentinel", "Terra Warrior", "Gravel Golem", "Earth Brute", "Landshaper",
        "Geo Lord", "Terra Titan", "Earth Emperor"
      ],
      Air: [
        "Air Imp", "Breeze Sprite", "Gustling", "Wind Wisp", "Zephyr Knight",
        "Air Scout", "Sky Warrior", "Cloud Strider", "Tempest Caller", "Wind Ruler",
        "Storm Bringer", "Sky Lord", "Storm King"
      ]
    };
    
    // Get name from database or generate a default
    if (monsterNames[element] && value >= 1 && value <= 13) {
      return monsterNames[element][value - 1];
    }
    
    return `${element} Monster ${value}`;
  }
  
  /**
   * Get arena name based on element
   * @param {String} element - Arena element
   * @returns {String} Arena name
   */
  getArenaName(element) {
    // Arena name database
    const arenaNames = {
      Fire: ["Blaze Coliseum", "Lava Stadium", "Volcano"],
      Water: ["Wave Pavilion", "Grand Ocean", "River Basin"],
      Earth: ["Rock Fortress", "Stone Domain", "Terra Grounds"],
      Air: ["Skyport", "Wind Haven", "Cloud Oasis"]
    };
    
    // Get random arena name from database or generate a default
    if (arenaNames[element] && arenaNames[element].length > 0) {
      const randomIndex = Math.floor(Math.random() * arenaNames[element].length);
      return arenaNames[element][randomIndex];
    }
    
    return `${element} Arena`;
  }
  
  /**
   * Get power card name based on element and power
   * @param {String} element - Power card element
   * @param {Number} power - Power value
   * @returns {String} Power card name
   */
  getPowerName(element, power) {
    // Power name database
    const powerNames = {
      Fire: { 1: "Ember", 2: "Flame Flicker", 3: "Blaze", 4: "Firestorm", 5: "Inferno" },
      Water: { 1: "Splash", 2: "Drizzle", 3: "Torrent", 4: "Deluge", 5: "Tsunami" },
      Earth: { 1: "Pebble Toss", 2: "Rock Throw", 3: "Boulder", 4: "Landslide", 5: "Earthquake" },
      Air: { 1: "Gust", 2: "Breeze", 3: "Wind Slash", 4: "Tempest", 5: "Hurricane" }
    };
    
    // Get name from database or generate a default
    if (powerNames[element] && powerNames[element][power]) {
      return powerNames[element][power];
    }
    
    return `${element} Power ${power}`;
  }
}

// Create a global instance
window.elementUtils = new ElementUtils();

// Export in browser environment
if (typeof window !== 'undefined') {
  window.ElementUtils = ElementUtils;
}
