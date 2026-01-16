const validator = require('validator');

/**
 * URL Validation and Security Utilities
 * 
 * Critical security measures:
 * - Prevent JavaScript injection URLs (javascript:, data:, vbscript:)
 * - Block file:// protocol to prevent local file access
 * - Validate URL structure and format
 * - Prevent open redirect abuse
 * - Normalize URLs to prevent duplicates
 */

class URLValidator {
  /**
   * Dangerous protocols that should never be allowed
   */
  static BLOCKED_PROTOCOLS = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'about:',
    'blob:',
    'filesystem:'
  ];

  /**
   * Dangerous patterns that indicate potential abuse
   */
  static DANGEROUS_PATTERNS = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,  // Event handlers like onclick=
    /&#/,  // HTML entities that could hide malicious content
    /\\x/i,  // Hex encoding
    /\\u/i   // Unicode encoding
  ];

  /**
   * Main validation method
   * @param {string} url - URL to validate
   * @returns {object} - { valid: boolean, error: string, normalized: string }
   */
  static validate(url) {
    try {
      // Check if URL is provided
      if (!url || typeof url !== 'string') {
        return {
          valid: false,
          error: 'URL is required and must be a string'
        };
      }

      // Trim whitespace
      url = url.trim();

      // Check length
      if (url.length > 2048) {
        return {
          valid: false,
          error: 'URL exceeds maximum length of 2048 characters'
        };
      }

      if (url.length < 3) {
        return {
          valid: false,
          error: 'URL is too short'
        };
      }

      // Check for dangerous protocols
      const lowerUrl = url.toLowerCase();
      for (const protocol of this.BLOCKED_PROTOCOLS) {
        if (lowerUrl.startsWith(protocol)) {
          return {
            valid: false,
            error: `Protocol '${protocol}' is not allowed for security reasons`
          };
        }
      }

      // Check for dangerous patterns
      for (const pattern of this.DANGEROUS_PATTERNS) {
        if (pattern.test(url)) {
          return {
            valid: false,
            error: 'URL contains potentially malicious content'
          };
        }
      }

      // Validate URL format using validator library
      const validatorOptions = {
        protocols: ['http', 'https'],
        require_protocol: false,
        require_valid_protocol: true,
        allow_underscores: true,
        allow_trailing_dot: false,
        allow_protocol_relative_urls: false
      };

      // Add protocol if missing
      let normalizedUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        normalizedUrl = 'https://' + url;
      }

      // Validate the normalized URL
      if (!validator.isURL(normalizedUrl, validatorOptions)) {
        return {
          valid: false,
          error: 'Invalid URL format'
        };
      }

      // Additional validation: parse URL to check structure
      let parsedUrl;
      try {
        parsedUrl = new URL(normalizedUrl);
      } catch (e) {
        return {
          valid: false,
          error: 'Malformed URL'
        };
      }

      // Block localhost and private IP ranges in production
      if (process.env.NODE_ENV === 'production') {
        const hostname = parsedUrl.hostname.toLowerCase();
        
        if (this.isPrivateOrLocalhost(hostname)) {
          return {
            valid: false,
            error: 'URLs pointing to localhost or private networks are not allowed'
          };
        }
      }

      // Final normalized URL
      const finalUrl = parsedUrl.href;

      return {
        valid: true,
        normalized: finalUrl,
        error: null
      };

    } catch (error) {
      return {
        valid: false,
        error: 'URL validation failed: ' + error.message
      };
    }
  }

  /**
   * Check if hostname is localhost or private IP
   * @param {string} hostname 
   * @returns {boolean}
   */
  static isPrivateOrLocalhost(hostname) {
    // Check for localhost variants
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname === '::1' ||
        hostname.endsWith('.localhost')) {
      return true;
    }

    // Check for private IP ranges
    const privateIPRegex = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|169\.254\.)/;
    if (privateIPRegex.test(hostname)) {
      return true;
    }

    return false;
  }

  /**
   * Sanitize URL to prevent injection attacks
   * @param {string} url 
   * @returns {string}
   */
  static sanitize(url) {
    if (!url) return '';
    
    // Remove any null bytes
    url = url.replace(/\0/g, '');
    
    // Remove control characters
    url = url.replace(/[\x00-\x1F\x7F]/g, '');
    
    return url.trim();
  }

  /**
   * Check if short code is valid
   * @param {string} code 
   * @returns {boolean}
   */
  static isValidShortCode(code) {
    if (!code || typeof code !== 'string') {
      return false;
    }

    // Allow alphanumeric characters, hyphens, and underscores
    const shortCodeRegex = /^[a-zA-Z0-9_-]{6,12}$/;
    return shortCodeRegex.test(code);
  }
}

module.exports = URLValidator;
