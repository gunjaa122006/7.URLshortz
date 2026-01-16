const mongoose = require('mongoose');

/**
 * URL Schema for MongoDB
 * 
 * Design Decisions:
 * - shortCode is unique and indexed for O(1) lookup performance
 * - originalUrl is indexed to prevent duplicates and enable fast duplicate detection
 * - clickCount tracks usage without storing user data (privacy-focused)
 * - Timestamps track creation and last access for analytics and cleanup
 * - TTL index can be added for automatic expiration if needed
 */

const urlSchema = new mongoose.Schema({
  // Short code that appears in the shortened URL
  shortCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
    minlength: 6,
    maxlength: 12
  },
  
  // Original long URL that the short code redirects to
  originalUrl: {
    type: String,
    required: true,
    trim: true,
    index: true,  // Indexed for duplicate detection
    maxlength: 2048  // Maximum URL length per RFC 2616
  },
  
  // Click tracking (no user data stored)
  clickCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Timestamp of last access for analytics
  lastAccessed: {
    type: Date,
    default: null
  },
  
  // Custom redirect type (301 permanent or 302 temporary)
  redirectType: {
    type: Number,
    enum: [301, 302],
    default: 301
  },
  
  // Optional: expiration date for temporary URLs
  expiresAt: {
    type: Date,
    default: null,
    index: true
  },
  
  // Optional: custom alias requested by user
  customAlias: {
    type: Boolean,
    default: false
  },
  
  // Metadata for debugging and monitoring
  metadata: {
    createdBy: {
      type: String,
      default: 'system'
    },
    userAgent: String,
    ipHash: String  // Hashed IP for abuse detection without storing raw IPs
  }
}, {
  timestamps: true,  // Adds createdAt and updatedAt automatically
  collection: 'urls'
});

// Compound index for efficient queries
urlSchema.index({ originalUrl: 1, createdAt: -1 });

// TTL index for automatic cleanup of expired URLs
urlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Static method to find URL by short code
 * Increments click count and updates last accessed time
 */
urlSchema.statics.findAndIncrementClicks = async function(shortCode) {
  return this.findOneAndUpdate(
    { shortCode, $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] },
    { 
      $inc: { clickCount: 1 },
      $set: { lastAccessed: new Date() }
    },
    { new: true }
  );
};

/**
 * Static method to find existing URL to prevent duplicates
 */
urlSchema.statics.findByOriginalUrl = async function(originalUrl) {
  return this.findOne({ 
    originalUrl,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
  });
};

/**
 * Instance method to check if URL has expired
 */
urlSchema.methods.isExpired = function() {
  if (!this.expiresAt) return false;
  return this.expiresAt < new Date();
};

// Pre-save hook for validation
urlSchema.pre('save', function(next) {
  if (this.expiresAt && this.expiresAt < new Date()) {
    next(new Error('Expiration date cannot be in the past'));
  }
  next();
});

// Create and export the model
const URL = mongoose.model('URL', urlSchema);

module.exports = URL;
