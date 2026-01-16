const crypto = require('crypto');

/**
 * Security Utilities
 * Provides hashing and security-related helper functions
 */

class SecurityUtils {
  /**
   * Hash an IP address for privacy-preserving abuse detection
   * @param {string} ip - IP address to hash
   * @returns {string} - Hashed IP address
   */
  static hashIP(ip) {
    if (!ip) return null;
    
    const salt = process.env.IP_HASH_SALT || 'urlshortz-default-salt';
    return crypto
      .createHmac('sha256', salt)
      .update(ip)
      .digest('hex')
      .substring(0, 16); // Truncate for storage efficiency
  }

  /**
   * Extract real IP address from request (handles proxies)
   * @param {Object} req - Express request object
   * @returns {string} - IP address
   */
  static getClientIP(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    return req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           req.ip;
  }

  /**
   * Sanitize user agent string
   * @param {string} userAgent 
   * @returns {string}
   */
  static sanitizeUserAgent(userAgent) {
    if (!userAgent) return 'Unknown';
    
    // Truncate to reasonable length
    return userAgent.substring(0, 200);
  }
}

module.exports = SecurityUtils;
