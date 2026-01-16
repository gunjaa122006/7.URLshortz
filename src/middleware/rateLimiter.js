const rateLimit = require('express-rate-limit');

/**
 * Rate Limiting Configuration
 * Prevents abuse and ensures fair usage
 */

/**
 * Rate limiter for URL creation endpoint
 * Stricter limits to prevent spam and abuse
 */
const createUrlLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window
  message: {
    success: false,
    error: 'Too many URLs created from this IP, please try again later'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req) => {
    // Use IP address as key
    return req.headers['x-forwarded-for']?.split(',')[0].trim() || 
           req.headers['x-real-ip'] || 
           req.ip;
  }
});

/**
 * General API rate limiter
 * More relaxed for read operations
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per window
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Redirect rate limiter
 * Very high limit since this is the main use case
 */
const redirectLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 redirects per minute per IP
  message: {
    success: false,
    error: 'Too many redirect requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true // Don't count failed redirects
});

module.exports = {
  createUrlLimiter,
  generalLimiter,
  redirectLimiter
};
