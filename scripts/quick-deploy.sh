#!/bin/bash
# Quick deployment script for kuehne.dimeconsultants.africa
# Run this after setting up DNS pointing to your VPS

set -e

echo "========================================="
echo "Guardian Finance Automation - VPS Setup"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo -e "${RED}Error: This script must be run as root${NC}"
   exit 1
fi

echo -e "${YELLOW}Step 1: Update system${NC}"
apt update && apt upgrade -y

echo -e "${YELLOW}Step 2: Install Docker${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
else
    echo "Docker already installed: $(docker --version)"
fi

echo -e "${YELLOW}Step 3: Install Docker Compose${NC}"
if ! command -v docker-compose &> /dev/null; then
    apt install docker-compose -y
else
    echo "Docker Compose already installed: $(docker-compose --version)"
fi

# echo -e "${YELLOW}Step 4: Clone repository${NC}"
# if [ ! -d "Dime-Consultants-K-N" ]; then
#     git clone https://github.com/kib4n4/Dime-Consultants-K-N.git
# else
#     echo "Repository already exists"
#     cd Dime-Consultants-K-N
#     git pull origin main
# fi

# cd Dime-Consultants-K-N

echo -e "${YELLOW}Step 5: Setup environment file${NC}"
if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    echo -e "${GREEN}.env.local created${NC}"
    echo ""
    echo -e "${YELLOW}Please edit .env.local with your configuration:${NC}"
    echo "  - NEXT_PUBLIC_ALLOWED_HOSTS=guardian.dimeconsultants.africa,localhost"
    echo "  - Backend URL is defined in code"
    echo "  - NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS=false"
    echo ""
    read -p "Edit .env.local now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        nano .env.local
    fi
else
    echo ".env.local already exists"
fi

echo -e "${YELLOW}Step 6: Start Docker containers${NC}"
docker-compose up -d

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Containers:"
docker-compose ps
echo ""
echo -e "${YELLOW}Port Configuration:${NC}"
echo "  - Nginx (port 9080): http://YOUR_IP:9080"
echo "  - Next.js app (port 3001): http://YOUR_IP:3001"
echo ""
echo "Next steps:"
echo "1. Verify DNS points to your server IP"
echo "2. Update your external reverse proxy/firewall to:"
echo "   - Forward http://guardian.dimeconsultants.africa to http://localhost:9080"
echo "3. Wait 1-2 minutes for containers to be healthy"
echo "4. Test: curl -I http://localhost:9080"
echo ""
echo "To setup HTTPS:"
echo "1. Configure your reverse proxy to handle SSL/TLS"
echo "2. In nginx/guardian.conf, update the upstream if needed"
echo "3. Restart: docker-compose restart nginx"
echo ""
echo "Check logs:"
echo "  docker-compose logs -f guardian-app"
echo "  docker-compose logs -f nginx"
echo ""
