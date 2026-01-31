# VarityKit CLI

> AI-powered CLI for building dashboards on Varity L3

[![PyPI version](https://badge.fury.io/py/varietykit.svg)](https://badge.fury.io/py/varietykit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)

VarityKit is an enterprise-grade command-line tool for building, testing, and deploying AI-powered dashboard templates to the Varity L3 blockchain. Inspired by Algorand's AlgoKit, VarityKit enables developers worldwide to create industry-specific dashboards with built-in AI capabilities.

## 🎉 Enterprise-Grade Blockchain CLI - COMPLETE!

**VarityKit v1.0** - State-of-the-art multi-chain developer platform

### 🚀 What Makes VarityKit Unique

**The ONLY blockchain CLI with ALL of these:**
- ✅ **AI-Powered Code Generation** - Natural language to smart contracts
- ✅ **Multi-Industry Templates** - Finance, Healthcare, Retail, ISO
- ✅ **Multi-Chain Native** - Deploy to any EVM blockchain
- ✅ **Full Local DePin Stack** - 9 integrated services
- ✅ **Enterprise Features** - Matching AlgoKit + Hardhat + Foundry
- ✅ **State Management** - Snapshot/restore workflow states

### 📦 What's Included (77+ Commands)

**Phase 1 Complete** (Weeks 1-6):
- ✅ **Local Development Network** (`localnet`) - 8 commands
- ✅ **Deployment Automation** (`deploy`) - 4 commands
- ✅ **Contract Interaction** (`contract`) - 4 commands
- ✅ **Enhanced Doctor** - 20-29 comprehensive checks
- ✅ **Shell Completions** - Bash, zsh, fish
- ✅ **Task Utilities** - Wallet, storage, dashboard management
- ✅ **TestNet Dispenser** - Automated funding + faucet guide

**Phase 2 Complete** (Weeks 7-10):
- ✅ **Template Creation** (`template`) - 6 commands
- ✅ **AI-Powered Component Generation** - Natural language to code
- ✅ **Template Marketplace** (`marketplace`) - 6 commands
- ✅ **70/30 Revenue Sharing** - Automatic payments via smart contracts

See [BLOCKCHAIN_CLI_RESEARCH_AND_IMPLEMENTATION.md](BLOCKCHAIN_CLI_RESEARCH_AND_IMPLEMENTATION.md) for complete analysis and comparison with AlgoKit, Hardhat, Foundry, and Anchor.

## Features

- **AI-Powered Configuration**: Intelligent project setup with chain-of-thought reasoning (Vertex AI / Gemini 2.5 Flash)
- **Conversational Interface**: Natural language Q&A instead of manual coding
- **Self-Correction**: Automatic code validation and error fixing (max 3 attempts)
- **Quality Scoring**: 6-dimension quality assessment with >85% threshold
- **Industry Templates**: Pre-built templates for Finance, Healthcare, Retail, ISO Merchant Services
- **DePin Integration**: Deploy to decentralized infrastructure (Akash, Filecoin, Celestia)
- **Local Development**: Full local blockchain environment with hot reload
- **Smart Contract Deployment**: Automated deployment to Varity L3 (testnet/mainnet)
- **RAG Knowledge Management**: 50,000+ knowledge documents for intelligent context
- **License Management**: Built-in revenue sharing and licensing system

## Installation

### Using pipx (Recommended)

```bash
# Standard installation
pipx install varietykit

# With blockchain utilities (wallet, fund commands)
pipx install "varietykit[blockchain]"

# With all optional features
pipx install "varietykit[all]"
```

### Using pip

```bash
# Standard installation
pip install varietykit

# With blockchain utilities (wallet, fund commands)
pip install "varietykit[blockchain]"

# With all optional features
pip install "varietykit[all]"
```

### Development Installation

```bash
# Clone repository
git clone https://github.com/varity-ai/varietykit-cli.git
cd varietykit-cli

# Install in editable mode with all features
pip install -e ".[all]"

# Install shell completions
varietykit completions --install
```

## Quick Start

### 1. Check Your Environment

```bash
varietykit doctor
```

This validates that all required tools are installed:
- Docker & Docker Compose
- Node.js & npm
- Python 3.10+
- Git

### 2. Create a New Project

```bash
varietykit init my-finance-dashboard
```

Follow the interactive prompts to configure your project:
- Select industry template (Finance, Healthcare, Retail, etc.)
- Configure company details
- Choose features and integrations

### 3. Install Dependencies

```bash
cd my-finance-dashboard
varietykit bootstrap
```

### 4. Start Development

```bash
# Start local DePin network
varietykit localdepin start

# Start development server
varietykit dev
```

Your dashboard will be available at http://localhost:3000

### 5. Deploy

```bash
# Deploy to testnet
varietykit deploy testnet

# Deploy to mainnet (requires license)
varietykit deploy mainnet
```

## Commands

### Core Commands

#### `varietykit doctor` ⭐ **ENHANCED (Phase 1)**

Comprehensive environment diagnostics with 20+ validation checks.

```bash
# Quick check (20 checks)
varietykit doctor

# Full diagnostics (29 checks - includes LocalDePin services)
varietykit doctor --full

# Auto-fix issues (coming soon)
varietykit doctor --fix
```

**Check Categories**:
- Required Tools (6): Docker, Node.js, Python, Git
- System Resources (2): Disk space, Memory
- Project Configuration (2): .env file, varity.config.json
- Network Connectivity (1): Internet
- API Endpoints (2): Staging, Production
- Port Availability (3): 3000, 3001, 8545
- Blockchain RPC (3): Arbitrum L3, Sepolia, Arbitrum One
- LocalDePin Services (9, --full only): All 9 DePin services

#### `varietykit completions` ⭐ **NEW (Phase 1)**

Setup shell completions for bash, zsh, and fish.

```bash
# Auto-detect shell and show instructions
varietykit completions

# Auto-install to shell config
varietykit completions --install

# Generate for specific shell
varietykit completions --shell bash
```

Enables tab completion for all commands, options, and arguments.

#### `varietykit init [PROJECT_NAME]`

Initialize a new Varity dashboard project.

```bash
# Interactive mode
varietykit init

# With options
varietykit init my-dashboard --template finance --path ./projects/acme
```

Options:
- `--template, -t`: Template to use (finance, healthcare, retail, iso-merchant, generic)
- `--path, -p`: Path where project should be created
- `--yes, -y`: Skip confirmation prompts

#### `varietykit bootstrap`

Install project dependencies (npm, pip, Docker images).

```bash
varietykit bootstrap

# Skip specific steps
varietykit bootstrap --skip-npm --skip-docker
```

Options:
- `--skip-npm`: Skip npm install
- `--skip-pip`: Skip pip install
- `--skip-docker`: Skip Docker setup

### Local Development Network Commands ⭐ **NEW (Phase 1)**

#### `varietykit localnet`

Manage local DePin development network with 9 integrated services.

```bash
# Start entire local network (Arbitrum L3 + IPFS + Celestia + more)
varietykit localnet start

# Check status of all services
varietykit localnet status

# View logs (with optional filtering)
varietykit localnet logs
varietykit localnet logs -f                    # Follow logs
varietykit localnet logs -s arbitrum-node      # Specific service

# List pre-funded test accounts
varietykit localnet accounts                    # 10 accounts with 10K-1M ETH each

# Show network information
varietykit localnet info

# State management (save/restore network state)
varietykit localnet snapshot --name my-state
varietykit localnet restore --name my-state

# Stop network (preserves data)
varietykit localnet stop

# Reset to clean state (deletes all data)
varietykit localnet reset
```

**Included Services**:
- Arbitrum L3 Node (Chain ID: 421614)
- IPFS/Filecoin storage
- Celestia data availability
- PostgreSQL database
- Redis cache
- Pinata mock service
- Akash compute simulator
- Varity API server
- Block explorer (http://localhost:8080)

**Pre-funded Accounts**: 10 test accounts with 10,000-1,000,000 ETH each

**Unique Features**:
- State snapshots (save/restore workflow states)
- Integrated 9-service stack
- One-command startup (~60 seconds)

### Deployment Commands ⭐ **NEW (Phase 1)**

#### `varietykit deploy`

Enterprise-grade deployment automation with multi-network support.

```bash
# Deploy to local network
varietykit deploy run --network local

# Deploy to testnet with verification
varietykit deploy run --network sepolia --verify

# Interactive deployment wizard
varietykit deploy run --interactive

# Dry run (simulate without deploying)
varietykit deploy run --dry-run --network mainnet

# Check deployment status
varietykit deploy status

# View deployment history
varietykit deploy list

# Rollback to previous deployment
varietykit deploy rollback --network sepolia --steps 1
```

**Features**:
- Multi-network deployment (local/sepolia/mainnet)
- Automatic contract verification on Arbiscan
- Deployment state tracking
- Complete deployment history
- Rollback capabilities
- Interactive wizard mode
- Dry-run simulation
- Gas estimation

**Networks Supported**:
- `local` - LocalDePin network
- `sepolia` - Arbitrum Sepolia testnet
- `mainnet` - Arbitrum One mainnet

#### `varietykit app deploy` ⭐ **NEW (Phase 1)**

Deploy full applications to decentralized infrastructure with one command.

```bash
# Deploy current directory to IPFS
varietykit app deploy

# Deploy specific directory
varietykit app deploy --path ./my-next-app

# Deploy to specific network
varietykit app deploy --network varity

# Submit to App Store (Phase 2)
varietykit app deploy --submit-to-store

# List all deployments
varietykit app list

# View deployment details
varietykit app info deploy-1737492000

# Check deployment status
varietykit app status --network varity
```

**Phase 1 Features** (Current):
- Frontend deployment to IPFS
- Automatic project detection (Next.js, React, Vue)
- Build automation
- thirdweb Storage integration
- Cost: ~$0.01/GB/month (70-85% cheaper than AWS)

**Phase 2 Features** (Coming Soon):
- Backend deployment to Akash
- Smart contract deployment integration
- Auto-submission to Varity App Store
- Custom domains
- Deployment history and rollback

**Supported Frameworks**:
- Next.js 13+ (App Router with `output: "export"`)
- React 18+ (Create React App, Vite)
- Vue 3+
- Express.js, Fastify, FastAPI (Phase 2)

See [docs/APP_DEPLOY.md](docs/APP_DEPLOY.md) for complete documentation, examples, and troubleshooting.

### Development Commands

#### `varietykit dev`

Start development server with hot reload.

```bash
varietykit dev

# Custom ports
varietykit dev --frontend-port 3000 --backend-port 3001
```

#### `varietykit localdepin`

Manage local DePin network (Docker Compose).

```bash
# Start services
varietykit localdepin start

# Stop services
varietykit localdepin stop

# Reset to clean state
varietykit localdepin reset

# Show service status
varietykit localdepin status
```

#### `varietykit test`

Run tests.

```bash
# Run all tests
varietykit test

# Watch mode
varietykit test --watch

# Coverage report
varietykit test --coverage
```

### Deployment Commands

#### `varietykit deploy`

Deploy dashboard to blockchain network.

```bash
# Deploy to local network
varietykit deploy localnet

# Deploy to testnet
varietykit deploy testnet

# Deploy to mainnet
varietykit deploy mainnet
```

### Contract Interaction Commands ⭐ **NEW (Phase 1)**

#### `varietykit contract`

Interact with deployed smart contracts.

```bash
# Call read-only contract method
varietykit contract call 0x123... balanceOf 0xABC... --network sepolia

# Send state-changing transaction
varietykit contract send 0x123... transfer 0xABC... 1000000 --network sepolia

# Query historical events
varietykit contract events 0x123... --event Transfer --from-block 1000000 --network sepolia

# Watch events in real-time
varietykit contract events 0x123... --event Transfer --watch --network sepolia

# List deployed contracts
varietykit contract list --network sepolia
```

**Features**:
- Read-only contract method calls
- State-changing transactions with confirmation
- Event querying and real-time watching
- Automatic ABI loading from deployments
- Multi-network support (local/sepolia/mainnet)
- Transaction signing and receipt handling
- Gas estimation and custom limits

**Contract Call Options**:
- `--network` - Target network (local/sepolia/mainnet)
- `--abi` - Custom ABI file path
- `--value` - ETH to send with call (in wei)
- `--gas-limit` - Override gas limit

**Contract Send Options**:
- `--from-address` - Sender wallet address
- `--private-key` - Private key for signing
- `--confirm` - Skip confirmation prompt
- `--gas-limit` - Override gas limit
- `--value` - ETH to send with transaction

**Contract Events Options**:
- `--event` - Event name to filter (default: all events)
- `--from-block` - Start block number
- `--to-block` - End block number (default: latest)
- `--watch` - Real-time event watching
- `--limit` - Maximum events to display

### Template Creation Commands ⭐ **NEW (Phase 2A)**

#### `varietykit template`

Create, test, and manage dashboard templates with AI assistance.

```bash
# Create new template with AI-powered wizard
varietykit template create

# Create template for specific industry
varietykit template create --industry legal --name legal-dashboard

# Run automated tests
varietykit template test
varietykit template test --coverage           # With coverage report
varietykit template test --watch              # Watch mode

# Preview template in browser
varietykit template preview
varietykit template preview --port 3001       # Custom port

# Validate template quality
varietykit template validate
varietykit template validate --fix            # Auto-fix issues

# List available templates
varietykit template list

# Show template details
varietykit template info finance
```

**Features**:
- **AI-Powered Generation** - Natural language to production code in 10 minutes
- **Automated Component Creation** - 5-12 React components generated
- **TypeScript Support** - Full type safety with auto-generated types
- **Test Generation** - Unit tests + E2E tests (85%+ coverage)
- **Quality Validation** - 6-dimension quality scoring
- **Live Preview** - Hot reload development server
- **Production Ready** - Tailwind CSS, Vite, modern React

**Template Creation Flow**:
1. Describe industry and features (natural language)
2. AI generates React components automatically
3. Tests created (85%+ coverage)
4. Preview and validate
5. Ready to publish

**What You Provide**:
- Industry/vertical (e.g., legal, manufacturing, education)
- Main features (natural language description)
- Target company size (small/medium/large)
- Component preferences (optional)

**What AI Generates**:
- 5-12 React components (TypeScript)
- Dashboard pages with routing
- API integration code
- TypeScript types and interfaces
- Tailwind CSS styling
- Unit tests (85%+ coverage)
- E2E tests (Playwright)
- Documentation (README, API docs)

**Time Metrics**:
- Template creation: < 10 minutes
- Code you write: ~50 lines (config only)
- Code AI generates: ~2,000 lines

### Marketplace Commands ⭐ **NEW (Phase 2B)**

#### `varietykit marketplace`

Publish, discover, and monetize dashboard templates with 70/30 revenue sharing.

```bash
# Publish your template to marketplace
varietykit marketplace publish
varietykit marketplace publish --price 299

# Search for templates
varietykit marketplace search legal
varietykit marketplace search --category Finance --max-price 300

# Install template from marketplace
varietykit marketplace install legal-case-management
varietykit marketplace install healthcare-portal --output ./my-project

# View your statistics and earnings
varietykit marketplace stats

# Update published template
varietykit marketplace update --version 1.1.0
varietykit marketplace update --price 349

# Remove from marketplace
varietykit marketplace unpublish my-template
```

**Features**:
- **70/30 Revenue Split** - You keep 70% of every sale
- **Automatic Payments** - Via Varity L3 smart contracts
- **Template Discovery** - Search by category, price, quality
- **Quality Assurance** - Only 85+ quality score templates
- **Transparent Analytics** - Track downloads and earnings
- **Instant Installation** - One-command template purchase

**Publishing Requirements**:
- Quality score > 85/100
- Test coverage > 85%
- Complete documentation
- Valid template.json
- GitHub repository

**Revenue Model**:
- You set the price ($99-$999 recommended)
- Smart contract enforces 70/30 split
- Automatic payment on each sale
- No manual invoicing needed
- Transparent transaction history

**What Happens on Purchase**:
1. Customer pays template price
2. Smart contract splits payment:
   - 70% to template creator
   - 30% to Varity (platform fee)
3. Customer gets instant access
4. You receive payment automatically

**Example Earnings**:
```
Template Price: $299
Your Revenue: $209.30 per sale (70%)
Platform Fee: $89.70 (30%)

10 sales = $2,093
50 sales = $10,465
100 sales = $20,930
```

### Data Migration Commands ⭐ **NEW**

#### `varietykit migrate`

Migrate data from AWS S3 or Google Cloud Storage to Varity's decentralized infrastructure with blockchain verification.

```bash
# Migrate from AWS S3
varietykit migrate s3 --bucket my-s3-bucket --verify

# Migrate from Google Cloud Storage
varietykit migrate gcs --bucket my-gcs-bucket --project my-project

# Check migration status
varietykit migrate status --job-id mig_abc123xyz

# Verify migration integrity
varietykit migrate verify --job-id mig_abc123xyz

# Blockchain chain verification
varietykit migrate verify-chain --source-chain 1 --wallet 0xYourAddress

# Pre-flight checks
varietykit migrate preflight --source-chain 1 --wallet 0xYourAddress

# Generate migration report
varietykit migrate report --source-chain 1 --format markdown --output report.md

# List supported chains
varietykit migrate chains
```

**Features**:
- **Multi-Cloud Support** - Migrate from AWS S3 or Google Cloud Storage
- **Progress Tracking** - Real-time progress bars with speed indicators
- **Resume Capability** - Automatically resume interrupted migrations
- **Data Integrity** - SHA-256 hash verification for all transfers
- **Blockchain Verification** - Verify chain connectivity and compatibility
- **Contract Compatibility** - Check smart contract deployability
- **Cost Estimation** - Calculate savings vs. traditional cloud storage
- **Concurrent Transfers** - Configurable concurrency for optimal performance
- **Dry Run Mode** - Test migration without actual data transfer

**Supported Chains**:
- Ethereum Mainnet (1)
- Arbitrum One (42161)
- Arbitrum Sepolia (421614)
- Polygon (137)
- Base (8453)
- Optimism (10)
- Varity L3 Testnet (33529) - Default destination

**Migration Commands**:
- `s3` - Migrate from AWS S3 bucket
- `gcs` - Migrate from Google Cloud Storage bucket
- `status` - Check migration job status
- `verify` - Verify migration integrity
- `verify-chain` - Verify blockchain chain connectivity
- `preflight` - Run pre-flight checks before migration
- `chains` - List supported blockchain chains
- `report` - Generate comprehensive migration report

**Prerequisites**:
- Install @varity/migrate: `npm install -g @varity/migrate`
- AWS credentials (for S3 migrations)
- GCP credentials (for GCS migrations)
- Varity API credentials (VARITY_API_KEY)

### Utility Commands ⭐ **NEW (Phase 1)**

#### `varietykit task wallet`

Wallet management utilities.

```bash
# Create new wallet
varietykit task wallet create --name "Dev Wallet" --save

# Import existing wallet
varietykit task wallet import --name "Imported" --save

# List all wallets
varietykit task wallet list

# Check balance
varietykit task wallet balance --network sepolia
varietykit task wallet balance --address 0x123... --network local
```

#### `varietykit task storage`

IPFS/Filecoin storage utilities.

```bash
# Upload file to IPFS
varietykit task storage upload ./myfile.json --pin

# Download from IPFS
varietykit task storage download QmHash123... --output ./downloaded.json

# List pinned files
varietykit task storage list
```

#### `varietykit task dashboard`

Dashboard deployment and management utilities.

```bash
# Deploy dashboard
varietykit task dashboard deploy --name "Finance Dashboard" --network testnet

# List deployed dashboards
varietykit task dashboard list

# View dashboard logs
varietykit task dashboard logs <dashboard-id>
```

#### `varietykit fund` ⭐ **NEW (Phase 1)**

Fund wallet with test ETH from faucets.

```bash
# Fund default wallet on Sepolia (guided)
varietykit fund --network sepolia

# Fund specific address
varietykit fund --address 0x123... --network sepolia

# Fund on local network (automated)
varietykit fund --network local --amount 1.0
```

**Supported Faucets**:
- Alchemy Sepolia Faucet
- Chainlink Sepolia Faucet
- QuickNode Sepolia Faucet
- Infura Sepolia Faucet

Local network funding is fully automated. Sepolia funding provides guided instructions and browser integration.

### Advanced Commands

#### `varietykit configure`

Launch AI-powered configuration wizard.

```bash
varietykit configure
```

#### `varietykit knowledge`

Manage RAG knowledge base.

```bash
# Ingest documents
varietykit knowledge ingest ./docs

# Search knowledge
varietykit knowledge search "compliance requirements"

# Show statistics
varietykit knowledge stats

# Validate quality
varietykit knowledge validate
```

#### `varietykit license`

Manage dashboard licenses.

```bash
# Create license
varietykit license create

# Verify license
varietykit license verify <license-id>

# Show status
varietykit license status
```

#### `varietykit explore`

Launch VarityKit Explorer (web UI).

```bash
# Local explorer
varietykit explore

# Network-specific
varietykit explore testnet
varietykit explore mainnet
```

#### `varietykit generate`

Generate code from templates.

```bash
# Generate React component
varietykit generate component MyComponent

# Generate dashboard page
varietykit generate page Dashboard

# Generate API integration
varietykit generate api MyService
```

## Global Options

All commands support these global options:

- `--verbose, -v`: Enable verbose output
- `--debug`: Enable debug output
- `--json`: Output in JSON format
- `--version`: Show version
- `--help`: Show help

## Configuration

VarityKit uses `.varietykit.toml` for project configuration. This file is automatically created when you run `varietykit init`.

### Example Configuration

```toml
environment = "development"
project_name = "my-dashboard"
project_path = "/path/to/project"

[api]
staging_url = "https://staging.api.varity.io"
production_url = "https://api.varity.io"
local_url = "http://localhost:3001"
timeout = 30

[network]
localnet_rpc = "http://localhost:8545"
testnet_rpc = "https://sepolia.varity.io"
mainnet_rpc = "https://mainnet.varity.io"

[storage]
filecoin_gateway = "https://api.pinata.cloud"
ipfs_gateway = "https://gateway.pinata.cloud"

[logging]
level = "INFO"
json_format = false
```

## Environment Variables

- `VARITY_API_KEY`: API key for Varity services
- `VARITY_WALLET_ADDRESS`: Your Ethereum wallet address
- `VARITY_ENV`: Environment (development, staging, production)
- `VARITY_CONFIG_DIR`: Custom config directory

## Templates

VarityKit includes official templates for different industries:

### Finance Template
- Fraud detection
- AML monitoring
- Transaction analytics
- Compliance reporting

### Healthcare Template
- Patient management
- Appointment scheduling
- EHR integration
- HIPAA compliance

### Retail Template
- Inventory management
- Sales analytics
- Customer insights
- Supply chain tracking

### ISO Merchant Template
- Merchant onboarding
- Payment processing
- Residuals tracking
- PCI compliance

### Generic Template
- Data visualization
- Reporting
- User management

## Development

### Setup Development Environment

```bash
# Clone repository
git clone https://github.com/varity-ai/varietykit-cli.git
cd varietykit-cli

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install in editable mode
pip install -e ".[dev]"

# Run tests
pytest

# Run linting
black .
ruff check .
mypy varietykit
```

### Project Structure

```
varietykit-cli/
├── varietykit/
│   ├── cli/
│   │   ├── __init__.py
│   │   ├── main.py          # CLI entrypoint
│   │   ├── doctor.py        # doctor command
│   │   ├── init.py          # init command
│   │   ├── bootstrap.py     # bootstrap command
│   │   └── ...              # other commands
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py        # Configuration management
│   │   └── templates.py     # Template management
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── logger.py        # Logging utilities
│   │   └── validators.py    # Validation utilities
│   └── __init__.py
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
├── examples/
├── pyproject.toml
├── README.md
└── LICENSE
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- Documentation: https://docs.varity.ai/varietykit
- GitHub Issues: https://github.com/varity-ai/varietykit-cli/issues
- Discord: https://discord.gg/varity
- Email: hello@varity.com

## Related Projects

- [@varity/ui-kit](https://github.com/varity-ai/ui-kit) - React component library
- [@varity/core-backend](https://github.com/varity-ai/core-backend) - Backend services
- [varity-api-server](https://github.com/varity-ai/api-server) - API gateway

## Acknowledgments

Inspired by [AlgoKit](https://github.com/algorandfoundation/algokit-cli) from the Algorand Foundation.

---

Built with ❤️ by the Varity team
