# VarityKit LocalDePin Network

**Local development environment for Varity L3 dashboards**

LocalDePin is VarityKit's equivalent of AlgoKit's "LocalNet" - a one-command local blockchain network for testing Varity dashboards before deploying to testnet/mainnet. Unlike AlgoKit, LocalDepin simulates the entire DePin (Decentralized Physical Infrastructure Network) stack including Arbitrum L3, Filecoin/IPFS, Akash Network, and Celestia DA.

## 🚀 Quick Start

```bash
cd varietykit-cli/localdepin
./scripts/start.sh
```

That's it! The entire DePin network will start in under 2 minutes.

## 📋 What's Included

### Infrastructure Services
- **Arbitrum L3 Node**: Local blockchain (Chain ID: 421614)
- **IPFS/Filecoin**: Distributed storage layer
- **Celestia DA**: Data availability layer
- **PostgreSQL**: Indexer database
- **Redis**: Cache layer

### Mock Services
- **Pinata Mock Server**: Simulates Pinata API for IPFS pinning
- **Akash Simulator**: Simulates Akash Network compute for LLM inference

### Application Services
- **Varity API Server**: REST API for dashboard operations
- **VarityKit Explorer**: Web-based blockchain explorer

## 🌐 Service Endpoints

| Service | URL | Description |
|---------|-----|-------------|
| Arbitrum L3 RPC | http://localhost:8547 | JSON-RPC endpoint |
| Arbitrum L3 WS | ws://localhost:8548 | WebSocket endpoint |
| IPFS API | http://localhost:5001 | IPFS HTTP API |
| IPFS Gateway | http://localhost:8081 | IPFS content gateway |
| Pinata Mock API | http://localhost:3002 | Mock Pinata API |
| Akash Simulator | http://localhost:3003 | Mock Akash compute |
| Celestia RPC | http://localhost:26658 | Celestia node RPC |
| Celestia Gateway | http://localhost:26659 | Celestia gateway |
| Varity API | http://localhost:3001 | Varity REST API |
| Explorer | http://localhost:8080 | Blockchain explorer |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache |

## 🔑 Test Accounts

Pre-funded test accounts are available in `config/test-accounts.json`:

```javascript
// Developer Account 1 (Primary)
Address:     0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Balance:     10,000 ETH

// Admin Account
Address:     0x976EA74026E726554dB657fA54763abd0C3a0aa9
Private Key: 0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e
Balance:     100,000 ETH

// Varity Treasury
Address:     0x14dC79964da2C08b23698B3D3cc7Ca32193d9955
Private Key: 0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356
Balance:     1,000,000 ETH
```

See `config/test-accounts.json` for all 10 pre-funded accounts.

## 📝 Management Commands

### Start Network
```bash
./scripts/start.sh
```
Starts all LocalDePin services. First-time startup may take 2-3 minutes while Docker pulls images.

### Stop Network
```bash
./scripts/stop.sh
```
Stops all services while preserving data volumes.

### Reset Network
```bash
./scripts/reset.sh
```
⚠️ **WARNING**: Deletes ALL data and starts fresh. This includes:
- Blockchain state (all transactions, blocks)
- IPFS pins and data
- PostgreSQL database
- Redis cache

### Check Status
```bash
./scripts/status.sh
```
Shows detailed status of all services including:
- Container status
- Health checks
- Resource usage
- Network info

### View Logs
```bash
# All services
./scripts/logs.sh

# Specific service
./scripts/logs.sh arbitrum-node
./scripts/logs.sh ipfs-node
./scripts/logs.sh pinata-mock
./scripts/logs.sh akash-simulator
```

### Health Check
```bash
./scripts/healthcheck.sh --verbose
```
Verifies all services are healthy and operational.

## 🧪 Testing

### Run All Tests
```bash
./tests/test_end_to_end.sh
```

### Run Individual Test Suites
```bash
./tests/test_arbitrum_node.sh    # Test blockchain
./tests/test_ipfs_node.sh         # Test storage
./tests/test_api_server.sh        # Test mock APIs
```

### Test Results
All tests should pass on a healthy LocalDePin network:
- ✅ Arbitrum L3 Node Tests (8 tests)
- ✅ IPFS Node Tests (8 tests)
- ✅ API Server Tests (11 tests)
- ✅ Full Deployment Workflow Test

## 🏗️ Architecture

LocalDePin simulates the complete Varity DePin stack:

```
┌─────────────────────────────────────────────────────────────┐
│                    VARITY L3 BLOCKCHAIN                     │
│          (Arbitrum Orbit + Arbitrum One + Celestia)         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
        ┌───────▼────────┐     ┌───────▼────────┐
        │  IPFS/Filecoin │     │ Akash Compute  │
        │    Storage     │     │  (LLM Hosting) │
        └───────┬────────┘     └───────┬────────┘
                │                       │
        ┌───────▼────────┐     ┌───────▼────────┐
        │  Pinata Mock   │     │ Akash Simulator│
        │  (Pin Service) │     │  (Mock LLM)    │
        └────────────────┘     └────────────────┘
```

### Storage Layer (3-Layer Architecture)

