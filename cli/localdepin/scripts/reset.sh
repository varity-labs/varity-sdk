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
echo -e "${BLUE}🔄 Resetting LocalDePin Network${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "$LOCALDEPIN_DIR"

# Confirmation prompt
echo -e "${RED}⚠️  WARNING: This will delete all data!${NC}"
echo -e "${YELLOW}This includes:${NC}"
echo -e "  • Blockchain state (Arbitrum)"
echo -e "  • All IPFS pins and data"
echo -e "  • Celestia DA data"
echo -e "  • PostgreSQL database"
echo -e "  • Redis cache"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
  echo -e "${YELLOW}Reset cancelled${NC}"
  exit 0
fi

# Stop and remove containers and volumes
echo -e "${YELLOW}🛑 Stopping services...${NC}"
docker-compose down -v

echo -e "${YELLOW}🗑️  Removing volumes...${NC}"
docker volume ls | grep localdepin | awk '{print $2}' | xargs -r docker volume rm || true

echo -e "${YELLOW}🧹 Cleaning up...${NC}"
sleep 2

# Start fresh network
echo -e "${YELLOW}🚀 Starting fresh network...${NC}"
"$SCRIPT_DIR/start.sh"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ LocalDePin network reset complete${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
