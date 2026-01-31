#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

VERBOSE=${1:-""}
MAX_ATTEMPTS=60
ATTEMPT_INTERVAL=2

check_service() {
  local service_name=$1
  local url=$2
  local attempt=1

  if [ "$VERBOSE" == "--verbose" ]; then
    echo -ne "${YELLOW}⏳ Checking $service_name...${NC}"
  fi

  while [ $attempt -le $MAX_ATTEMPTS ]; do
    if curl -sf "$url" > /dev/null 2>&1; then
      if [ "$VERBOSE" == "--verbose" ]; then
        echo -e "\r${GREEN}✅ $service_name is healthy${NC}                    "
      fi
      return 0
    fi

    if [ "$VERBOSE" == "--verbose" ]; then
      echo -ne "\r${YELLOW}⏳ Checking $service_name... ($attempt/$MAX_ATTEMPTS)${NC}"
    fi

    sleep $ATTEMPT_INTERVAL
    ((attempt++))
  done

  if [ "$VERBOSE" == "--verbose" ]; then
    echo -e "\r${RED}❌ $service_name failed to start (timeout)${NC}                    "
  fi
  return 1
}

check_tcp_port() {
  local service_name=$1
  local host=$2
  local port=$3
  local attempt=1

  if [ "$VERBOSE" == "--verbose" ]; then
    echo -ne "${YELLOW}⏳ Checking $service_name...${NC}"
  fi

  while [ $attempt -le $MAX_ATTEMPTS ]; do
    if nc -z "$host" "$port" 2>/dev/null; then
      if [ "$VERBOSE" == "--verbose" ]; then
        echo -e "\r${GREEN}✅ $service_name is healthy${NC}                    "
      fi
      return 0
    fi

    if [ "$VERBOSE" == "--verbose" ]; then
      echo -ne "\r${YELLOW}⏳ Checking $service_name... ($attempt/$MAX_ATTEMPTS)${NC}"
    fi

    sleep $ATTEMPT_INTERVAL
    ((attempt++))
  done

  if [ "$VERBOSE" == "--verbose" ]; then
    echo -e "\r${RED}❌ $service_name failed to start (timeout)${NC}                    "
  fi
  return 1
}

check_postgres() {
  local service_name="PostgreSQL"
  local attempt=1

  if [ "$VERBOSE" == "--verbose" ]; then
    echo -ne "${YELLOW}⏳ Checking $service_name...${NC}"
  fi

  while [ $attempt -le $MAX_ATTEMPTS ]; do
    if docker exec localdepin-postgres-1 pg_isready -U varity > /dev/null 2>&1; then
      if [ "$VERBOSE" == "--verbose" ]; then
        echo -e "\r${GREEN}✅ $service_name is healthy${NC}                    "
      fi
      return 0
    fi

    if [ "$VERBOSE" == "--verbose" ]; then
      echo -ne "\r${YELLOW}⏳ Checking $service_name... ($attempt/$MAX_ATTEMPTS)${NC}"
    fi

    sleep $ATTEMPT_INTERVAL
    ((attempt++))
  done

  if [ "$VERBOSE" == "--verbose" ]; then
    echo -e "\r${RED}❌ $service_name failed to start (timeout)${NC}                    "
  fi
  return 1
}

check_redis() {
  local service_name="Redis"
  local attempt=1

  if [ "$VERBOSE" == "--verbose" ]; then
    echo -ne "${YELLOW}⏳ Checking $service_name...${NC}"
  fi

  while [ $attempt -le $MAX_ATTEMPTS ]; do
    if docker exec localdepin-redis-1 redis-cli ping > /dev/null 2>&1; then
      if [ "$VERBOSE" == "--verbose" ]; then
        echo -e "\r${GREEN}✅ $service_name is healthy${NC}                    "
      fi
      return 0
    fi

    if [ "$VERBOSE" == "--verbose" ]; then
      echo -ne "\r${YELLOW}⏳ Checking $service_name... ($attempt/$MAX_ATTEMPTS)${NC}"
    fi

    sleep $ATTEMPT_INTERVAL
    ((attempt++))
  done

  if [ "$VERBOSE" == "--verbose" ]; then
    echo -e "\r${RED}❌ $service_name failed to start (timeout)${NC}                    "
  fi
  return 1
}

# Main health check sequence
FAILED=0

# Infrastructure services
check_service "Arbitrum Node" "http://localhost:8547" || ((FAILED++))
check_service "IPFS Node" "http://localhost:5001/api/v0/version" || ((FAILED++))
check_postgres || ((FAILED++))
check_redis || ((FAILED++))

# Mock services
check_service "Pinata Mock" "http://localhost:3002/health" || ((FAILED++))
check_service "Akash Simulator" "http://localhost:3003/health" || ((FAILED++))

# Celestia (optional - may take longer to start)
if check_service "Celestia Node" "http://localhost:26659" 2>/dev/null; then
  :
else
  if [ "$VERBOSE" == "--verbose" ]; then
    echo -e "${YELLOW}⚠️  Celestia Node not ready (this is optional)${NC}"
  fi
fi

# Application services (may not exist yet)
if check_service "Varity API" "http://localhost:3001/health" 2>/dev/null; then
  :
else
  if [ "$VERBOSE" == "--verbose" ]; then
    echo -e "${YELLOW}⚠️  Varity API not ready (optional)${NC}"
  fi
fi

if check_service "Explorer" "http://localhost:8080" 2>/dev/null; then
  :
else
  if [ "$VERBOSE" == "--verbose" ]; then
    echo -e "${YELLOW}⚠️  Explorer not ready (optional)${NC}"
  fi
fi

if [ $FAILED -eq 0 ]; then
  if [ "$VERBOSE" == "--verbose" ]; then
    echo ""
    echo -e "${GREEN}🎉 All core services are healthy!${NC}"
  fi
  exit 0
else
  if [ "$VERBOSE" == "--verbose" ]; then
    echo ""
    echo -e "${RED}❌ $FAILED service(s) failed health check${NC}"
  fi
  exit 1
fi
