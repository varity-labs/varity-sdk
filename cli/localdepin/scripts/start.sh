#!/bin/bash
set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCALDEPIN_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 Starting VarityKit LocalDePin Network${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check Docker is running
echo -e "${YELLOW}⚙️  Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Change to LocalDePin directory
cd "$LOCALDEPIN_DIR"

# Check if network is already running
if docker-compose ps | grep -q "Up"; then
  echo -e "${YELLOW}⚠️  LocalDePin network is already running${NC}"
  echo -e "${YELLOW}   Run './scripts/stop.sh' to stop it first${NC}"
  exit 0
fi

# Pull latest images
echo -e "${YELLOW}📥 Pulling Docker images...${NC}"
docker-compose pull 2>&1 | grep -v "Pulling from" || true
echo -e "${GREEN}✅ Images updated${NC}"
echo ""

# Start services
echo -e "${YELLOW}🏗️  Starting services...${NC}"
START_TIME=$(date +%s)

# Start infrastructure services first (postgres, redis, ipfs, arbitrum, celestia)
echo -e "${BLUE}   Starting infrastructure layer...${NC}"
docker-compose up -d postgres redis ipfs-node arbitrum-node celestia-node

# Wait for infrastructure to be ready
echo -e "${YELLOW}   Waiting for infrastructure services...${NC}"
sleep 5

# Start mock services
echo -e "${BLUE}   Starting mock services...${NC}"
docker-compose up -d pinata-mock akash-simulator

# Wait for mock services
sleep 3

# Start application services
echo -e "${BLUE}   Starting application services...${NC}"
docker-compose up -d varity-api-local varietykit-explorer

echo -e "${GREEN}✅ All services started${NC}"
echo ""

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
"$SCRIPT_DIR/healthcheck.sh"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ LocalDePin network is ready! (${DURATION}s)${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📡 Services available at:${NC}"
echo -e "  ${GREEN}•${NC} Arbitrum L3 RPC:      ${YELLOW}http://localhost:8547${NC}"
echo -e "  ${GREEN}•${NC} Arbitrum L3 WS:       ${YELLOW}ws://localhost:8548${NC}"
echo -e "  ${GREEN}•${NC} IPFS API:             ${YELLOW}http://localhost:5001${NC}"
echo -e "  ${GREEN}•${NC} IPFS Gateway:         ${YELLOW}http://localhost:8081${NC}"
echo -e "  ${GREEN}•${NC} Pinata Mock API:      ${YELLOW}http://localhost:3002${NC}"
echo -e "  ${GREEN}•${NC} Akash Simulator:      ${YELLOW}http://localhost:3003${NC}"
echo -e "  ${GREEN}•${NC} Celestia RPC:         ${YELLOW}http://localhost:26658${NC}"
echo -e "  ${GREEN}•${NC} Celestia Gateway:     ${YELLOW}http://localhost:26659${NC}"
echo -e "  ${GREEN}•${NC} Varity API Server:    ${YELLOW}http://localhost:3001${NC}"
echo -e "  ${GREEN}•${NC} VarityKit Explorer:   ${YELLOW}http://localhost:8080${NC}"
echo -e "  ${GREEN}•${NC} PostgreSQL:           ${YELLOW}localhost:5432${NC}"
echo -e "  ${GREEN}•${NC} Redis:                ${YELLOW}localhost:6379${NC}"
echo ""
echo -e "${BLUE}📚 Quick Commands:${NC}"
echo -e "  ${GREEN}•${NC} View logs:            ${YELLOW}./scripts/logs.sh${NC}"
echo -e "  ${GREEN}•${NC} Check status:         ${YELLOW}./scripts/status.sh${NC}"
echo -e "  ${GREEN}•${NC} Stop network:         ${YELLOW}./scripts/stop.sh${NC}"
echo -e "  ${GREEN}•${NC} Reset network:        ${YELLOW}./scripts/reset.sh${NC}"
echo ""
echo -e "${BLUE}🚀 Next steps:${NC}"
echo -e "  1. Run: ${YELLOW}varietykit dev${NC}"
echo -e "  2. Open: ${YELLOW}http://localhost:3000${NC}"
echo -e "  3. View explorer: ${YELLOW}http://localhost:8080${NC}"
echo ""
