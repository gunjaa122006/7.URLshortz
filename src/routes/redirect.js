const express = require('express');
const router = express.Router();
const URL = require('../models/Url');
const URLValidator = require('../utils/validator');
const { asyncHandler, ErrorResponse } = require('../middleware/errorHandler');
const { redirectLimiter } = require('../middleware/rateLimiter');

/**
 * @route   GET /:shortCode
 * @desc    Redirect to original URL
 * @access  Public (rate limited)
 * 
 * Critical HTTP semantics:
 * - 301: Permanent redirect (default, cacheable)
 * - 302: Temporary redirect (optional, not cached)
 * - 404: Short code not found
 * - 410: Short URL expired (Gone)
 */
router.get('/:shortCode', redirectLimiter, asyncHandler(async (req, res, next) => {
  const { shortCode } = req.params;

  // Validate short code format
  if (!URLValidator.isValidShortCode(shortCode)) {
    return next(new ErrorResponse('Invalid short code', 400));
  }

  // Find URL and increment click count atomically
  const urlDoc = await URL.findAndIncrementClicks(shortCode);

  if (!urlDoc) {
    return next(new ErrorResponse('Short URL not found', 404));
  }

  // Check if expired
  if (urlDoc.isExpired()) {
    return next(new ErrorResponse('This short URL has expired', 410));
  }

  // Get redirect status code (301 or 302)
  const redirectStatus = urlDoc.redirectType || 301;

  // Perform redirect
  res.redirect(redirectStatus, urlDoc.originalUrl);
}));

module.exports = router;
