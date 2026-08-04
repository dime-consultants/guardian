# Docker Deployment Guide

## Overview

K+N Finance Automation Frontend can be deployed to production using Docker. This guide covers containerization, deployment, and VPS setup.

## Prerequisites

- Docker and Docker Compose installed on your VPS
- At least 2GB RAM available
- Port 3000 accessible (or reverse proxy configured)
- Environment variables set up

## Quick Start - VPS Deployment

### 1. Clone the Repository

```bash
git clone https://github.com/kib4n4/Dime-Consultants-K-N.git
cd Dime-Consultants-K-N
```

### 2. Set Up Environment Variables

Copy the example file and configure for your VPS:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your production values:

```env
# DEPLOYMENT & ALLOWED HOSTS
# List your production domain(s)
NEXT_PUBLIC_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,your-vps-ip

# BACKEND CONNECTION
# Point to your Django backend
NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com

# AUTHENTICATION & SECURITY
# Production: false (memory-only tokens + HTTP-only cookies)
NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS=false

# FEATURE FLAGS
NEXT_PUBLIC_DEFAULT_DEMO_MODE=false

# AI INTEGRATION (optional)
XAI_API_KEY=your_grok_api_key_if_used
```

### 3. Build and Run with Docker Compose

```bash
# Build the Docker image
docker-compose build

# Run in production
docker-compose up -d

# View logs
docker-compose logs -f frontend

# Stop the container
docker-compose down
```

The application will be available at `http://your-vps-ip:3000`

## Manual Docker Commands (Without Compose)

### Build Image

```bash
docker build -t kn-finance-frontend:latest .
```

### Run Container

```bash
docker run -d \
  --name kn-finance-frontend \
  -p 3000:3000 \
  --env-file .env.local \
  --restart unless-stopped \
  kn-finance-frontend:latest
```

### View Logs

```bash
docker logs -f kn-finance-frontend
```

### Stop Container

```bash
docker stop kn-finance-frontend
docker rm kn-finance-frontend
```

## Nginx Reverse Proxy (Recommended)

For production, use Nginx as a reverse proxy with SSL/TLS:

```nginx
upstream frontend {
    server localhost:3000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Proxy settings
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://frontend;
        access_log off;
    }
}
```

## SSL Certificate Setup (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Renewal is automatic with certbot
```

## Monitoring and Maintenance

### Check Container Status

```bash
docker ps
docker inspect kn-finance-frontend
```

### View Resource Usage

```bash
docker stats kn-finance-frontend
```

### Update Environment Variables

1. Edit `.env.local`
2. Rebuild: `docker-compose build`
3. Restart: `docker-compose up -d`

### Automatic Restart

The Docker Compose configuration includes `restart: unless-stopped`, which automatically restarts the container if it crashes.

### Logs and Troubleshooting

```bash
# View recent logs
docker-compose logs --tail=50 frontend

# Stream live logs
docker-compose logs -f frontend

# View specific error
docker-compose logs frontend | grep "error"
```

## File Structure

```
.
├── Dockerfile                 # Production container definition
├── docker-compose.yml         # Docker Compose configuration
├── .dockerignore              # Files to exclude from Docker image
├── .env.example               # Environment variable template
├── .env.local                 # Your local production secrets (in VPS)
├── next.config.mjs            # Next.js configuration
├── package.json               # Dependencies
└── docs/
    └── DOCKER_DEPLOYMENT.md   # This file
```

## Environment Variables Reference

| Variable | Purpose | Dev | Prod |
|----------|---------|-----|------|
| `NEXT_PUBLIC_ALLOWED_HOSTS` | Allowed hostnames | localhost,127.0.0.1 | yourdomain.com,www.yourdomain.com |
| `NEXT_PUBLIC_BACKEND_URL` | Django API endpoint | http://localhost:8000 | https://api.yourdomain.com |
| `NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS` | Token storage | true | false |
| `NEXT_PUBLIC_DEFAULT_DEMO_MODE` | Enable demo mode | true | false |
| `XAI_API_KEY` | Grok API key | (optional) | (optional) |

## Security Checklist

- [ ] `.env.local` is in `.gitignore` (never commit secrets)
- [ ] Docker container runs as non-root user
- [ ] HTTPS/SSL configured on Nginx
- [ ] Security headers set in Nginx config
- [ ] Docker image uses specific Node version (not `latest`)
- [ ] Health checks configured
- [ ] Restart policy set
- [ ] Logs monitored for errors
- [ ] Backend CORS configured to allow frontend domain
- [ ] Backend ALLOWED_HOSTS includes frontend domain

## Performance Optimization

### Multi-stage Build
The Dockerfile uses multi-stage builds to reduce final image size (removes build dependencies).

### Health Checks
Integrated health checks automatically detect and restart unhealthy containers.

### Resource Limits (Optional)
Add to `docker-compose.yml`:

```yaml
services:
  frontend:
    # ... other config ...
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs for errors
docker-compose logs frontend

# Verify environment variables are set
docker-compose config

# Check port 3000 is not in use
lsof -i :3000
```

### Connection to Backend Failed

```bash
# Verify backend URL in .env.local
grep NEXT_PUBLIC_BACKEND_URL .env.local

# Test connectivity from container
docker-compose exec frontend wget -O- http://your-backend-url/api/health/
```

### SSL Certificate Issues

```bash
# Check certificate expiration
sudo certbot certificates

# Renew certificate
sudo certbot renew --force-renewal
```

## Backup and Recovery

### Backup Environment

```bash
# Backup .env.local
cp .env.local .env.local.backup

# Backup specific version
cp .env.local .env.local.$(date +%Y%m%d)
```

### Rollback to Previous Version

```bash
# Stop current container
docker-compose down

# Pull previous version
git checkout <previous-commit-hash>

# Rebuild and restart
docker-compose up -d
```

## Next Steps

1. Configure your domain DNS to point to your VPS IP
2. Set up Nginx reverse proxy with SSL
3. Configure Django backend CORS settings
4. Deploy backend to your VPS or cloud service
5. Monitor logs and set up alerting
6. Schedule regular backups of `.env.local`

For more information, see:
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Production Documentation](https://nextjs.org/docs/deployment)
