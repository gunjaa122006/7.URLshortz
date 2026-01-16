# URL Shortener Service - Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         INTERNET                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
                  ┌────────────────┐
                  │  Load Balancer │ (Optional)
                  │   Nginx/CDN    │
                  └────────┬───────┘
                           │
                           ▼
        ┌──────────────────┴──────────────────┐
        │                                      │
        ▼                                      ▼
┌───────────────┐                    ┌───────────────┐
│ Express Server│                    │ Express Server│ (Scale)
│   Node.js     │                    │   Node.js     │
└───────┬───────┘                    └───────┬───────┘
        │                                    │
        └──────────────┬─────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │    MongoDB     │
              │  Primary + RS  │ (Replica Set)
              └────────────────┘
```

## Request Flow

### Creating a Short URL

```
Client Request
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│ 1. Rate Limiter Middleware                              │
│    - Check IP-based rate limits                         │
│    - 100 requests per 15 minutes                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Input Validation                                      │
│    - Sanitize input (remove null bytes, control chars)  │
│    - Check URL format                                   │
│    - Block dangerous protocols                          │
│    - Prevent SSRF (localhost/private IPs)              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Duplicate Detection                                   │
│    - Query MongoDB for existing URL                     │
│    - Return existing if found                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Short Code Generation                                 │
│    - Generate using nanoid (collision-resistant)        │
│    - Validate uniqueness                                │
│    - Retry on collision (up to 5 times)                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Store in Database                                     │
│    - Create URL document                                │
│    - Store metadata (hashed IP, user agent)            │
│    - Set expiration if provided                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 6. Return Response                                       │
│    - Short URL                                          │
│    - Metadata                                           │
│    - 201 Created                                        │
└─────────────────────────────────────────────────────────┘
```

### Redirecting Short URL

```
Client Request (GET /:shortCode)
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│ 1. Rate Limiter                                          │
│    - 100 requests per minute per IP                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Validate Short Code Format                           │
│    - 6-12 alphanumeric characters                       │
│    - Valid character set                                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Database Lookup (Atomic)                             │
│    - Find by shortCode                                  │
│    - Increment clickCount                               │
│    - Update lastAccessed                                │
│    - All in one operation (race-condition free)        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Check Expiration                                      │
│    - Validate expiresAt                                 │
│    - Return 410 Gone if expired                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Redirect                                              │
│    - 301 Moved Permanently (default, cacheable)        │
│    - 302 Found (optional, not cached)                   │
│    - Location header: originalUrl                       │
└─────────────────────────────────────────────────────────┘
```

## Database Schema

```
┌─────────────────────────────────────────────────────────┐
│                     urls Collection                      │
├─────────────────────────────────────────────────────────┤
│ _id              : ObjectId (auto)                      │
│ shortCode        : String (indexed, unique)    *        │
│ originalUrl      : String (indexed)            *        │
│ clickCount       : Number (default: 0)                  │
│ lastAccessed     : Date                                 │
│ redirectType     : Number (301 or 302)                  │
│ expiresAt        : Date (indexed, TTL)                  │
│ customAlias      : Boolean                              │
│ metadata         : Object {                             │
│   createdBy      :   String                             │
│   userAgent      :   String                             │
│   ipHash         :   String                             │
│ }                                                        │
│ createdAt        : Date (auto)                          │
│ updatedAt        : Date (auto)                          │
└─────────────────────────────────────────────────────────┘

Indexes:
* shortCode (unique, primary lookup)
* originalUrl (duplicate detection)
* expiresAt (TTL, automatic cleanup)
* compound: originalUrl + createdAt (sorted queries)
```

## Short Code Generation

```
┌─────────────────────────────────────────────────────────┐
│              Short Code Generation Logic                 │
└─────────────────────────────────────────────────────────┘

Alphabet: [1-9A-HJ-NP-Za-km-z] (58 characters)
  - Excludes: 0, O, I, l (ambiguous characters)

Length: 7 characters (configurable)

Total Combinations: 58^7 = 2,207,984,167,552
                    (~2.2 trillion unique codes)

Collision Probability:
  - At 1 million URLs:  ~0.0000002% chance
  - At 10 million URLs: ~0.000002% chance
  - At 100 million URLs: ~0.0002% chance

