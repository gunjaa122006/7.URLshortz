# Quick Start Guide

Get the URL Shortener Service running in 5 minutes.

## Prerequisites Check

Before starting, ensure you have:

- [ ] Node.js v16+ installed (`node --version`)
- [ ] MongoDB installed and running
- [ ] npm installed (`npm --version`)

---

## Step 1: Install Dependencies

```bash
cd d:\7.URLshortz
npm install
```

This will install:
- express (web framework)
- mongoose (MongoDB ODM)
- nanoid (short code generation)
- express-rate-limit (rate limiting)
- validator (URL validation)
- dotenv (environment configuration)
- express-mongo-sanitize (security)

---

## Step 2: Start MongoDB

### Windows:
```bash
net start MongoDB
```

### macOS:
```bash
brew services start mongodb-community
```

### Linux:
```bash
sudo systemctl start mongod
```

### Using Docker:
```bash
docker run -d -p 27017:27017 --name mongodb mongo:6
```

### Verify MongoDB is running:
```bash
# Should connect successfully
mongosh
```

---

## Step 3: Configure Environment

The `.env` file has been created with development defaults. No changes needed for local development.

**Current settings:**
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/urlshortz
BASE_URL=http://localhost:3000
```

---

## Step 4: Start the Service

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

You should see:
```
╔════════════════════════════════════════╗
║   URL Shortener Service Started        ║
╠════════════════════════════════════════╣
║   Environment: development             ║
║   Port: 3000                           ║
║   Base URL: http://localhost:3000      ║
╚════════════════════════════════════════╝

MongoDB Connected: localhost
```

---

## Step 5: Test the Service

### Using curl:

```bash
# Create a short URL
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.github.com"}'
```

### Using PowerShell (Windows):

```powershell
$body = @{ url = "https://www.github.com" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/shorten" -Method Post -ContentType "application/json" -Body $body
```

### Using a browser:

1. Open http://localhost:3000 - should see service info
2. Use a tool like Postman or Thunder Client to test API endpoints

---

## Step 6: Create Your First Short URL

### Request:
```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.example.com/very/long/url/that/needs/shortening"}'
```

### Response:
```json
{
  "success": true,
  "message": "URL shortened successfully",
  "data": {
    "shortUrl": "http://localhost:3000/a2B3c4D",
    "shortCode": "a2B3c4D",
    "originalUrl": "https://www.example.com/very/long/url/that/needs/shortening",
    "redirectType": 301,
    "expiresAt": null,
    "createdAt": "2026-01-15T12:00:00.000Z"
  }
}
```

---

## Step 7: Test the Redirect

Visit the short URL in your browser:
```
http://localhost:3000/a2B3c4D
```

You should be redirected to the original URL!

Or test with curl:
```bash
curl -I http://localhost:3000/a2B3c4D
```

Expected response:
```
HTTP/1.1 301 Moved Permanently
Location: https://www.example.com/very/long/url/that/needs/shortening
```

---

## Step 8: Check Statistics

```bash
curl http://localhost:3000/api/stats/a2B3c4D
```

Response shows click count and metadata:
```json
{
  "success": true,
  "data": {
    "shortCode": "a2B3c4D",
    "originalUrl": "https://www.example.com/very/long/url/that/needs/shortening",
    "clickCount": 1,
    "createdAt": "2026-01-15T12:00:00.000Z",
    "lastAccessed": "2026-01-15T12:05:00.000Z",
    "expiresAt": null,
    "redirectType": 301
  }
}
```

---

## Common Issues & Solutions

### Issue: "Cannot connect to MongoDB"

**Solution:**
1. Verify MongoDB is running: `mongosh` or check Task Manager
2. Check connection string in `.env`
3. Try restarting MongoDB

### Issue: "Port 3000 is already in use"

**Solution:**
1. Change PORT in `.env` to 3001 or another available port
2. Or kill the process using port 3000

### Issue: npm install fails

**Solution:**
1. Ensure Node.js v16+ is installed
2. Try `npm cache clean --force`
3. Delete `node_modules` and `package-lock.json`, then `npm install` again

### Issue: "Module not found" errors

**Solution:**
Run `npm install` again to ensure all dependencies are installed

---

## Next Steps

Now that your service is running:

1. **Read the API Documentation**: See [README.md](README.md) for complete API docs
2. **Try Advanced Features**:
   - Custom aliases
   - URL expiration
   - Different redirect types
3. **Check Security**: Test malicious URL blocking
4. **Monitor Performance**: Watch the console logs
5. **Explore the Code**: See how short codes are generated in `src/utils/shortCodeGenerator.js`

---

## Development Workflow

### Making Changes

1. Edit files in `src/`
2. If using `npm run dev`, changes auto-reload
3. Test your changes
4. Check logs for errors

### Testing Security

```bash
# Should be blocked
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "javascript:alert(1)"}'
```

### Testing Rate Limiting

```bash
# Send 101 requests - last one should be rate limited
for i in {1..101}; do
  curl -X POST http://localhost:3000/api/shorten \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"https://example.com/test$i\"}"
done
```

---

## Stopping the Service

### Development mode:
Press `Ctrl+C` in the terminal

### Production mode (if using PM2):
```bash
pm2 stop urlshortz
```

---

## Database Management

### View all short URLs:
```bash
mongosh
use urlshortz
db.urls.find().pretty()
```

### Check database stats:
```bash
db.urls.stats()
```

### Clear all URLs (careful!):
```bash
db.urls.deleteMany({})
```

---

## Ready for Production?

See [README.md](README.md) deployment section for:
- Production configuration
- Nginx reverse proxy setup
- Docker deployment
- Cloud platform deployment
- Security hardening

---

**Congratulations! Your URL Shortener Service is now running! 🎉**

For complete documentation, see [README.md](README.md)  
For API examples, see [API_EXAMPLES.md](API_EXAMPLES.md)
