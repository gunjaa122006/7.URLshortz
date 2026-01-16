# API Examples

This file contains example API calls for the URL Shortener Service.

## Prerequisites

- Service running on http://localhost:3000
- MongoDB running
- curl or similar HTTP client

---

## 1. Create a Short URL

### Basic Example

```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.github.com/explore"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "URL shortened successfully",
  "data": {
    "shortUrl": "http://localhost:3000/a2B3c4D",
    "shortCode": "a2B3c4D",
    "originalUrl": "https://www.github.com/explore",
    "redirectType": 301,
    "expiresAt": null,
    "createdAt": "2026-01-15T12:00:00.000Z"
  }
}
```

---

### With Custom Alias

```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.github.com",
    "customAlias": "github"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "URL shortened successfully",
  "data": {
    "shortUrl": "http://localhost:3000/github",
    "shortCode": "github",
    "originalUrl": "https://www.github.com",
    "redirectType": 301,
    "expiresAt": null,
    "createdAt": "2026-01-15T12:00:00.000Z"
  }
}
```

---

### With Expiration

```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.example.com/temporary",
    "expiresInDays": 7
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "URL shortened successfully",
  "data": {
    "shortUrl": "http://localhost:3000/x9Y8z7W",
    "shortCode": "x9Y8z7W",
    "originalUrl": "https://www.example.com/temporary",
    "redirectType": 301,
    "expiresAt": "2026-01-22T12:00:00.000Z",
    "createdAt": "2026-01-15T12:00:00.000Z"
  }
}
```

---

### With Temporary Redirect (302)

```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.example.com/tracking",
    "redirectType": 302
  }'
```

---

## 2. Access Short URL (Redirect)

```bash
# Using curl (shows redirect)
curl -I http://localhost:3000/a2B3c4D

# Using browser
# Simply visit: http://localhost:3000/a2B3c4D
```

**Response Headers:**
```
HTTP/1.1 301 Moved Permanently
Location: https://www.github.com/explore
```

---

## 3. Get URL Statistics

```bash
curl http://localhost:3000/api/stats/a2B3c4D
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shortCode": "a2B3c4D",
    "originalUrl": "https://www.github.com/explore",
    "clickCount": 42,
    "createdAt": "2026-01-15T12:00:00.000Z",
    "lastAccessed": "2026-01-15T14:30:00.000Z",
    "expiresAt": null,
    "redirectType": 301
  }
}
```

---

## 4. Health Check

```bash
curl http://localhost:3000/api/health
```

**Response:**
```json
{
  "success": true,
  "message": "Service is healthy",
  "timestamp": "2026-01-15T12:00:00.000Z"
}
```

---

## 5. Service Information

```bash
curl http://localhost:3000/
```

**Response:**
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

## Error Examples

### Invalid URL

```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "url": "not-a-valid-url"
  }'
```

**Response (400):**
```json
{
  "success": false,
  "error": "Invalid URL format"
}
```

---

### Malicious URL Blocked

```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "url": "javascript:alert(1)"
  }'
```

**Response (400):**
```json
{
  "success": false,
  "error": "Protocol 'javascript:' is not allowed for security reasons"
}
```

---

### Custom Alias Already Taken

```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "customAlias": "github"
  }'
```

**Response (409):**
```json
{
  "success": false,
  "error": "Custom alias is already taken"
}
```

---

### Short Code Not Found

```bash
curl http://localhost:3000/nonexistent
```

**Response (404):**
```json
{
  "success": false,
  "error": "Short URL not found"
}
```

---

### Expired URL

```bash
curl http://localhost:3000/expired123
```

**Response (410):**
```json
{
  "success": false,
  "error": "This short URL has expired"
}
```

---

## Testing Rate Limiting

```bash
# Send 101 requests quickly to trigger rate limit
for i in {1..101}; do
  curl -X POST http://localhost:3000/api/shorten \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"https://example.com/test$i\"}" &
done
wait
```

**Expected Response (429) after 100 requests:**
```json
{
  "success": false,
  "error": "Too many URLs created from this IP, please try again later"
}
```

---

## PowerShell Examples (Windows)

### Create Short URL
```powershell
$body = @{
    url = "https://www.github.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/shorten" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

### Get Statistics
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/stats/a2B3c4D"
```

---

## JavaScript/Node.js Examples

### Create Short URL
```javascript
const response = await fetch('http://localhost:3000/api/shorten', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://www.github.com'
  })
});

const data = await response.json();
console.log(data);
```

### Access Short URL
```javascript
const response = await fetch('http://localhost:3000/a2B3c4D', {
  redirect: 'manual'
});

console.log('Redirect to:', response.headers.get('location'));
```

---

## Python Examples

### Create Short URL
```python
import requests

response = requests.post('http://localhost:3000/api/shorten', json={
    'url': 'https://www.github.com'
})

print(response.json())
```

### Get Statistics
```python
response = requests.get('http://localhost:3000/api/stats/a2B3c4D')
print(response.json())
```
