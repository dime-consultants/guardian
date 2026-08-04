# Port Configuration Guide

## Current Setup

Due to conflicts with existing services on your VPS, the application uses non-standard ports:

| Service | Internal | Host | Purpose |
|---------|----------|------|---------|
| Next.js App | 3000 | 3000 | Direct access to application |
| Nginx | 80/443 | 6080/6443 | Reverse proxy to app |

## Port Mapping

```
Internet
    ↓
Your Domain: kuehne.dimeconsultants.africa
    ↓
Your Reverse Proxy (external) listening on :80 and :443
    ↓
Forwards to: localhost:6080 (Nginx container)
    ↓
Nginx internally proxies to: kn-finance-app:3000 (Docker network)
```

## Configuration Files

### docker-compose.yml
```yaml
services:
  kn-finance-app:
    ports:
      - "3000:3000"  # Next.js app on port 3000
  
  nginx:
    ports:
      - "6080:80"    # HTTP traffic on port 6080
      - "6443:443"   # HTTPS traffic on port 6443 (when SSL enabled)
```

### nginx/kuehne.conf
```nginx
upstream kuehne_app {
    server kn-finance-app:3000;  # Internal Docker network
}

server {
    listen 80;  # Inside container (mapped to 6080 externally)
    server_name kuehne.dimeconsultants.africa;
    
    location / {
        proxy_pass http://kuehne_app;  # Proxy to app on port 3000
    }
}
```

## How to Access

### Direct Access (for testing)
```bash
# From your VPS
curl http://localhost:6080

# From external (if firewall allows)
curl http://YOUR_IP:6080
```

### Through Your Domain

You need an external reverse proxy (your firewall/load balancer):

```nginx
# External reverse proxy configuration
server {
    listen 80;
    server_name kuehne.dimeconsultants.africa;
    
    location / {
        proxy_pass http://YOUR_VPS_IP:6080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Verification Steps

### 1. Check Containers Are Running
```bash
docker-compose ps

# Should show:
# kn-finance-app     Up     3000/tcp
# kn-nginx           Up     0.0.0.0:6080->80/tcp, 0.0.0.0:6443->443/tcp
```

### 2. Test Nginx on Port 6080
```bash
curl -I http://localhost:6080
# Should return: HTTP/1.1 200 OK
```

### 3. Test Next.js App Directly
```bash
curl -I http://localhost:3000
# Should return: HTTP/1.1 200 OK
```

### 4. Check Internal Docker Network
```bash
docker-compose exec nginx wget http://kn-finance-app:3000 -O -
# Should return HTML content
```

### 5. View Nginx Logs
```bash
docker-compose logs -f nginx
# Watch for proxy errors or connection issues
```

## Troubleshooting

### 502 Bad Gateway
```bash
# Check if Next.js app is running
docker-compose ps kn-finance-app

# Check app logs
docker-compose logs kn-finance-app

# Restart app
docker-compose restart kn-finance-app
```

### Cannot Connect to Port 6080
```bash
# Check if Nginx is running
docker-compose ps nginx

# Check port binding
netstat -tlnp | grep 6080

# Check Nginx config
docker exec kn-nginx nginx -t

# View Nginx logs
docker-compose logs nginx
```

### App Works on :3000 but Not Through Nginx
```bash
# Check if containers can communicate
docker-compose exec nginx ping kn-finance-app

# Check DNS inside containers
docker-compose exec nginx cat /etc/resolv.conf

# Verify upstream is correct in kuehne.conf
docker-compose exec nginx cat /etc/nginx/conf.d/kuehne.conf | grep "server kn"
```

## Production Setup Checklist

- [ ] Verify DNS points to your VPS IP
- [ ] Configure your external reverse proxy to forward port 80/443 to localhost:6080/6443
- [ ] Test access through domain name
- [ ] Set up SSL at the external reverse proxy level (your firewall/load balancer)
- [ ] Verify all containers are healthy
- [ ] Check application logs for errors
- [ ] Set up monitoring and alerts for port availability

## Port Allocation Details

### Why These Ports?

| Port | Reason |
|------|--------|
| 3000 | Standard Next.js port (kept for backward compatibility) |
| 6080 | Nginx HTTP (chosen to avoid conflicts: 80 unavailable, 8080 unavailable) |
| 6443 | Nginx HTTPS (matches port 6080 scheme) |

### Changing Ports

If you need different ports, update:

1. **docker-compose.yml** - Update ports mapping
2. **nginx/kuehne.conf** - Adjust if needed (internal config stays same)
3. **Firewall rules** - Allow new ports
4. **DNS/External proxy** - Forward to new ports

Example for port 8080:
```yaml
nginx:
  ports:
    - "8080:80"
```

## Network Architecture

```
┌─────────────────────────────────────────────────┐
│ Internet                                        │
│ kuehne.dimeconsultants.africa:80/443           │
└──────────────────┬──────────────────────────────┘
                   │
         (external reverse proxy)
                   │
┌──────────────────▼──────────────────────────────┐
│ Your VPS (YOUR_IP)                             │
│                                                 │
│ ┌────────────────────────────────────────────┐ │
│ │ Docker Container: kn-nginx                │ │
│ │ Ports: 6080 -> 80, 6443 -> 443            │ │
│ │ ┌──────────────────────────────────────┐  │ │
│ │ │ Nginx (internal)                    │  │ │
│ │ │ Listens on :80 :443                 │  │ │
│ │ │ Proxies to: kn-finance-app:3000    │  │ │
│ │ └──────────────────────────────────────┘  │ │
│ └────────────────────────────────────────────┘ │
│                    │                           │
│ ┌──────────────────▼──────────────────────────┐ │
│ │ Docker Container: kn-finance-app           │ │
│ │ Ports: 3000 -> 3000                        │ │
│ │ ┌──────────────────────────────────────┐  │ │
│ │ │ Next.js App                         │  │ │
│ │ │ Listens on :3000                    │  │ │
│ │ │ Serves UI                           │  │ │
│ │ └──────────────────────────────────────┘  │ │
│ └────────────────────────────────────────────┘ │
│         (Docker network: kn-network)          │
└─────────────────────────────────────────────────┘
```

---
**Last Updated**: 2026
**Ports**: 6080 (HTTP), 6443 (HTTPS), 3000 (direct access)