Generation Process:
1. Generate random 7-char code using nanoid
2. Check database for existence
3. If exists, retry (up to 5 times)
4. If all retries fail, increase length to 8 chars
5. Store with unique index constraint (final safeguard)

Average Generation Time: <1ms
```

## Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                   Security Architecture                  │
└─────────────────────────────────────────────────────────┘

Layer 1: Network
  ├─ Firewall rules
  ├─ DDoS protection (optional)
  └─ HTTPS/TLS encryption

Layer 2: Application Gateway (Nginx)
  ├─ SSL termination
  ├─ Request filtering
  └─ Header security

Layer 3: Rate Limiting
  ├─ IP-based throttling
  ├─ Endpoint-specific limits
  └─ Distributed limiting (Redis)

Layer 4: Input Validation
  ├─ URL format validation
  ├─ Protocol whitelist (http/https only)
  ├─ Length restrictions
  └─ Character validation

Layer 5: Security Middleware
  ├─ NoSQL injection prevention
  ├─ XSS protection
  └─ CSRF protection

Layer 6: Business Logic
  ├─ SSRF prevention (block private IPs)
  ├─ Malicious URL detection
  ├─ Custom alias validation
  └─ Expiration enforcement

Layer 7: Data Protection
  ├─ IP address hashing
  ├─ Minimal metadata collection
  └─ No PII storage
```

## Performance Optimizations

```
┌─────────────────────────────────────────────────────────┐
│                  Performance Strategy                    │
└─────────────────────────────────────────────────────────┘

Database Level:
  ├─ Indexed fields for O(1) lookups
  ├─ Connection pooling (10 connections)
  ├─ Atomic operations (no race conditions)
  └─ TTL index for automatic cleanup

Application Level:
  ├─ Asynchronous operations
  ├─ Minimal middleware overhead
  ├─ Efficient error handling
  └─ No unnecessary processing in hot path

Network Level:
  ├─ 301 redirects (browser caching)
  ├─ CDN distribution (optional)
  ├─ HTTP/2 support
  └─ Compression (gzip)

Expected Performance:
  ├─ Create URL: <50ms (p95)
  ├─ Redirect: <10ms (p95)
  ├─ Stats lookup: <30ms (p95)
  └─ Throughput: 1000+ req/sec (single instance)
```

## Scalability Path

```
Stage 1: Single Server (0-100K URLs)
  ├─ One Express instance
  ├─ Local MongoDB
  └─ No caching needed

Stage 2: Optimized Single (100K-1M URLs)
  ├─ PM2 cluster mode (CPU cores)
  ├─ MongoDB connection pooling
  └─ Nginx reverse proxy

Stage 3: Horizontal Scale (1M-10M URLs)
  ├─ Multiple application servers
  ├─ Load balancer
  ├─ MongoDB replica set
  └─ Redis for rate limiting

Stage 4: Distributed (10M+ URLs)
  ├─ Microservices architecture
  ├─ MongoDB sharding
  ├─ CDN for redirects
  ├─ Separate read/write paths
  └─ Caching layer (Redis/Memcached)
```

## Monitoring Points

```
Application Metrics:
  ├─ Request rate (per endpoint)
  ├─ Response time (p50, p95, p99)
  ├─ Error rate by status code
  ├─ Rate limit violations
  └─ Active connections

Database Metrics:
  ├─ Query performance
  ├─ Connection pool utilization
  ├─ Index hit rate
  ├─ Document count
  └─ Storage size

System Metrics:
  ├─ CPU usage
  ├─ Memory usage
  ├─ Disk I/O
  ├─ Network bandwidth
  └─ Open file descriptors

Business Metrics:
  ├─ URLs created per day
  ├─ Redirects per day
  ├─ Top URLs by clicks
  ├─ Average URL lifetime
  └─ Custom alias usage rate
```

## Error Handling Flow

```
Error Occurs
    │
    ▼
┌─────────────────────────────────────┐
│ Is it an operational error?         │
│ (ValidationError, NotFound, etc.)   │
└──────────┬──────────────────────────┘
           │
    ┌──────┴──────┐
    │             │
   Yes            No
    │             │
    ▼             ▼
┌─────────┐  ┌────────────┐
│ Handle  │  │ Log error  │
│ graceful│  │ Send 500   │
│ Return  │  │ Alert team │
│ 4xx     │  │            │
└─────────┘  └────────────┘
```