1. **Layer 1 - Varity Internal**: IPFS + Lit Protocol encryption
2. **Layer 2 - Industry RAG**: IPFS + Celestia DA + Lit Protocol
3. **Layer 3 - Customer Data**: IPFS + Celestia DA + ZK Proofs + Lit Protocol

### Compute Layer

- **Akash Simulator**: Mocks Akash Network for LLM inference
- **LLM Models**: Pre-configured responses for ISO merchant, finance, healthcare, retail

## 🔧 Configuration

### Environment Variables
See `config/network.env` for all environment variables.

### Network Configuration
- **Chain ID**: 421614 (Arbitrum L3 Local)
- **Block Time**: 2 seconds
- **Gas Limit**: 30,000,000
- **Pre-funded Accounts**: 10 accounts with varying balances

### Database Schema
PostgreSQL schema includes:
- `varity.deployments`: Dashboard deployments
- `varity.storage`: 3-layer storage tracking
- `indexer.transactions`: Blockchain transactions
- `indexer.blocks`: Blockchain blocks
- `indexer.contracts`: Smart contracts
- `indexer.events`: Contract events

## 📖 Usage Examples

### Deploy a Test Contract

```bash
# Using cast (foundry)
cast send --rpc-url http://localhost:8547 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --create $(cat TestContract.bin)
```

### Upload to IPFS

```bash
# Upload file
curl -F "file=@myfile.json" http://localhost:5001/api/v0/add

# Upload JSON
curl -X POST http://localhost:3002/pinning/pinJSONToIPFS \
  -H "Content-Type: application/json" \
  -d '{"pinataContent": {"test": "data"}}'
```

### Run LLM Inference

```bash
curl -X POST http://localhost:3003/compute/run-model \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gemini-2.5-flash-mock",
    "prompt": "Explain PCI compliance",
    "industry": "iso-merchant"
  }'
```

### Query Blockchain

```bash
# Get chain ID
curl -X POST http://localhost:8547 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# Get block number
curl -X POST http://localhost:8547 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Get balance
curl -X POST http://localhost:8547 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","latest"],"id":1}'
```

## 🐛 Troubleshooting

### Network Won't Start
1. Check Docker is running: `docker info`
2. Check port conflicts: `lsof -i :8547,5001,3001`
3. Reset network: `./scripts/reset.sh`

### Services Failing Health Checks
1. Check logs: `./scripts/logs.sh <service-name>`
2. Increase timeout: Edit `scripts/healthcheck.sh`
3. Restart specific service: `docker-compose restart <service-name>`

### Out of Disk Space
1. Clean Docker: `docker system prune -a --volumes`
2. Remove old volumes: `docker volume prune`
3. Reset LocalDePin: `./scripts/reset.sh`

### Slow Performance
1. Allocate more resources to Docker
2. Reduce number of running services
3. Check system resources: `./scripts/status.sh`

See `docs/TROUBLESHOOTING.md` for more detailed troubleshooting.

## 🎯 Performance Benchmarks

- **Startup Time**: < 2 minutes (first-time: 3-4 minutes with image pulls)
- **Health Check Time**: < 30 seconds
- **Block Time**: 2 seconds
- **IPFS Upload**: < 1 second for small files
- **LLM Inference**: 100-2000ms (based on prompt length)

## 🔐 Security Notes

⚠️ **LocalDePin is for DEVELOPMENT ONLY**

- Pre-funded accounts use well-known private keys
- No encryption or authentication on mock services
- All data is stored locally without encryption
- Network is completely open (no firewall rules)

**NEVER** use LocalDePin private keys or configurations in production!

## 📚 Additional Documentation

- [Architecture Deep Dive](docs/ARCHITECTURE.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- [API Reference](docs/API_REFERENCE.md)
- [Development Guide](docs/DEVELOPMENT.md)

## 🤝 Integration with VarityKit CLI

LocalDePin integrates seamlessly with VarityKit CLI:

```bash
# Start LocalDePin
varietykit localdepin start

# Check status
varietykit localdepin status

# Stop LocalDePin
varietykit localdepin stop

# Reset network
varietykit localdepin reset

# View logs
varietykit localdepin logs [service]
```

## 📊 Monitoring

### Real-time Monitoring
```bash
# Watch container stats
docker stats

# Monitor logs
./scripts/logs.sh

# Check health continuously
watch -n 5 './scripts/healthcheck.sh --verbose'
```

### Database Queries
```bash
# Connect to PostgreSQL
docker exec -it localdepin-postgres-1 psql -U varity -d varity_indexer

# Sample queries
SELECT * FROM varity.deployments;
SELECT * FROM varity.storage WHERE storage_layer = 'layer2';
SELECT * FROM indexer.transactions ORDER BY timestamp DESC LIMIT 10;
```

## 🌟 What's Next?

After setting up LocalDePin:

1. **Deploy a Template**: `varietykit deploy --network localdepin`
2. **Run Tests**: `varietykit test --network localdepin`
3. **Explore Blockchain**: Open http://localhost:8080
4. **Build Your Dashboard**: Start developing with Varity SDK

## 📝 License

LocalDePin is part of the VarityKit suite. See LICENSE for details.

## 🆘 Support

- **Documentation**: https://docs.varity.ai
- **Issues**: https://github.com/varity/varietykit/issues
- **Discord**: https://discord.gg/varity

---

**Built with ❤️ by the Varity Team**
