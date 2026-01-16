const { customAlphabet } = require('nanoid');

/**
 * Short Code Generator
 * 
 * Design Decisions:
 * - Uses nanoid for cryptographically strong random generation
 * - Custom alphabet excludes ambiguous characters (0, O, I, l)
 * - Configurable length (default 7 chars = 3.5 trillion combinations)
 * - Collision-resistant with retry mechanism
 * - URL-safe characters only
 */

class ShortCodeGenerator {
  /**
   * URL-safe alphabet excluding ambiguous characters
   * Excludes: 0 (zero), O (capital o), I (capital i), l (lowercase L)
   * Total: 58 characters
   */
  static ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

  /**
   * Default short code length
   * 7 characters with 58-char alphabet = 58^7 = ~2.2 trillion combinations
   */
  static DEFAULT_LENGTH = parseInt(process.env.SHORT_CODE_LENGTH) || 7;

  /**
   * Initialize nanoid with custom alphabet
   */
  static nanoid = customAlphabet(this.ALPHABET, this.DEFAULT_LENGTH);

  /**
   * Generate a unique short code
   * @param {number} length - Optional custom length
   * @returns {string} - Generated short code
   */
  static generate(length = this.DEFAULT_LENGTH) {
    // Validate length
    if (length < 6 || length > 12) {
      throw new Error('Short code length must be between 6 and 12 characters');
    }

    // Use custom length if provided
    if (length !== this.DEFAULT_LENGTH) {
      const customNanoid = customAlphabet(this.ALPHABET, length);
      return customNanoid();
    }

    return this.nanoid();
  }

  /**
   * Generate a unique short code with collision checking
   * @param {Function} existsCheck - Async function to check if code exists
   * @param {number} maxRetries - Maximum retry attempts
   * @returns {Promise<string>} - Unique short code
   */
  static async generateUnique(existsCheck, maxRetries = 5) {
    let attempts = 0;

    while (attempts < maxRetries) {
      const code = this.generate();
      
      // Check if code already exists
      const exists = await existsCheck(code);
      
      if (!exists) {
        return code;
      }

      attempts++;
    }

    // If all retries failed, increase length and try once more
    const longerCode = this.generate(this.DEFAULT_LENGTH + 1);
    const exists = await existsCheck(longerCode);
    
    if (!exists) {
      return longerCode;
    }

    throw new Error('Failed to generate unique short code after multiple attempts');
  }

  /**
   * Validate a short code format
   * @param {string} code 
   * @returns {boolean}
   */
  static isValid(code) {
    if (!code || typeof code !== 'string') {
      return false;
    }

    // Check length
    if (code.length < 6 || code.length > 12) {
      return false;
    }

    // Check if all characters are in alphabet
    return [...code].every(char => this.ALPHABET.includes(char));
  }

  /**
   * Calculate collision probability
   * @param {number} existingCodes - Number of existing codes
   * @param {number} length - Short code length
   * @returns {number} - Probability of collision (0-1)
   */
  static collisionProbability(existingCodes, length = this.DEFAULT_LENGTH) {
    const totalPossible = Math.pow(this.ALPHABET.length, length);
    return 1 - Math.exp(-(existingCodes * (existingCodes - 1)) / (2 * totalPossible));
  }
}

module.exports = ShortCodeGenerator;
