# LocalDePin Quick Reference

**One-page cheat sheet for LocalDePin network**

## 🚀 Essential Commands

```bash
# Start network
./scripts/start.sh

# Stop network (preserves data)
./scripts/stop.sh

# Reset network (deletes all data)
./scripts/reset.sh

# Check status
./scripts/status.sh

# View logs
./scripts/logs.sh [service-name]

# Run tests
./tests/test_end_to_end.sh
```

## 🌐 Service URLs

| Service | URL |
|---------|-----|
| Arbitrum RPC | http://localhost:8547 |
| Arbitrum WS | ws://localhost:8548 |
| IPFS API | http://localhost:5001 |
| IPFS Gateway | http://localhost:8081 |
| Pinata Mock | http://localhost:3002 |
| Akash Sim | http://localhost:3003 |
| Celestia RPC | http://localhost:26658 |
| Varity API | http://localhost:3001 |
| Explorer | http://localhost:8080 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

## 🔑 Test Accounts

```javascript
// Developer (10,000 ETH)
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

// Admin (100,000 ETH)
0x976EA74026E726554dB657fA54763abd0C3a0aa9
0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e

// Treasury (1,000,000 ETH)
0x14dC79964da2C08b23698B3D3cc7Ca32193d9955
0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356
```

## 🧪 Quick Tests

```bash
# Test blockchain
curl -X POST http://localhost:8547 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# Test IPFS
echo "test" | curl -F "file=@-" http://localhost:5001/api/v0/add

# Test Pinata Mock
curl http://localhost:3002/health

# Test Akash
curl http://localhost:3003/health

# Test LLM
curl -X POST http://localhost:3003/compute/run-model \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "industry": "iso-merchant"}'
```

## 📊 Database Access

```bash
# Connect to PostgreSQL
docker exec -it localdepin-postgres-1 psql -U varity -d varity_indexer

# Common queries
SELECT * FROM varity.deployments;
SELECT * FROM varity.storage WHERE storage_layer = 'layer2';
SELECT * FROM indexer.transactions ORDER BY timestamp DESC LIMIT 10;

# Connect to Redis
docker exec -it localdepin-redis-1 redis-cli

# Redis commands
PING
INFO
KEYS *
```

## 🐛 Quick Troubleshooting

```bash
# Check if Docker is running
docker info

# Check running containers
docker ps

# Check service health
./scripts/healthcheck.sh --verbose

# View service logs
./scripts/logs.sh <service-name>

# Restart service
docker-compose restart <service-name>

# Clean Docker
docker system prune -a
```

## 📦 Docker Commands

```bash
# View all containers
docker-compose ps

# Stop specific service
docker-compose stop <service-name>

# Rebuild service
docker-compose build <service-name>
docker-compose up -d <service-name>

# View resource usage
docker stats

# Clean volumes
docker volume ls
docker volume rm <volume-name>
```

## 🔍 Debugging

```bash
# Access container shell
docker exec -it localdepin-<service>-1 sh

# View container logs
docker logs -f localdepin-<service>-1

# Inspect container
docker inspect localdepin-<service>-1

# View network
docker network inspect localdepin_localdepin
```

## 📁 Important Files

```
localdepin/
├── docker-compose.yml          # Service definitions
├── scripts/
│   ├── start.sh               # Start network
│   ├── stop.sh                # Stop network
│   ├── reset.sh               # Reset network
│   ├── status.sh              # Check status
│   ├── logs.sh                # View logs
│   └── healthcheck.sh         # Health checks
├── config/
│   ├── test-accounts.json     # Pre-funded accounts
│   ├── arbitrum.json          # Blockchain config
│   ├── celestia.json          # Celestia config
│   ├── init.sql               # Database schema
│   └── network.env            # Environment vars
├── tests/
│   ├── test_end_to_end.sh     # Full test suite
│   ├── test_arbitrum_node.sh  # Blockchain tests
│   ├── test_ipfs_node.sh      # Storage tests
│   └── test_api_server.sh     # API tests
└── docs/
    ├── ARCHITECTURE.md        # Deep dive
    └── TROUBLESHOOTING.md     # Problem solving
```

## ⚡ Performance Tips

```bash
# Allocate more resources to Docker
# Docker Desktop → Preferences → Resources

# Pull images beforehand
docker-compose pull

# Use SSD storage for Docker volumes

# Disable unnecessary services
# Comment out in docker-compose.yml

# Increase timeout for slow systems
# Edit MAX_ATTEMPTS in scripts/healthcheck.sh
```

## 🔐 Security Notes

⚠️ **LocalDePin is for DEVELOPMENT ONLY**

- Never use test private keys in production
- All services are open (no authentication)
- Data is not encrypted
- Network is completely accessible from host

## 📖 Full Documentation

- **README.md**: Complete guide
- **ARCHITECTURE.md**: Deep technical dive
- **TROUBLESHOOTING.md**: Common issues
- **API_REFERENCE.md**: API documentation

## 💡 Common Workflows

### Deploy Test Contract
```bash
# Using cast (foundry)
cast send --rpc-url http://localhost:8547 \
  --private-key 0xac0974... \
  --create $(cat contract.bin)
```

### Upload to IPFS + Pin
```bash
# Upload file
CID=$(curl -F "file=@data.json" http://localhost:5001/api/v0/add | jq -r .Hash)

# Pin via Pinata Mock
curl -X POST http://localhost:3002/pinning/pinJSONToIPFS \
  -H "Content-Type: application/json" \
  -d "{\"pinataContent\": $(cat data.json)}"
```

### Create Akash Deployment
```bash
curl -X POST http://localhost:3003/deploy \
  -H "Content-Type: application/json" \
  -d '{"name": "my-app", "image": "nginx:latest"}'
```

### Query Database
```bash
docker exec localdepin-postgres-1 psql -U varity -d varity_indexer \
  -c "SELECT * FROM varity.deployments WHERE status='running';"
```

## 📞 Getting Help

- **Documentation**: Full docs in `docs/` folder
- **Issues**: Check TROUBLESHOOTING.md first
- **GitHub**: Open issue with logs
- **Discord**: Real-time help from community

---

**Keep this file handy for quick reference!**
