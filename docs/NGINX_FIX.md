# Nginx Configuration Fix for kuehne.dimeconsultants.africa

## Problem

The external Nginx on your VPS is NOT proxying to the Docker container. It's trying to serve files from `/var/www/html`, showing the default Nginx page instead of your Next.js app.

## Solution: Update Host Nginx Configuration

You need to edit the **host-level** Nginx configuration (not the Docker Nginx).

### Step 1: Edit the Nginx Configuration

SSH into your VPS and edit:

```bash
sudo nano /etc/nginx/sites-enabled/default
```

### Step 2: Find the HTTPS Server Block

Look for this section:

```nginx
server {
    root /var/www/html;

    index index.html index.htm index.nginx-debian.html;
    server_name kuehne.dimeconsultants.africa;

    location / {
        try_files $uri $uri/ =404;
    }

    listen [::]:443 ssl ipv6only=on;
    listen 443 ssl;
    # ... SSL configuration below
}
```

### Step 3: Replace the Entire HTTPS Server Block

Delete the entire server block above and replace with:

```nginx
server {
    server_name kuehne.dimeconsultants.africa;

    location / {
        proxy_pass http://127.0.0.1:6080;

        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    listen [::]:443 ssl ipv6only=on;
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/kuehne.dimeconsultants.africa/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kuehne.dimeconsultants.africa/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}
```

**Key changes:**
- Removed `root /var/www/html;`
- Changed `try_files $uri $uri/ =404;` to `proxy_pass http://127.0.0.1:6080;`
- Added proxy headers for forwarding client info and WebSocket support
- Kept all SSL configuration as-is

### Step 4: Also Update HTTP Server Block

Find the HTTP server block (port 80):

```nginx
server {
    if ($host = kuehne.dimeconsultants.africa) {
        return 301 https://$host$request_uri;
    }
    
    listen 80;
    listen [::]:80;
    server_name kuehne.dimeconsultants.africa;
    return 404;
}
```

Keep it as-is (it already redirects HTTP to HTTPS).

### Step 5: Validate and Reload Nginx

```bash
# Test configuration syntax
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

Expected output:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration will be successful
```

### Step 6: Test the Connection

```bash
# Test HTTPS connection
curl -IkL https://kuehne.dimeconsultants.africa

# You should see headers like:
# x-powered-by: Next.js
# Or a 200 response with Next.js content

# NOT the old default Nginx page with:
# content-length: 615
```

## What This Does

```
Your Browser
    ↓
kuehne.dimeconsultants.africa:443 (HTTPS)
    ↓
Host Nginx (port 443)
    ↓
Proxies to: 127.0.0.1:6080 (Docker Nginx)
    ↓
Docker Nginx → Docker Next.js App (port 3000)
```

## Troubleshooting

### Still Seeing Nginx Default Page?

1. Check Nginx syntax is valid:
   ```bash
   sudo nginx -t
   ```

2. Check Nginx is running:
   ```bash
   sudo systemctl status nginx
   ```

3. Check Docker container is running:
   ```bash
   docker-compose ps
   ```

4. Verify port 6080 is exposed:
   ```bash
   netstat -tlnp | grep 6080
   # Should show: 0.0.0.0:6080
   ```

5. Test Docker directly:
   ```bash
   curl -I http://localhost:6080
   # Should return 200 from Next.js
   ```

### "Connection Refused" Error?

Make sure Docker containers are running:

```bash
cd /Dime-Consultants-K-N
docker-compose ps

# If not running:
docker-compose up -d
```

### Still Issues?

Check host Nginx logs:

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

Check Docker Nginx logs:

```bash
docker-compose logs nginx
```

## Files Updated in Project

1. **app/health/route.ts** - New health endpoint for Docker health checks
2. **docs/NGINX_FIX.md** - This guide

The health endpoint fixes the Docker health check warning but doesn't affect functionality.

---
**Host Nginx Configuration**: `/etc/nginx/sites-enabled/default`
**Docker Nginx Configuration**: `nginx/kuehne.conf` (inside container)
**Next.js App**: Port 3000 (inside container)
**Docker Nginx Proxy**: Port 6080/6443 (host level)
