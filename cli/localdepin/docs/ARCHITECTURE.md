# LocalDePin Architecture

This document provides a deep dive into the LocalDePin network architecture, explaining how all components work together to simulate Varity's complete DePin (Decentralized Physical Infrastructure Network) stack.

## System Overview

LocalDePin is a comprehensive local development environment that replicates the entire Varity production infrastructure on your local machine. It enables developers to build, test, and debug Varity L3 dashboards without deploying to testnet or mainnet.

## Architecture Layers

### 1. Blockchain Layer

**Arbitrum L3 Local Node**

The blockchain layer is built on Arbitrum Nitro, running in development mode for fast local testing.

```
┌─────────────────────────────────────────┐
│      Arbitrum L3 Development Node       │
│                                         │
│  Chain ID: 421614                       │
│  Block Time: 2 seconds                  │
│  Consensus: Dev Mode (no mining)        │
│  Gas Limit: 30,000,000                  │
│                                         │
│  Endpoints:                             │
│  • HTTP RPC:  :8547                     │
│  • WebSocket: :8548                     │
└─────────────────────────────────────────┘
```

**Key Features**:
- Instant block production (no mining required)
- Pre-funded test accounts
- Full EVM compatibility
- Support for EIP-1559 and EIP-155

**Configuration**: `config/arbitrum.json`

### 2. Storage Layer

LocalDePin implements Varity's 3-layer encrypted storage architecture:

