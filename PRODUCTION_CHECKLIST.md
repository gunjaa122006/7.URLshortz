# Production Deployment Checklist

Use this checklist before deploying to production.

## ✅ Pre-Deployment

### Configuration
- [ ] Set `NODE_ENV=production` in environment
- [ ] Use strong `IP_HASH_SALT` (random, secure string)
- [ ] Set correct `BASE_URL` (your domain)
- [ ] Configure production MongoDB URI (Atlas, managed service)
- [ ] Review rate limit settings for your expected traffic
- [ ] Set appropriate `SHORT_CODE_LENGTH` (7-8 recommended)

### Security
- [ ] HTTPS enabled (SSL/TLS certificate)
- [ ] Firewall configured (only necessary ports open)
- [ ] MongoDB authentication enabled
- [ ] MongoDB access restricted to application servers only
- [ ] No default passwords or credentials
- [ ] Security headers verified (X-Frame-Options, etc.)
- [ ] CORS configured if needed

### Database
- [ ] MongoDB indexes created (automatic on first run)
- [ ] Connection string uses authentication
- [ ] Connection pool size appropriate for server
- [ ] Backup strategy in place
- [ ] Monitoring enabled

### Application
- [ ] All dependencies installed (`npm install --production`)
- [ ] No dev dependencies in production
- [ ] Logs configured (rotation, aggregation)
- [ ] Error tracking enabled (Sentry, etc.)
- [ ] Health check endpoint accessible

---

## 🚀 Deployment Steps

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js v16+
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB or use managed service
# For managed service, skip local installation
```

### 2. Application Deployment

```bash
# Clone or upload files
cd /var/www/urlshortz

# Install dependencies (production only)
npm install --production

# Set environment variables
cp .env.example .env
nano .env  # Edit with production values
```

### 3. Process Manager (PM2)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start application
pm2 start src/server.js --name urlshortz

# Configure startup script
pm2 startup systemd
pm2 save

# Monitor
pm2 status
pm2 logs urlshortz
```

### 4. Reverse Proxy (Nginx)

```bash
# Install Nginx
sudo apt install nginx

# Create configuration
sudo nano /etc/nginx/sites-available/urlshortz
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/urlshortz /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 5. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

---

## 📊 Post-Deployment

### Verification
- [ ] Service starts successfully
- [ ] Health check responds: `curl https://yourdomain.com/api/health`
- [ ] Can create short URLs
- [ ] Redirects work correctly
- [ ] HTTPS enforced
- [ ] Rate limiting active
- [ ] Logs being written
- [ ] Database connected

### Testing

```bash
# Test from external location
curl -X POST https://yourdomain.com/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.example.com"}'

# Test redirect
curl -I https://yourdomain.com/{shortCode}

# Test rate limiting
# (Run 101 requests rapidly)

# Test security
curl -X POST https://yourdomain.com/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "javascript:alert(1)"}'
# Should return 400 error
```

### Monitoring Setup
- [ ] Uptime monitoring configured (Pingdom, UptimeRobot)
- [ ] Error tracking enabled (Sentry)
- [ ] Log aggregation configured (Loggly, Papertrail)
- [ ] Performance monitoring (New Relic, DataDog)
- [ ] Database monitoring (MongoDB Atlas, mLab)
- [ ] Alert thresholds configured
- [ ] On-call rotation established

---

## 🔧 Maintenance

### Daily
- [ ] Check error logs
- [ ] Monitor response times
- [ ] Verify database connectivity
- [ ] Check rate limit violations

### Weekly
- [ ] Review top URLs
- [ ] Analyze slow queries
- [ ] Check disk space
- [ ] Review security logs

### Monthly
- [ ] Database backup verification
- [ ] Update dependencies (`npm audit`)
- [ ] Security patches applied
- [ ] Performance review
- [ ] Capacity planning review

### Quarterly
- [ ] Full security audit
- [ ] Load testing
- [ ] Disaster recovery drill
- [ ] Documentation updates

---

## 🔄 Backup Strategy

### Database Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/backups/urlshortz"

mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/$DATE"

# Keep only last 30 days
find $BACKUP_DIR -type d -mtime +30 -exec rm -rf {} +
```

### Application Backups
- [ ] Code in version control (Git)
- [ ] Environment configuration backed up securely
- [ ] SSL certificates backed up
- [ ] Nginx configuration backed up

---

## 🚨 Incident Response

### Service Down
1. Check application logs: `pm2 logs urlshortz`
2. Check database connectivity: `mongosh`
3. Check system resources: `top`, `df -h`
4. Restart if needed: `pm2 restart urlshortz`
5. Check Nginx: `sudo systemctl status nginx`

### High Traffic
1. Monitor rate limits
2. Check database performance
3. Scale horizontally if needed
4. Review slow queries

### Security Incident
1. Check access logs
2. Review rate limit violations
3. Identify attack patterns
4. Update firewall rules if needed
5. Contact security team

---

## 📈 Scaling Considerations

### When to Scale

Monitor these metrics:
- Response time > 200ms (p95)
- CPU usage > 70% sustained
- Memory usage > 80%
- Database connections > 80% of pool
- Error rate > 0.5%

### Horizontal Scaling

1. **Load Balancer**: Add Nginx/HAProxy
2. **Multiple App Instances**: PM2 cluster mode or multiple servers
3. **Distributed Rate Limiting**: Use Redis instead of in-memory
4. **Database Replication**: MongoDB replica set
5. **CDN**: For static redirects (301 only)

### Redis for Rate Limiting

```bash
# Install Redis
sudo apt install redis-server

# Update rate limiting code to use Redis
# npm install rate-limit-redis
```

---

## 🔐 Security Hardening

### Operating System
- [ ] Firewall enabled (ufw, iptables)
- [ ] Automatic security updates enabled
- [ ] Non-root user for application
- [ ] SSH key authentication only
- [ ] Fail2ban installed

### Application
- [ ] No sensitive data in logs
- [ ] Error messages don't leak info
- [ ] Dependencies up to date
- [ ] npm audit clean
- [ ] Input validation on all endpoints

### Network
- [ ] MongoDB not exposed to internet
- [ ] Application only accessible via Nginx
- [ ] Rate limiting configured
- [ ] DDoS protection (Cloudflare, AWS Shield)

---

## ✅ Production Readiness Checklist

- [ ] All configuration items completed
- [ ] Security hardening applied
- [ ] Monitoring and alerting configured
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan documented
- [ ] Team trained on operations
- [ ] Runbook created for common issues
- [ ] Performance benchmarks established
- [ ] Load testing completed
- [ ] Security audit passed

---

## 📞 Support Contacts

### Critical Issues
- On-call: [Phone/Pager]
- Emergency: [Email]

### Non-Critical
- Support: [Email/Slack]
- Documentation: [URL]

---

**Last Updated:** 2026-01-15  
**Next Review:** 2026-02-15
