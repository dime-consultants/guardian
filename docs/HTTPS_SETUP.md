# HTTPS Setup for kuehne.dimeconsultants.africa

## Overview

The application is now configured to use HTTPS exclusively. HTTP requests are automatically redirected to HTTPS.

## Current Configuration

- **Domain**: kuehne.dimeconsultants.africa
- **Protocol**: HTTPS (TLS 1.2+)
- **HTTP Redirect**: Enabled (all HTTP → HTTPS)
- **Nginx Port**: 6443 (mapped from container port 443)
- **Certificate Path**: `/etc/letsencrypt/live/kuehne.dimeconsultants.africa/`

## Prerequisites

- DNS A record already configured: `kuehne.dimeconsultants.africa` → `102.68.87.186`
- Certbot installed on VPS
- Port 6080 and 6443 accessible

## Step 1: Obtain SSL Certificate

### Install Certbot (if not already installed)

```bash
apt update
apt install certbot -y
```

### Generate Let's Encrypt Certificate

```bash
certbot certonly --standalone \
  -d kuehne.dimeconsultants.africa \
  --email your-email@example.com \
  --agree-tos \
  --non-interactive
```

### Verify Certificate

```bash
ls -la /etc/letsencrypt/live/kuehne.dimeconsultants.africa/

# Should show:
# fullchain.pem
# privkey.pem
```

## Step 2: Restart Nginx Container

```bash
cd /Dime-Consultants-K-N

# Restart Nginx to load new certificates
docker-compose restart nginx

# Wait for health check to pass (10-30 seconds)
sleep 30
docker-compose ps
```

## Step 3: Test HTTPS Access

### Test locally on VPS

```bash
# Test HTTP redirect
curl -I http://kuehne.dimeconsultants.africa:6080
# Should return: HTTP/1.1 301 Moved Permanently
# Location: https://kuehne.dimeconsultants.africa/

# Test HTTPS
curl -I https://kuehne.dimeconsultants.africa:6443
# Should return: HTTP/2 200
```

### Test through domain (with DNS propagation)

```bash
# Test HTTP redirect
curl -I http://kuehne.dimeconsultants.africa
# Should redirect to HTTPS

# Test HTTPS
curl -I https://kuehne.dimeconsultants.africa
# Should return: HTTP/2 200
```

### Test in browser

Open: `https://kuehne.dimeconsultants.africa`

You should see:
- Green lock icon (secure connection)
- No certificate warnings
- Application loads

## Step 4: Auto-Renewal Setup

Let's Encrypt certificates expire after 90 days. Setup automatic renewal:

### Create Renewal Script

```bash
cat > /usr/local/bin/renew-cert.sh << 'SCRIPT'
#!/bin/bash
certbot renew --quiet
docker-compose -f /Dime-Consultants-K-N/docker-compose.yml restart nginx
SCRIPT

chmod +x /usr/local/bin/renew-cert.sh
```

### Add to Crontab

```bash
# Run renewal check daily at 2 AM
echo "0 2 * * * /usr/local/bin/renew-cert.sh" | crontab -

# Verify cron job
crontab -l
```

### Test Renewal (Optional)

```bash
# Dry run (doesn't renew, just checks)
certbot renew --dry-run
```

## Nginx Configuration Details

### HTTP to HTTPS Redirect

```nginx
server {
    listen 80;
    server_name kuehne.dimeconsultants.africa;
    
    # All HTTP traffic redirects to HTTPS
    return 301 https://$server_name$request_uri;
}
```

### HTTPS Server Block

```nginx
server {
    listen 443 ssl http2;
    server_name kuehne.dimeconsultants.africa;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/kuehne.dimeconsultants.africa/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kuehne.dimeconsultants.africa/privkey.pem;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    # Proxy to Next.js application
    location / {
        proxy_pass http://kn-finance-app:3000;
        proxy_set_header X-Forwarded-Proto $scheme;
        # ... other headers
    }
}
```

## Security Features

- **HSTS**: Forces browser to use HTTPS for 1 year
- **TLS 1.2+**: Modern encryption protocols only
- **Security Headers**: 
  - X-Content-Type-Options: Prevents MIME sniffing
  - X-Frame-Options: Prevents clickjacking
  - X-XSS-Protection: XSS attack prevention
- **Certificate Chain**: Full chain validation included

## Troubleshooting

### Certificate Not Found Error

```bash
# Check certificate exists
ls -la /etc/letsencrypt/live/kuehne.dimeconsultants.africa/

# If missing, run certbot again
certbot certonly --standalone -d kuehne.dimeconsultants.africa
```

### Nginx Can't Read Certificate

```bash
# Check file permissions
chmod 644 /etc/letsencrypt/live/kuehne.dimeconsultants.africa/*.pem

# Restart Nginx
docker-compose restart nginx

# Check Nginx logs
docker-compose logs nginx
```

### Certificate Expired Error

```bash
# Force renewal
certbot renew --force-renewal

# Check certificate date
openssl x509 -in /etc/letsencrypt/live/kuehne.dimeconsultants.africa/fullchain.pem \
  -text -noout | grep -A 2 "Validity"

# Restart Nginx
docker-compose restart nginx
```

### Mixed Content Errors

Ensure all resources (images, scripts, styles) use HTTPS or relative URLs:

```javascript
// Good - Uses HTTPS
<img src="https://example.com/image.png" />

// Good - Relative URL
<img src="/images/logo.png" />

// Bad - Uses HTTP (will block on HTTPS page)
<img src="http://example.com/image.png" />
```

## Certificate Details

### Check Certificate Info

```bash
openssl x509 -in /etc/letsencrypt/live/kuehne.dimeconsultants.africa/fullchain.pem -text -noout

# Key info to look for:
# - Subject: CN = kuehne.dimeconsultants.africa
# - Issuer: Let's Encrypt
# - Validity dates
```

### Check Days Until Expiration

```bash
certbot certificates

# Shows all certificates with expiration dates
```

## Port Configuration

| Service | Port | Protocol |
|---------|------|----------|
| HTTP → HTTPS Redirect | 6080 | HTTP (redirects to 6443) |
| Main HTTPS | 6443 | HTTPS/TLS |
| Next.js App | 3000 | Internal (Docker network) |

## Access URLs

- **HTTPS**: `https://kuehne.dimeconsultants.africa`
- **HTTP** (redirects): `http://kuehne.dimeconsultants.africa`
- **Direct IP HTTPS**: `https://102.68.87.186:6443`
- **Direct IP HTTP**: `http://102.68.87.186:6080` (redirects to HTTPS)

## Verification Checklist

- [ ] DNS A record configured (kuehne → 102.68.87.186)
- [ ] SSL certificate obtained from Let's Encrypt
- [ ] Certificate file readable: `/etc/letsencrypt/live/kuehne.dimeconsultants.africa/`
- [ ] Nginx container restarted after certificate setup
- [ ] HTTPS connection works: `https://kuehne.dimeconsultants.africa`
- [ ] HTTP redirects to HTTPS
- [ ] Browser shows green lock icon
- [ ] Automatic renewal cron job configured

---
**Certificate Provider**: Let's Encrypt
**Domain**: kuehne.dimeconsultants.africa
**Server IP**: 102.68.87.186
**Protocol**: HTTPS (TLS 1.2+)
