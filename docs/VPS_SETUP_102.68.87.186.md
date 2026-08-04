# VPS Setup Guide - 102.68.87.186

## Configuration Summary

**Server IP**: 102.68.87.186
**Domain**: kuehne.dimeconsultants.africa
**Subdomain Setup**: A record pointing `kuehne` to 102.68.87.186

## Current Setup Status

```
Next.js App: Port 3000 (internal to Docker)
Nginx: Port 6080 (HTTP) / 6443 (HTTPS) - for Docker
       -> Proxies to Next.js on port 3000

External Access:
kuehne.dimeconsultants.africa -> 102.68.87.186:6080/6443
```

## .env.local Configuration

File: `.env.local` (already created)

```env
NEXT_PUBLIC_ALLOWED_HOSTS=kuehne.dimeconsultants.africa,102.68.87.186,localhost
NEXT_PUBLIC_BACKEND_URL=https://api.dimeconsultants.africa
NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS=false
NEXT_PUBLIC_DEFAULT_DEMO_MODE=false
```

## Steps to Complete Setup

### 1. DNS Configuration

Add DNS A record at your domain registrar:
```
Type: A
Name: kuehne
Value: 102.68.87.186
TTL: 3600
```

Wait 5-15 minutes for DNS propagation.

### 2. Verify DNS Resolution

```bash
nslookup kuehne.dimeconsultants.africa
dig kuehne.dimeconsultants.africa

# Should return: 102.68.87.186
```

### 3. Restart Containers with New Configuration

```bash
cd /Dime-Consultants-K-N

# Pull latest changes
git pull origin main

# Stop containers
docker-compose down

# Start fresh
docker-compose up -d

# Check status
docker-compose ps
```

### 4. Verify Services

```bash
# Check if Nginx is listening on port 6080
netstat -tlnp | grep 6080

# Test locally
curl -I http://localhost:6080

# Test through domain
curl -I http://kuehne.dimeconsultants.africa:6080
```

### 5. Setup SSL/TLS (HTTPS)

Once HTTP is working, setup Let's Encrypt:

```bash
# Install certbot
apt install certbot -y

# Generate certificate
certbot certonly --standalone \
  -d kuehne.dimeconsultants.africa \
  --email your-email@example.com \
  --agree-tos \
  --non-interactive

# Verify certificate
ls -la /etc/letsencrypt/live/kuehne.dimeconsultants.africa/
```

### 6. Enable HTTPS in Nginx Configuration

Edit `nginx/kuehne.conf` and uncomment the HTTPS server block (lines 47-95).

```bash
# After enabling HTTPS in config:
docker-compose restart nginx

# Test HTTPS
curl -I https://kuehne.dimeconsultants.africa:6443
```

### 7. Configure Firewall

Ensure your firewall allows:
```
Port 6080 (HTTP)
Port 6443 (HTTPS)
Port 3000 (optional, for direct access)
```

## Troubleshooting

### Containers Not Starting

```bash
# Check logs
docker-compose logs

# Verify .env.local exists
ls -la .env.local

# Check file permissions
cat .env.local
```

### Port 6080 Not Accessible

```bash
# Check Nginx container
docker ps | grep nginx

# Check port binding
docker-compose port nginx 80

# Restart Nginx
docker-compose restart nginx

# Wait 10 seconds for health check
sleep 10
docker-compose ps
```

### DNS Not Resolving

```bash
# Check DNS propagation
nslookup kuehne.dimeconsultants.africa

# If not working, verify A record at registrar
# May take up to 24 hours to propagate fully
```

### Application Not Loading

```bash
# Check Next.js app logs
docker-compose logs kn-finance-app

# Check if app is healthy
docker-compose ps

# Watch logs in real-time
docker-compose logs -f
```

## Port Mapping Reference

| Service | Container Port | Host Port | Access |
|---------|---|---|---|
| Next.js App | 3000 | 3000 | http://102.68.87.186:3000 |
| Nginx HTTP | 80 | 6080 | http://102.68.87.186:6080 |
| Nginx HTTPS | 443 | 6443 | https://102.68.87.186:6443 |
| Domain HTTP | - | - | http://kuehne.dimeconsultants.africa |
| Domain HTTPS | - | - | https://kuehne.dimeconsultants.africa |

## Command Reference

```bash
# Start all containers
docker-compose up -d

# Stop all containers
docker-compose down

# View container status
docker-compose ps

# View logs (all)
docker-compose logs

# View logs (follow, Nginx only)
docker-compose logs -f nginx

# Rebuild and restart
docker-compose up -d --build

# Restart specific service
docker-compose restart nginx

# Execute command in container
docker-compose exec nginx sh

# View specific environment variables
docker-compose config | grep NEXT_PUBLIC
```

## Environment Variables

All variables are loaded from `.env.local`:

- `NEXT_PUBLIC_ALLOWED_HOSTS`: Domains allowed to access the app
- `NEXT_PUBLIC_BACKEND_URL`: Django API backend URL
- `NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS`: Security setting (false for production)
- `NEXT_PUBLIC_DEFAULT_DEMO_MODE`: Demo mode (false for production)
- `XAI_API_KEY`: Optional Grok AI integration

## File Structure

```
/Dime-Consultants-K-N/
├── docker-compose.yml      # Docker container orchestration
├── Dockerfile              # Next.js app image
├── .env.local             # Configuration (created)
├── nginx/
│   └── kuehne.conf        # Nginx reverse proxy config
└── docs/
    └── VPS_SETUP_102.68.87.186.md  # This file
```

## Support

If issues persist:

1. Check all logs: `docker-compose logs`
2. Verify DNS: `nslookup kuehne.dimeconsultants.africa`
3. Test ports: `telnet 102.68.87.186 6080`
4. Review configuration: `cat .env.local`
5. Check Docker status: `docker ps -a`

---
**Server IP**: 102.68.87.186
**Domain**: kuehne.dimeconsultants.africa
**Setup Date**: 2026
