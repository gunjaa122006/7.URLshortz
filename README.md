# URL Shortener Service

A production-ready URL shortening service built with Node.js, Express, and MongoDB. Designed for reliability, security, and scalability under real-world usage.

## 📋 Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Design Decisions](#design-decisions)
- [Security](#security)
- [Deployment](#deployment)
- [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## 🚀 Features

### Core Functionality
- ✅ **Short URL Generation**: Collision-resistant short codes using nanoid
- ✅ **Duplicate Prevention**: Detects and returns existing short URLs
- ✅ **Custom Aliases**: Support for user-defined short codes
- ✅ **Click Tracking**: Counts redirects without storing user data
- ✅ **URL Expiration**: Optional time-based URL expiration
- ✅ **Proper HTTP Semantics**: 301/302 redirects with correct status codes

### Security
- 🔒 **URL Validation**: Blocks malicious URLs (javascript:, data:, file:)
- 🔒 **NoSQL Injection Protection**: Input sanitization
- 🔒 **Rate Limiting**: Prevents abuse with configurable limits
- 🔒 **Private Network Blocking**: Prevents SSRF in production
- 🔒 **Privacy-Preserving**: Hashes IP addresses, minimal metadata

### Performance
- ⚡ **Optimized Database Indexes**: Fast lookups for redirects
- ⚡ **Connection Pooling**: Efficient MongoDB connections
- ⚡ **Atomic Operations**: Race-condition-free click counting
- ⚡ **Cacheable Redirects**: 301 status for browser caching

---

## 🏗️ Architecture Overview

```
┌─────────────────┐
│   Client        │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Express Server                │
│   - Rate Limiting               │
│   - Input Validation            │
│   - Security Middleware         │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Route Handlers                │
│   - /api/shorten (POST)         │
│   - /:shortCode (GET)           │
│   - /api/stats/:code (GET)      │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   MongoDB                       │
│   - urls collection             │
│   - Indexed fields              │
│   - TTL for expiration          │
└─────────────────────────────────┘
```

### Project Structure

```
urlshortz/
├── src/
│   ├── config/
│   │   └── database.js         # MongoDB connection
│   ├── models/
│   │   └── Url.js              # URL schema and methods
│   ├── routes/
│   │   ├── api.js              # API endpoints
│   │   └── redirect.js         # Redirect handler
│   ├── middleware/
│   │   ├── errorHandler.js     # Error handling
│   │   ├── rateLimiter.js      # Rate limiting
│   │   └── logger.js           # Request logging
│   ├── utils/
│   │   ├── validator.js        # URL validation
│   │   ├── shortCodeGenerator.js # Short code generation
│   │   └── security.js         # Security utilities
│   └── server.js               # Express app
├── .env.example                # Environment template
├── .gitignore
├── package.json
└── README.md
```

---

## 📦 Installation

### Prerequisites

- **Node.js**: v16.0.0 or higher
- **MongoDB**: v4.4 or higher (local or cloud)
- **npm**: v7.0.0 or higher

### Steps

1. **Clone or create the project directory:**

```bash
cd d:\7.URLshortz
```

2. **Install dependencies:**

```bash
npm install
```

3. **Configure environment variables:**

```bash
# Copy the example environment file
copy .env.example .env

# Edit .env with your configuration
```

4. **Start MongoDB** (if running locally):

```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

5. **Run the application:**

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/urlshortz

# Application Configuration
BASE_URL=http://localhost:3000
SHORT_CODE_LENGTH=7

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100       # Max requests per window

# Redirect Configuration
REDIRECT_STATUS_CODE=301          # 301 (permanent) or 302 (temporary)

# Optional: IP Hashing Salt (for privacy-preserving abuse detection)
IP_HASH_SALT=your-random-salt-here
```

### Configuration Details

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment (development/production) | `production` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/urlshortz` |
| `BASE_URL` | Base URL for shortened links | `http://localhost:3000` |
| `SHORT_CODE_LENGTH` | Length of generated short codes | `7` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit time window (ms) | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `REDIRECT_STATUS_CODE` | Default redirect type | `301` |

---

## 📖 API Documentation

### Base URL

```
http://localhost:3000
```

### Endpoints

#### 1. Create Short URL

**Endpoint:** `POST /api/shorten`

**Description:** Creates a shortened URL from a long URL.

**Request Body:**

```json
{
  "url": "https://www.example.com/very/long/url",
  "customAlias": "mylink",           // Optional
  "redirectType": 301,                // Optional: 301 or 302
  "expiresInDays": 30                 // Optional
}
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "message": "URL shortened successfully",
  "data": {
    "shortUrl": "http://localhost:3000/abc123",
    "shortCode": "abc123",
    "originalUrl": "https://www.example.com/very/long/url",
    "redirectType": 301,
    "expiresAt": "2026-02-14T12:00:00.000Z",
    "createdAt": "2026-01-15T12:00:00.000Z"
  }
}
```

**Duplicate URL Response (200 OK):**

If the URL already exists, returns the existing short URL:

```json
{
  "success": true,
  "message": "URL already exists",
  "data": {
    "shortUrl": "http://localhost:3000/abc123",
    "shortCode": "abc123",
    "originalUrl": "https://www.example.com/very/long/url",
    "createdAt": "2026-01-15T12:00:00.000Z",
    "clickCount": 42
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid URL or parameters
- `409 Conflict`: Custom alias already taken
- `429 Too Many Requests`: Rate limit exceeded

---

#### 2. Redirect to Original URL

**Endpoint:** `GET /:shortCode`

**Description:** Redirects to the original URL and increments click count.

**Example:**

```
GET http://localhost:3000/abc123
```

**Response:**

- `301 Moved Permanently` or `302 Found`: Redirects to original URL
- `404 Not Found`: Short code doesn't exist
- `410 Gone`: URL has expired
- `429 Too Many Requests`: Rate limit exceeded

**Headers:**

```
Location: https://www.example.com/very/long/url
```

---

#### 3. Get URL Statistics

**Endpoint:** `GET /api/stats/:shortCode`

**Description:** Retrieves statistics for a shortened URL.

**Example:**

```
GET http://localhost:3000/api/stats/abc123
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "shortCode": "abc123",
    "originalUrl": "https://www.example.com/very/long/url",
    "clickCount": 42,
    "createdAt": "2026-01-15T12:00:00.000Z",
    "lastAccessed": "2026-01-15T14:30:00.000Z",
    "expiresAt": null,
    "redirectType": 301
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid short code format
- `404 Not Found`: Short code doesn't exist
- `410 Gone`: URL has expired

---

#### 4. Health Check

**Endpoint:** `GET /api/health`

**Description:** Service health check.

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Service is healthy",
  "timestamp": "2026-01-15T12:00:00.000Z"
}
```

---

#### 5. Service Info

**Endpoint:** `GET /`

**Description:** Returns service information and available endpoints.

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "URL Shortener Service",
  "version": "1.0.0",
  "endpoints": {
    "shorten": "POST /api/shorten",
    "stats": "GET /api/stats/:shortCode",
    "redirect": "GET /:shortCode",
    "health": "GET /api/health"
  },
  "documentation": "See README.md for API documentation"
}
```

---

## 🎯 Design Decisions

### 1. Short Code Generation Strategy

**Implementation:** nanoid with custom alphabet

**Why:**
- Cryptographically strong random generation
- Collision-resistant (58^7 = ~2.2 trillion combinations)
- URL-safe characters only
- Excludes ambiguous characters (0, O, I, l)
- Configurable length for scalability

**Collision Handling:**
- Retry mechanism (5 attempts)
- Automatic length increase on collision
- Database uniqueness constraint as final safeguard

### 2. Duplicate URL Prevention

**Implementation:** Index on `originalUrl` field

**Why:**
- Prevents database bloat
- Reduces storage costs
- Improves user experience (consistent short URLs)
- Fast lookup with indexed queries

**Trade-off:** Slightly increases write latency but dramatically improves efficiency

### 3. Redirect Status Codes

**301 Permanent (Default):**
- Cacheable by browsers and CDNs
- Reduces server load for popular links
- Best for stable, long-term URLs

**302 Temporary (Optional):**
- Not cached by browsers
- Better for tracking every click
- Use for time-sensitive or frequently changing destinations

**Configuration:** Adjustable per URL or globally via environment variable

### 4. Security Measures

#### URL Validation
- Blocks dangerous protocols (javascript:, data:, file:)
- Prevents XSS and injection attacks
- Validates URL structure using industry-standard library
- Blocks private IP ranges in production (SSRF prevention)

#### Rate Limiting
- **Creation Endpoint:** 100 requests per 15 minutes per IP
- **Redirect Endpoint:** 100 requests per minute per IP
- **General API:** 500 requests per 15 minutes per IP

#### Privacy
- IP addresses are hashed, never stored in plaintext
- No user tracking or PII collection
- Click count only, no individual click records

### 5. Database Schema

**Indexes:**
```javascript
shortCode: unique index        // O(1) redirect lookup
originalUrl: index            // Fast duplicate detection
expiresAt: TTL index          // Automatic cleanup
```

**Why:**
- Optimizes the most common operation (redirects)
- Enables efficient duplicate detection
- Automatic expiration without cron jobs

### 6. Error Handling

**Approach:** Centralized error handling middleware

**Benefits:**
- Consistent error responses across all endpoints
- Proper HTTP status codes
- Development-friendly error details
- Production-safe error messages

---

## 🔒 Security

### Implemented Protections

1. **Input Validation**
   - URL format validation
   - Length restrictions
   - Character whitelist for short codes

2. **Injection Prevention**
   - NoSQL injection protection via express-mongo-sanitize
   - URL encoding validation
   - Dangerous pattern detection

3. **Abuse Prevention**
   - Rate limiting on all endpoints
   - IP-based throttling
   - Duplicate submission detection

4. **Network Security**
   - SSRF prevention (blocks private IPs in production)
   - Protocol whitelist (HTTP/HTTPS only)
   - localhost blocking in production

5. **Privacy**
   - IP hashing instead of storage
   - Minimal metadata collection
   - No user tracking

6. **Security Headers**
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection: 1; mode=block
   - Referrer-Policy: strict-origin-when-cross-origin

### Known Limitations

- No authentication/authorization (by design)
- No CAPTCHA for bot prevention (can be added)
- No distributed rate limiting (uses in-memory store)

### Recommendations for Production

1. Use HTTPS exclusively
2. Implement CAPTCHA for creation endpoint
3. Use Redis for distributed rate limiting
4. Add monitoring and alerting
5. Implement log aggregation
6. Set up Web Application Firewall (WAF)
7. Regular security audits

---

## 🚢 Deployment

### Local Development

```bash
# Install dependencies
npm install

# Start MongoDB
# Windows: net start MongoDB
# Linux/Mac: sudo systemctl start mongod

# Run in development mode
npm run dev
```

### Production Deployment

#### Option 1: Traditional Server (VPS/Dedicated)

```bash
# Install dependencies
npm install --production

# Set environment to production
export NODE_ENV=production

# Use a process manager (PM2)
npm install -g pm2
pm2 start src/server.js --name urlshortz
pm2 startup
pm2 save
```

#### Option 2: Docker

Create `Dockerfile`:

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "src/server.js"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/urlshortz
    depends_on:
      - mongo
  
  mongo:
    image: mongo:6
    volumes:
      - mongo-data:/data/db
    ports:
      - "27017:27017"

volumes:
  mongo-data:
```

Run:

```bash
docker-compose up -d
```

#### Option 3: Cloud Platforms

**Heroku:**
```bash
heroku create
heroku addons:create mongolab
git push heroku main
```

**AWS/Azure/GCP:**
- Deploy via Elastic Beanstalk, App Service, or Cloud Run
- Use managed MongoDB (Atlas, DocumentDB, CosmosDB)
- Configure environment variables in platform settings

### Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Database Backup

```bash
# Backup
mongodump --uri="mongodb://localhost:27017/urlshortz" --out=/backup/$(date +%Y%m%d)

# Restore
mongorestore --uri="mongodb://localhost:27017/urlshortz" /backup/20260115/urlshortz
```

---

## 📊 Monitoring and Maintenance

### Key Metrics to Monitor

1. **Performance**
   - Response time (p50, p95, p99)
   - Redirect latency
   - Database query performance

2. **Availability**
   - Uptime percentage
   - Error rate
   - Database connection status

3. **Usage**
   - Requests per second
   - URLs created per day
   - Top redirected URLs
   - Rate limit hits

4. **Resources**
   - CPU usage
   - Memory usage
   - Database size
   - Connection pool utilization

### Logging

Logs include:
- Request method, path, status code, duration
- Error stack traces (development only)
- MongoDB connection events

### Maintenance Tasks

#### Daily
- Monitor error logs
- Check rate limit violations
- Verify database connectivity

#### Weekly
- Review top URLs
- Analyze slow queries
- Check database size growth

#### Monthly
- Database backup
- Review and clean expired URLs
- Update dependencies
- Security audit

### Database Cleanup

```javascript
// Remove expired URLs (runs automatically with TTL index)
// Manual cleanup if needed:
db.urls.deleteMany({ expiresAt: { $lt: new Date() } })

// Remove old unused URLs (example: not accessed in 1 year)
db.urls.deleteMany({
  lastAccessed: { $lt: new Date(Date.now() - 365*24*60*60*1000) },
  clickCount: 0
})
```

---

## 🧪 Testing

### Manual API Testing

```bash
# Create a short URL
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.example.com"}'

# Get statistics
curl http://localhost:3000/api/stats/abc123

# Test redirect (should return 301)
curl -I http://localhost:3000/abc123

# Health check
curl http://localhost:3000/api/health
```

### Security Testing

```bash
# Test malicious URL blocking
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "javascript:alert(1)"}'

# Test rate limiting
for i in {1..110}; do
  curl -X POST http://localhost:3000/api/shorten \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"https://example.com/test$i\"}"
done
```

---

## 📝 License

MIT License - feel free to use this in production or modify as needed.

---

## 🤝 Contributing

This is a production-ready service. When contributing:

1. Maintain security standards
2. Add tests for new features
3. Update documentation
4. Follow existing code style
5. Consider performance implications

---

## 📞 Support

For issues, questions, or contributions, please open an issue or contact the development team.

---

**Built with ❤️ for reliability, security, and performance.**
