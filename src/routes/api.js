const express = require('express');
const router = express.Router();
const Url = require('../models/Url');
const URLValidator = require('../utils/validator');
const ShortCodeGenerator = require('../utils/shortCodeGenerator');
const SecurityUtils = require('../utils/security');
const { asyncHandler, ErrorResponse } = require('../middleware/errorHandler');
const { createUrlLimiter } = require('../middleware/rateLimiter');

/**
 * @route   POST /api/shorten
 * @desc    Create a shortened URL
 * @access  Public (rate limited)
 */
router.post('/shorten', createUrlLimiter, asyncHandler(async (req, res, next) => {
  const { url, customAlias, redirectType, expiresInDays } = req.body;

  // Validate required fields
  if (!url) {
    return next(new ErrorResponse('URL is required', 400));
  }

  // Sanitize input
  const sanitizedUrl = URLValidator.sanitize(url);

  // Validate URL
  const validation = URLValidator.validate(sanitizedUrl);
  if (!validation.valid) {
    return next(new ErrorResponse(validation.error, 400));
  }

  const normalizedUrl = validation.normalized;

  // Check for existing URL to prevent duplicates (optional but preferred)
  const existingUrl = await Url.findByOriginalUrl(normalizedUrl);
  if (existingUrl) {
    // Return existing short URL instead of creating duplicate
    return res.status(200).json({
      success: true,
      message: 'URL already exists',
      data: {
        shortUrl: `${process.env.BASE_URL}/${existingUrl.shortCode}`,
        shortCode: existingUrl.shortCode,
        originalUrl: existingUrl.originalUrl,
        createdAt: existingUrl.createdAt,
        clickCount: existingUrl.clickCount
      }
    });
  }

  // Generate or validate custom alias
  let shortCode;
  let isCustom = false;

  if (customAlias) {
    // Validate custom alias
    if (!URLValidator.isValidShortCode(customAlias)) {
      return next(new ErrorResponse(
        'Custom alias must be 6-12 characters and contain only letters, numbers, hyphens, and underscores',
        400
      ));
    }

    // Check if custom alias is available
    const existingAlias = await Url.findOne({ shortCode: customAlias });
    if (existingAlias) {
      return next(new ErrorResponse('Custom alias is already taken', 409));
    }

    shortCode = customAlias;
    isCustom = true;
  } else {
    // Generate unique short code
    shortCode = await ShortCodeGenerator.generateUnique(async (code) => {
      const existing = await Url.findOne({ shortCode: code });
      return !!existing;
    });
  }

  // Calculate expiration date if provided
  let expiresAt = null;
  if (expiresInDays && expiresInDays > 0) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  }

  // Validate redirect type
  const validRedirectType = [301, 302].includes(redirectType) 
    ? redirectType 
    : parseInt(process.env.REDIRECT_STATUS_CODE) || 301;

  // Collect metadata
  const clientIP = SecurityUtils.getClientIP(req);
  const ipHash = SecurityUtils.hashIP(clientIP);
  const userAgent = SecurityUtils.sanitizeUserAgent(req.get('user-agent'));

  // Create URL document
  const urlDoc = await Url.create({
    shortCode,
    originalUrl: normalizedUrl,
    redirectType: validRedirectType,
    customAlias: isCustom,
    expiresAt,
    metadata: {
      createdBy: 'api',
      userAgent,
      ipHash
    }
  });

  // Return response
  res.status(201).json({
    success: true,
    message: 'URL shortened successfully',
    data: {
      shortUrl: `${process.env.BASE_URL}/${urlDoc.shortCode}`,
      shortCode: urlDoc.shortCode,
      originalUrl: urlDoc.originalUrl,
      redirectType: urlDoc.redirectType,
      expiresAt: urlDoc.expiresAt,
      createdAt: urlDoc.createdAt
    }
  });
}));

/**
 * @route   GET /api/stats/:shortCode
 * @desc    Get statistics for a shortened URL
 * @access  Public
 */
router.get('/stats/:shortCode', asyncHandler(async (req, res, next) => {
  const { shortCode } = req.params;

  // Validate short code format
  if (!URLValidator.isValidShortCode(shortCode)) {
    return next(new ErrorResponse('Invalid short code format', 400));
  }

  // Find URL
  const urlDoc = await Url.findOne({ shortCode });

  if (!urlDoc) {
    return next(new ErrorResponse('Short URL not found', 404));
  }

  // Check if expired
  if (urlDoc.isExpired()) {
    return next(new ErrorResponse('Short URL has expired', 410));
  }

  // Return statistics (no sensitive data)
  res.status(200).json({
    success: true,
    data: {
      shortCode: urlDoc.shortCode,
      originalUrl: urlDoc.originalUrl,
      clickCount: urlDoc.clickCount,
      createdAt: urlDoc.createdAt,
      lastAccessed: urlDoc.lastAccessed,
      expiresAt: urlDoc.expiresAt,
      redirectType: urlDoc.redirectType
    }
  });
}));

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