```
┌─────────────────────────────────────────────────────┐
│              3-LAYER STORAGE ARCHITECTURE           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Layer 1: Varity Internal Storage                  │
│  ├─ IPFS/Filecoin (local node)                     │
│  ├─ Pinata Mock (pinning service)                  │
│  └─ Access: Varity admins only                     │
│                                                     │
│  Layer 2: Industry RAG Storage                     │
│  ├─ IPFS/Filecoin (local node)                     │
│  ├─ Celestia DA (data availability)                │
│  ├─ Pinata Mock (shared pinning)                   │
│  └─ Access: All customers in industry              │
│                                                     │
│  Layer 3: Customer-Specific Storage                │
│  ├─ IPFS/Filecoin (local node)                     │
│  ├─ Celestia DA + ZK proofs                        │
│  ├─ Pinata Mock (private pinning)                  │
│  └─ Access: Single customer only                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**IPFS Node**:
- **Image**: ipfs/kubo:v0.25.0
- **API Port**: 5001
- **Gateway Port**: 8081
- **Storage**: Persistent volume (ipfs-data)
- **Profile**: Server mode (optimized for local development)

**Pinata Mock Server**:
- **Purpose**: Simulates Pinata API for IPFS pinning
- **Port**: 3002
- **Features**:
  - Pin file to IPFS
  - Pin JSON to IPFS
  - Unpin from IPFS
  - List pinned items
  - Authentication (mock)

**Celestia DA Node**:
- **Image**: ghcr.io/celestiaorg/celestia-node:v0.12.4
- **Type**: Light node (private network)
- **RPC Port**: 26658
- **Gateway Port**: 26659
- **Features**:
  - Blob submission
  - Proxy Data Availability (PDA)
  - ZK proof generation (simulated)

### 3. Compute Layer

**Akash Simulator**

Simulates Akash Network's decentralized compute infrastructure for hosting LLMs and dashboards.

```
┌─────────────────────────────────────────┐
│         Akash Compute Simulator         │
│                                         │
│  Port: 3003                             │
│  Model: gemini-2.5-flash-mock           │
│  Compute Units: 1000                    │
│                                         │
│  Features:                              │
│  • Deploy applications                  │
│  • LLM inference (mock)                 │
│  • Deployment management                │
│  • Resource allocation                  │
└─────────────────────────────────────────┘
```

**Mock LLM Models**:
1. **ISO Merchant Model**: PCI compliance, onboarding, merchant services
2. **Finance Model**: Regulations, risk management, financial analysis
3. **Healthcare Model**: HIPAA compliance, medical procedures
4. **Retail Model**: Inventory management, supply chain, e-commerce

**Deployment Simulation**:
- Simulates 2-second deployment delay
- Provides mock deployment URLs
- Tracks deployment status (pending → running → stopped)

### 4. Database Layer

**PostgreSQL Indexer**

Indexes blockchain data and tracks Varity-specific operations.

```
┌─────────────────────────────────────────┐
│          PostgreSQL Indexer             │
│                                         │
│  Port: 5432                             │
│  Database: varity_indexer               │
│  User: varity                           │
│                                         │
│  Schemas:                               │
│  • varity: Deployments, storage         │
│  • indexer: Blocks, txs, contracts      │
└─────────────────────────────────────────┘
```

**Tables**:

1. **varity.deployments**: Dashboard deployments
   - deployment_id, company_id, industry, status
   - contract_address, ipfs_cid, celestia_blob_id

2. **varity.storage**: 3-layer storage tracking
   - storage_layer (layer1/layer2/layer3)
   - ipfs_cid, celestia_blob_id
   - encryption metadata, access conditions

3. **indexer.transactions**: Blockchain transactions
   - tx_hash, block_number, from/to addresses
   - gas_used, status

4. **indexer.blocks**: Blockchain blocks
   - block_number, block_hash, timestamp
   - gas_used, tx_count

5. **indexer.contracts**: Smart contracts
   - address, creator, bytecode, abi
   - verified status

6. **indexer.events**: Contract events
   - contract_address, event_name, data
   - tx_hash, block_number

**Redis Cache**

High-performance cache for frequently accessed data.

```
┌─────────────────────────────────────────┐
│              Redis Cache                │
│                                         │
│  Port: 6379                             │
│  Persistence: AOF + RDB                 │
│  Save Policy: Every 60 seconds          │
└─────────────────────────────────────────┘
```

### 5. Application Layer

**Varity API Server**

RESTful API for dashboard operations.

```
┌─────────────────────────────────────────┐
│          Varity API Server              │
│                                         │
│  Port: 3001                             │
│  Framework: Node.js + Express           │
│                                         │
│  Endpoints:                             │
│  • /health                              │
│  • /api/v1/deployments                  │
│  • /api/v1/storage                      │
│  • /api/v1/blockchain                   │
└─────────────────────────────────────────┘
```

**VarityKit Explorer**

Web-based blockchain explorer and dashboard viewer.

```
┌─────────────────────────────────────────┐
│         VarityKit Explorer              │
│                                         │
│  Port: 8080                             │
│  Framework: React + Vite                │
│                                         │
│  Features:                              │
│  • Block explorer                       │
│  • Transaction viewer                   │
│  • Contract inspector                   │
│  • Dashboard manager                    │
└─────────────────────────────────────────┘
```

## Network Architecture

### Docker Network

All services run in a custom bridge network:

```
┌───────────────────────────────────────────────────┐
│          localdepin_localdepin (bridge)           │
│                                                   │
│  Subnet: 172.20.0.0/16                            │
│  Gateway: 172.20.0.1                              │
│                                                   │
│  Services:                                        │
│  ├─ arbitrum-node      (172.20.0.2)              │
│  ├─ ipfs-node          (172.20.0.3)              │
│  ├─ celestia-node      (172.20.0.4)              │
│  ├─ postgres           (172.20.0.5)              │
│  ├─ redis              (172.20.0.6)              │
│  ├─ pinata-mock        (172.20.0.7)              │
│  ├─ akash-simulator    (172.20.0.8)              │
│  ├─ varity-api-local   (172.20.0.9)              │
│  └─ varietykit-explorer (172.20.0.10)            │
└───────────────────────────────────────────────────┘
```

### Service Dependencies

```
┌─────────────────────────────────────────────────┐
│           Service Dependency Graph              │
└─────────────────────────────────────────────────┘

                    varietykit-explorer
                            │
                            ▼
                    varity-api-local
                    ┌───────┴───────┐
                    │               │
            ┌───────▼──┐    ┌──────▼─────┐
            │ postgres │    │   redis    │
            └──────────┘    └────────────┘
                    │               │
        ┌───────────┼───────────────┼──────────┐
        │           │               │          │
        ▼           ▼               ▼          ▼
  arbitrum-node  ipfs-node   pinata-mock  akash-sim
        │           │               │
        │           ▼               │
        │     celestia-node         │
        └───────────────────────────┘
```

## Data Flow

### Deployment Workflow

```
1. Developer submits deployment request
   └─► Varity API Server

