# Nginx Deployment Guide for kuehne.dimeconsultants.africa

## Overview

This guide covers deploying the K+N Finance Automation platform to the `kuehne.dimeconsultants.africa` subdomain using Nginx as a reverse proxy with Docker Compose.

## Architecture

```
Internet
    ↓
kuehne.dimeconsultants.africa (Your IP)
    ↓
Nginx (Port 80/443) [Docker Container]
    ↓
Next.js App (Port 3000) [Docker Container]
```

## Prerequisites

- VPS with Docker and Docker Compose installed
- Domain: `dimeconsultants.africa` with DNS access
- SSH access to VPS
- Your server IP address

## Step 1: Configure DNS

1. Go to your domain registrar's DNS settings for `dimeconsultants.africa`
2. Add an A record:
   - Name: `kuehne`
   - Type: `A`
   - Value: `YOUR_SERVER_IP` (you'll add this)
   - TTL: 3600

This creates the subdomain: `kuehne.dimeconsultants.africa`

## Step 2: Prepare VPS

SSH into your VPS:
```bash
ssh root@YOUR_SERVER_IP

# Update system
apt update && apt upgrade -y

# Install Docker (if not already installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose (if not already installed)
apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version
```

## Step 3: Clone Project and Setup Environment

```bash
# Clone the repository
git clone https://github.com/kib4n4/Dime-Consultants-K-N.git
cd Dime-Consultants-K-N

# Copy environment template
cp .env.example .env.local

# Edit environment variables
nano .env.local
```

### .env.local Configuration

```env
# Your server IP and domain
NEXT_PUBLIC_ALLOWED_HOSTS=kuehne.dimeconsultants.africa,localhost

# Backend Django API
NEXT_PUBLIC_BACKEND_URL=https://api.dimeconsultants.africa

# Security
NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS=false

# Optional: Grok AI
XAI_API_KEY=your_api_key_if_needed
```

## Step 4: Start Docker Containers

```bash
# Start containers in background
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

Wait for containers to be healthy (should take 30-60 seconds).

## Step 5: Verify HTTP Works

```bash
# Test from VPS
curl -I http://kuehne.dimeconsultants.africa

# Should return: HTTP/1.1 200 OK
```

## Step 6: Setup SSL Certificate (Let's Encrypt)

### Install Certbot

```bash
apt install certbot python3-certbot-nginx -y
```

### Generate Certificate

```bash
# Stop Nginx temporarily if needed
# docker-compose stop nginx

# Generate certificate
certbot certonly --standalone \
  -d kuehne.dimeconsultants.africa \
  --email your-email@example.com \
  --agree-tos \
  --non-interactive
```

Certificate is installed to: `/etc/letsencrypt/live/kuehne.dimeconsultants.africa/`

### Update Nginx Configuration

Edit `/vercel/share/v0-project/nginx/kuehne.conf`:

1. Uncomment the HTTPS server block (lines ~45-95)
2. Update SSL paths if different
3. Uncomment HTTP redirect (line ~16)

```bash
# Edit the file
nano nginx/kuehne.conf
```

### Reload Nginx Configuration

```bash
docker-compose restart nginx
```

### Verify HTTPS Works

```bash
curl -I https://kuehne.dimeconsultants.africa

# Should return: HTTP/2 200
```

## Step 7: Auto-Renew SSL Certificate

Setup automatic renewal:

```bash
# Create renewal script
cat > /usr/local/bin/renew-ssl.sh << 'SCRIPT'
#!/bin/bash
certbot renew --quiet
docker-compose -f /root/Dime-Consultants-K-N/docker-compose.yml reload
SCRIPT

chmod +x /usr/local/bin/renew-ssl.sh

# Add to crontab (runs daily at 2 AM)
echo "0 2 * * * /usr/local/bin/renew-ssl.sh" | crontab -
```

## Step 8: Monitor and Maintain

### Check Container Status

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f kn-finance-app
docker-compose logs -f nginx

# View health status
docker-compose ps
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build
```

### Restart Services

```bash
# Restart specific service
docker-compose restart kn-finance-app

# Restart all
docker-compose restart

# Stop all
docker-compose down

# Start all
docker-compose up -d
```

## Nginx Configuration Explanation

### File Location
`nginx/kuehne.conf` - Nginx configuration for the subdomain

### Key Components

1. **Upstream Block**: Defines backend server
   ```nginx
   upstream kuehne_app {
       server kn-finance-app:3000;
   }
   ```

2. **HTTP Server Block**: Handles HTTP traffic and redirects to HTTPS

3. **HTTPS Server Block** (after SSL setup):
   - Handles secure HTTPS connections
   - Sets SSL/TLS configuration
   - Adds security headers (HSTS)

4. **Proxy Settings**:
   - `proxy_pass`: Routes to Next.js app
   - `proxy_set_header`: Forwards client information
   - `proxy_cache_valid`: Caches static assets for 30 days

### Static Asset Caching

Next.js static files at `/_next/static/` are cached at Nginx level for 30 days to improve performance.

## Troubleshooting

### 503 Bad Gateway
```bash
# Check if app container is running
docker-compose ps kn-finance-app

# Check app logs
docker-compose logs kn-finance-app

# Restart app
docker-compose restart kn-finance-app
```

### SSL Certificate Issues
```bash
# Check certificate validity
certbot certificates

# Renew manually if needed
certbot renew --force-renewal

# Check certificate date
openssl x509 -in /etc/letsencrypt/live/kuehne.dimeconsultants.africa/fullchain.pem -text -noout | grep -A 2 "Validity"
```

### Nginx Configuration Errors
```bash
# Validate Nginx config
docker exec kn-nginx nginx -t

# Check Nginx logs
docker-compose logs nginx
```

### DNS Not Resolving
```bash
# Check DNS resolution
nslookup kuehne.dimeconsultants.africa
dig kuehne.dimeconsultants.africa

# Should show your server IP
```

## Security Checklist

- [ ] SSL certificate installed and valid
- [ ] HSTS header enabled
- [ ] HTTP redirects to HTTPS
- [ ] Firewall rules configured (ports 80, 443)
- [ ] SSH key-based authentication only
- [ ] Docker containers running as non-root
- [ ] Regular backups of `.env.local` and certificates
- [ ] Automatic SSL renewal configured
- [ ] Nginx logs monitored

## Performance Optimization

### Enable Gzip Compression

Add to Nginx config (in server block):
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

### Increase Proxy Timeouts

For large uploads/processing:
```nginx
proxy_connect_timeout 300s;
proxy_send_timeout 300s;
proxy_read_timeout 300s;
```

## Backup and Recovery

### Backup .env.local
```bash
# Backup environment
cp /root/Dime-Consultants-K-N/.env.local /root/backups/.env.local.$(date +%Y%m%d)

# Keep in secure location
```

### Backup SSL Certificates
```bash
# Certificates auto-renew but backup just in case
tar -czf ~/ssl-backup-$(date +%Y%m%d).tar.gz /etc/letsencrypt/
```

## Support and Further Help

- Check logs: `docker-compose logs -f`
- Nginx documentation: https://nginx.org/
- Docker documentation: https://docs.docker.com/
- Let's Encrypt: https://letsencrypt.org/docs/

---

**Last Updated**: 2026
**Domain**: kuehne.dimeconsultants.africa
**Container Names**: `kn-finance-app`, `kn-nginx`
