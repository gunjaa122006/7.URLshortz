/**
 * Request Logger Middleware
 * Logs incoming requests for monitoring and debugging
 */

const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log after response is sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logMessage = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;
    
    if (process.env.NODE_ENV !== 'production' || res.statusCode >= 400) {
      console.log(logMessage);
    }
  });

  next();
};

module.exports = requestLogger;