2. API validates request
   └─► Checks template configuration
   └─► Verifies resources

3. Upload deployment config to IPFS
   └─► IPFS Node stores config
   └─► Pinata Mock pins config
   └─► Returns IPFS CID

4. Submit blob to Celestia (Layer 2/3 only)
   └─► Celestia Node stores blob
   └─► Returns blob ID + height

5. Deploy to Akash Simulator
   └─► Akash creates deployment
   └─► Returns deployment ID + URL

6. Deploy smart contract to Arbitrum
   └─► Arbitrum Node executes transaction
   └─► Returns contract address

7. Record deployment in database
   └─► PostgreSQL stores deployment record
   └─► Redis caches deployment info

8. Return deployment details to developer
   └─► Deployment ID, URLs, addresses
```

### LLM Inference Workflow

```
1. User submits query
   └─► Dashboard UI

2. Query sent to Varity API
   └─► /api/v1/chat endpoint

3. API retrieves context
   ├─► Layer 2 (Industry RAG) from IPFS
   └─► Layer 3 (Customer Data) from IPFS

4. API sends to Akash Simulator
   └─► LLM model processes request
   └─► Generates response

5. Response cached in Redis
   └─► For faster future retrieval

6. Response returned to user
   └─► Through API to Dashboard UI
```

### Storage Workflow (3-Layer)

```
Layer 1 (Varity Internal):
┌────────────────────────────────────┐
│ Upload → IPFS → Pin (Pinata Mock)  │
│ No Celestia DA                     │
│ Access: Varity admins only         │
└────────────────────────────────────┘

Layer 2 (Industry RAG):
┌────────────────────────────────────┐
│ Upload → IPFS → Pin (Pinata Mock)  │
│ Submit → Celestia DA (blob)        │
│ Record → PostgreSQL (metadata)     │
│ Access: Industry customers         │
└────────────────────────────────────┘

Layer 3 (Customer Data):
┌────────────────────────────────────┐
│ Upload → IPFS → Pin (Pinata Mock)  │
│ Submit → Celestia DA (blob + ZK)   │
│ Record → PostgreSQL (metadata)     │
│ Access: Single customer only       │
└────────────────────────────────────┘
```

## Volume Management

### Persistent Volumes

```
┌────────────────────────────────────────────┐
│          Persistent Data Volumes           │
├────────────────────────────────────────────┤
│                                            │
│  arbitrum-data:                            │
│  └─ Blockchain state, blocks, transactions│
│     Size: ~500MB after 1 week              │
│                                            │
│  ipfs-data:                                │
│  └─ IPFS blocks, pinned files              │
│     Size: ~1GB after 1 week                │
│                                            │
│  celestia-data:                            │
│  └─ DA blobs, headers                      │
│     Size: ~200MB after 1 week              │
│                                            │
│  postgres-data:                            │
│  └─ Database files                         │
│     Size: ~100MB after 1 week              │
│                                            │
│  redis-data:                               │
│  └─ RDB snapshots, AOF logs                │
│     Size: ~50MB after 1 week               │
│                                            │
└────────────────────────────────────────────┘
```

## Security Model

### Development-Only Security

⚠️ **LocalDePin is for DEVELOPMENT ONLY**

1. **No Authentication**: All services are open
2. **Known Private Keys**: Well-known test accounts
3. **No Encryption**: Data stored unencrypted (mock Lit Protocol)
4. **No Network Isolation**: All services accessible from host
5. **No Rate Limiting**: Unlimited requests

### Production Differences

| Feature | LocalDePin | Production |
|---------|-----------|------------|
| Private Keys | Well-known | HSM-secured |
| Encryption | None | Lit Protocol |
| Authentication | None | OAuth 2.0 + JWT |
| Network | Open | VPC + Firewall |
| Rate Limiting | None | Enabled |
| Monitoring | Basic | Full APM |
| Backup | None | Automated |

## Performance Characteristics

### Startup Performance

```
Infrastructure Layer:    20-30 seconds
├─ postgres:            5-8 seconds
├─ redis:               2-3 seconds
├─ ipfs-node:           8-12 seconds
└─ arbitrum-node:       15-20 seconds

Mock Services:           5-10 seconds
├─ pinata-mock:         3-5 seconds
└─ akash-simulator:     3-5 seconds

