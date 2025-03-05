/**
 * Deck Manager
 * Handles card deck creation and manipulation
 */

class DeckManager {
    constructor() {
      this.elements = ["Fire", "Water", "Earth", "Air"];
    }
  
    /**
     * Create and shuffle a deck
     * @returns {Array} Shuffled deck of cards
     */
    createShuffledDeck() {
      const deck = this.createDeck();
      return this.shuffle(deck);
    }
  
    /**
     * Create a standard deck
     * @returns {Array} Unshuffled deck of cards
     */
    createDeck() {
      let deck = [];
      
      for (let element of this.elements) {
        for (let i = 1; i <= 13; i++) {
          deck.push({
            type: "monster",
            element: element,
            value: i,
            name: this.getMonsterName(element, i)
          });
        }
      }
      
      return deck;
    }
  
    /**
     * Shuffle an array using Fisher-Yates algorithm
     * @param {Array} array - Array to shuffle
     * @returns {Array} Shuffled array
     */
    shuffle(array) {
      const shuffled = [...array];
      
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      return shuffled;
    }
  
    /**
     * Get monster name based on element and value
     * @param {string} element - Card element
     * @param {number} value - Card value
     * @returns {string} Monster name
     */
    getMonsterName(element, value) {
      // Simple naming convention for the POC
      return `${element} Monster ${value}`;
    }
  
    /**
     * Generate an arena card
     * @returns {Object} Arena card
     */
    generateArenaCard() {
      const element = this.elements[Math.floor(Math.random() * this.elements.length)];
      
      return {
        type: "arena",
        element: element,
        name: `${element} Arena`
      };
    }
  
    /**
     * Generate a power card
     * @returns {Object} Power card
     */
    generatePowerCard() {
      const element = this.elements[Math.floor(Math.random() * this.elements.length)];
      const power = Math.floor(Math.random() * 5) + 1;
      
      return {
        type: "power",
        element: element,
        power: power,
        name: `${element} Power ${power}`
      };
    }
  }
  
  module.exports = DeckManager;