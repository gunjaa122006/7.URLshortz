# 🚀 Deployment Guide

## Deploy to Render (Free + Auto SSL)

### Prerequisites
- GitHub account
- Render account (sign up at https://render.com)

### Step-by-Step Deployment

#### 1. Push to GitHub
```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - URL Shortener"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/urlshortz.git
git branch -M main
git push -u origin main
```

#### 2. Deploy on Render

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com

2. **New Blueprint**
   - Click "New +" → "Blueprint"
   - Connect your GitHub account
   - Select the `urlshortz` repository
   - Click "Connect"

3. **Render will automatically:**
   - Read `render.yaml` configuration
   - Create a Web Service (your app)
   - Create a MongoDB database (free 256MB)
   - Set up SSL certificate (automatic https)
   - Deploy your application

4. **Set BASE_URL**
   - After deployment, go to your web service
   - Copy the URL (like `https://urlshortz-xyz.onrender.com`)
   - Go to Environment tab
   - Set `BASE_URL` to your service URL
   - Save and redeploy

#### 3. Your App is Live! 🎉

You'll get:
- **Public URL**: `https://urlshortz-xyz.onrender.com`
- **Free SSL**: Automatic HTTPS
- **Free Database**: 256MB MongoDB
- **Auto-deploys**: Every git push updates the app

### Notes

**Free Tier Limitations:**
- App sleeps after 15 min of inactivity (takes ~30s to wake)
- 750 hours/month free (plenty for testing)
- 256MB database storage

**To keep app awake:**
- Upgrade to paid tier ($7/month)
- Or use a cron job to ping it every 14 minutes

---

## Alternative: Deploy to Railway

If you prefer Railway (you already have an account):

#### 1. Push to GitHub (same as above)

#### 2. Deploy on Railway

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose `urlshortz` repository
5. Add MongoDB database:
   - Click "+ New"
   - Select "Database" → "MongoDB"
6. Set environment variables:
   - `NODE_ENV=production`
   - `BASE_URL=https://your-app.up.railway.app`
   - `MONGODB_URI` (automatically set from database)
7. Generate domain:
   - Go to Settings → Generate Domain
8. Deploy!

**Railway Benefits:**
- $5 free credit/month
- Faster cold starts
- Easy database management

---

## Alternative: Deploy to Fly.io

Free tier with global CDN:

```bash
# Install flyctl
irm https://fly.io/install.ps1 | iex

# Login
fly auth login

# Launch app
fly launch

# Deploy
fly deploy
```

---

## Environment Variables Needed

For any platform, you need:

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=<your-database-connection-string>
BASE_URL=<your-public-url>
REDIRECT_STATUS_CODE=301
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
IP_HASH_SALT=<random-secure-string>
```

---

## Post-Deployment

1. **Test your app:**
   - Visit `https://your-app-url.com`
   - Create a short URL
   - Test the redirect

2. **Share with friends:**
   - Send them your public URL
   - They can now use your URL shortener!

3. **Monitor:**
   - Check Render/Railway dashboard for logs
   - Monitor database usage

---

## Custom Domain (Optional)

To use your own domain like `shortz.com`:

1. Buy domain from Namecheap, GoDaddy, etc.
2. In Render/Railway:
   - Add custom domain in settings
   - Add CNAME record to your DNS
3. SSL automatically provisions
4. Update `BASE_URL` environment variable

---

## Troubleshooting

**App not loading?**
- Check logs in platform dashboard
- Verify `BASE_URL` matches your actual URL
- Ensure MongoDB is connected

**Database connection failed?**
- Check `MONGODB_URI` is set correctly
- Verify database is running in same region

**CORS errors?**
- The app serves both frontend and API from same domain
- No CORS issues should occur

---

Need help? Check:
- Render Docs: https://render.com/docs
- Railway Docs: https://docs.railway.app