Application Layer:       10-15 seconds
├─ varity-api-local:    8-12 seconds
└─ varietykit-explorer: 5-8 seconds

Total Startup Time:     35-55 seconds
First-Time (with pulls): 180-240 seconds
```

### Runtime Performance

```
Block Production:        2 seconds/block
Transaction Finality:    2 seconds (instant in dev mode)
IPFS Upload (1MB):       200-500ms
IPFS Download (1MB):     100-300ms
LLM Inference:           100-2000ms (based on prompt)
Database Query:          1-10ms
Cache Hit:               <1ms
```

### Resource Usage

```
Typical Resource Consumption:
├─ CPU:    20-30% (idle), 50-80% (active)
├─ Memory: 4-6 GB total
│   ├─ arbitrum-node:      1-2 GB
│   ├─ ipfs-node:          500-800 MB
│   ├─ postgres:           200-400 MB
│   ├─ celestia-node:      400-600 MB
│   └─ other services:     200-300 MB each
└─ Disk:   2-3 GB (grows ~500MB/week)
```

## Monitoring and Observability

### Health Checks

Each service implements health check endpoints:

```
arbitrum-node:       curl http://localhost:8547
ipfs-node:          curl http://localhost:5001/api/v0/version
pinata-mock:        curl http://localhost:3002/health
akash-simulator:    curl http://localhost:3003/health
celestia-node:      curl http://localhost:26659/head
varity-api-local:   curl http://localhost:3001/health
postgres:           pg_isready -U varity
redis:              redis-cli ping
```

### Logging

All services use Docker's logging driver:

```
Log Driver: json-file
Max Size:   10MB
Max Files:  3
```

View logs:
```bash
./scripts/logs.sh <service-name>
```

### Metrics

Available through Docker stats:

```bash
docker stats
```

Or programmatically:
```bash
docker stats --no-stream --format "{{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

## Scalability Considerations

### Horizontal Scaling (Not Supported)

LocalDePin runs a single instance of each service. Horizontal scaling is not supported as it's designed for local development, not production load testing.

### Vertical Scaling (Supported)

You can allocate more resources to specific services:

```yaml
# In docker-compose.yml
services:
  arbitrum-node:
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 4G
        reservations:
          cpus: '2'
          memory: 2G
```

### Performance Tuning

1. **Increase Docker Resources**
   - Allocate more CPU, memory in Docker Desktop settings

2. **Use SSD Storage**
   - Ensure Docker volumes are on SSD

3. **Disable Unnecessary Services**
   - Comment out services you don't need

4. **Adjust Health Check Timeouts**
   - Reduce wait times for faster startup

## Comparison with Production

| Component | LocalDePin | Production |
|-----------|-----------|------------|
| **Blockchain** |
| Network | Single node (dev mode) | Multi-node (PoS) |
| Finality | Instant | 12+ seconds |
| TPS | Unlimited | ~40,000 TPS |
| **Storage** |
| IPFS | Single node | Multi-region cluster |
| Encryption | Mock (Lit Protocol) | Real Lit Protocol |
| Replication | None | 3+ copies |
| **Compute** |
| LLM | Mock responses | Real Gemini 2.5 Flash |
| Location | Local | Akash Network (global) |
| Scaling | Fixed | Auto-scaling |
| **Database** |
| Type | PostgreSQL (local) | Cloud SQL (HA) |
| Backup | None | Automated daily |
| Replication | None | Multi-zone |

## Extension Points

### Adding New Services

1. Add service to `docker-compose.yml`
2. Add health check to `scripts/healthcheck.sh`
3. Add tests to `tests/`
4. Update documentation

### Customizing Configuration

1. Edit `config/*.json` for service configs
2. Edit `docker-compose.yml` for Docker settings
3. Edit `scripts/` for orchestration behavior

### Integrating with External Tools

LocalDePin exposes standard interfaces:
- JSON-RPC for blockchain (Web3.js, Ethers.js)
- IPFS HTTP API (js-ipfs, ipfs-http-client)
- REST APIs (axios, fetch)
- WebSocket (ws, socket.io)

---

**For more details, see**:
- [README.md](../README.md) - Getting started guide
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues and solutions
- [API_REFERENCE.md](API_REFERENCE.md) - API documentation
