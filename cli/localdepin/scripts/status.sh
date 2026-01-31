#!/bin/bash
set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCALDEPIN_DIR="$(dirname "$SCRIPT_DIR")"

cd "$LOCALDEPIN_DIR"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 LocalDePin Network Status${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}❌ Docker is not running${NC}"
  exit 1
fi

# Container status
echo -e "${CYAN}📦 Container Status:${NC}"
echo ""
docker-compose ps
echo ""

# Health checks
echo -e "${CYAN}🏥 Health Checks:${NC}"
echo ""
"$SCRIPT_DIR/healthcheck.sh" --verbose
echo ""

# Resource usage
echo -e "${CYAN}💻 Resource Usage:${NC}"
echo ""
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" $(docker-compose ps -q) 2>/dev/null || echo "No containers running"
echo ""

# Volume usage
echo -e "${CYAN}💾 Volume Usage:${NC}"
echo ""
docker volume ls --filter "name=localdepin" --format "table {{.Name}}\t{{.Driver}}\t{{.Size}}" 2>/dev/null || \
  docker volume ls --filter "name=localdepin" --format "table {{.Name}}\t{{.Driver}}"
echo ""

# Network info
echo -e "${CYAN}🌐 Network Info:${NC}"
echo ""
docker network inspect localdepin_localdepin 2>/dev/null | grep -A 20 "Containers" || echo "Network not found"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Status check complete${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
