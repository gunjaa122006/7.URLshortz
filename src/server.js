require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/database');
const apiRoutes = require('./routes/api');
const redirectRoutes = require('./routes/redirect');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const requestLogger = require('./middleware/logger');

/**
 * Production-Ready URL Shortener Service
 * 
 * Features:
 * - Collision-resistant short code generation
 * - URL validation and security checks
 * - Rate limiting for abuse prevention
 * - Duplicate URL detection
 * - Click tracking without user data collection
 * - Proper HTTP redirect semantics
 * - MongoDB with optimized indexes
 * - Error handling and logging
 */

// Initialize Express app
const app = express();

// Trust proxy (important for rate limiting and IP detection behind reverse proxy)
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// ===== Middleware =====

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Security: Sanitize data against NoSQL injection
app.use(mongoSanitize());

// Request logging
app.use(requestLogger);

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// ===== Routes =====

// Root endpoint (must be before catch-all redirect route)
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'URL Shortener Service',
    version: '1.0.0',
    endpoints: {
      shorten: 'POST /api/shorten',
      stats: 'GET /api/stats/:shortCode',
      redirect: 'GET /:shortCode',
      health: 'GET /api/health'
    },
    documentation: 'See README.md for API documentation'
  });
});

// API routes (prefixed with /api - must come before catch-all redirect)
app.use('/api', apiRoutes);

// Redirect routes (root level for short URLs - must be last)
app.use('/', redirectRoutes);

// ===== Error Handling =====

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ===== Server Startup =====

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   URL Shortener Service Started        ║
╠════════════════════════════════════════╣
║   Environment: ${process.env.NODE_ENV || 'development'.padEnd(22)}║
║   Port: ${PORT.toString().padEnd(30)}║
║   Base URL: ${(process.env.BASE_URL || 'http://localhost:3000').padEnd(26)}║
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;
