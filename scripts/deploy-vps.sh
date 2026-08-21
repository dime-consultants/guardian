#!/bin/bash

# K+N Finance Automation - VPS Deployment Script
# This script sets up the frontend on a VPS with Docker

set -e

echo "================================"
echo "K+N Finance Frontend - VPS Setup"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root (not required but helpful for permissions)
if [[ $EUID -ne 0 ]]; then
   echo -e "${YELLOW}Note: This script can be run as regular user or with sudo${NC}"
fi

# Check Docker installation
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"
echo ""

# Get deployment directory
read -p "Enter deployment directory (default: /opt/kn-finance): " DEPLOY_DIR
DEPLOY_DIR=${DEPLOY_DIR:-/opt/kn-finance}

if [ -d "$DEPLOY_DIR" ]; then
    echo -e "${YELLOW}Directory already exists. Pulling latest changes...${NC}"
    cd "$DEPLOY_DIR"
    git pull origin main
else
    echo -e "${YELLOW}Creating deployment directory...${NC}"
    mkdir -p "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"
    
    # Clone repository
    read -p "Enter repository URL: " REPO_URL
    git clone "$REPO_URL" .
fi

echo -e "${GREEN}✓ Repository ready${NC}"
echo ""

# Setup environment variables
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}Creating .env.local from template...${NC}"
    cp .env.example .env.local
    
    echo -e "${YELLOW}Please edit .env.local with your production values:${NC}"
    echo "  - NEXT_PUBLIC_ALLOWED_HOSTS"
    echo "  - Backend URL is defined in code"
    echo "  - NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS (should be false)"
    echo "  - XAI_API_KEY (optional)"
    echo ""
    
    read -p "Press Enter when you've edited .env.local..."
else
    echo -e "${YELLOW}Existing .env.local found${NC}"
    read -p "Do you want to update it? (y/n): " UPDATE_ENV
    if [[ $UPDATE_ENV == "y" ]]; then
        cp .env.example .env.local.new
        echo "New template created as .env.local.new for reference"
    fi
fi

echo ""

# Build and start containers
echo -e "${YELLOW}Building Docker image...${NC}"
docker-compose build

echo ""
echo -e "${YELLOW}Starting container...${NC}"
docker-compose up -d

# Wait for container to be ready
echo -e "${YELLOW}Waiting for container to be healthy...${NC}"
sleep 10

# Check if container is running
if docker-compose ps | grep -q "healthy\|Up"; then
    echo -e "${GREEN}✓ Container is running${NC}"
    
    # Get container IP
    CONTAINER_IP=$(docker-compose exec -T frontend hostname -I | awk '{print $1}')
    echo -e "${GREEN}Frontend is running at: http://localhost:3001${NC}"
else
    echo -e "${RED}✗ Container failed to start. Checking logs...${NC}"
    docker-compose logs frontend
    exit 1
fi

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Next steps:"
echo "1. Configure your domain DNS to point to your VPS IP"
echo "2. Set up Nginx reverse proxy with SSL (see docs/DOCKER_DEPLOYMENT.md)"
echo "3. Configure Django backend CORS settings"
echo "4. Monitor logs: docker-compose logs -f frontend"
echo ""
echo "View deployment logs:"
echo "  docker-compose logs -f"
echo ""
echo "Stop containers:"
echo "  docker-compose down"
echo ""
echo "Update deployment:"
echo "  git pull origin main"
echo "  docker-compose build"
echo "  docker-compose up -d"
echo ""
