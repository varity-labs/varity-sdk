# Known Issues — varitykit CLI v1.0.0

> **Last Updated:** February 10, 2026
> **Test Status:** 24/25 pass (1 pre-existing failure)

---

## What Works

| Command | Status | Notes |
|---------|--------|-------|
| `varitykit doctor` | Working | Validates environment (Node, npm, git, system resources) |
| `varitykit doctor --full` | Working | Adds infrastructure connectivity checks |
| `varitykit init` | Working | Scaffolds SaaS Template project |
| `varitykit app deploy` | Working | Deploys static sites to IPFS hosting |
| `varitykit app deploy --submit-to-store` | Working | Opens developer portal in browser |
| `varitykit app list` | Working | Lists deployment history |
| `varitykit app info` | Working | Shows deployment details |
| `varitykit app rollback` | Working | Rolls back to previous deployment |
| `varitykit dev` | Working | Starts development servers |
| `varitykit template` | Working | Template management |
| `varitykit --help` | Working | Clean help output |

## What Doesn't Work

### 1. Template Marketplace (`varitykit marketplace`)
The marketplace commands (publish, search, install, stats) are **mock implementations**. They display UI but don't actually connect to a marketplace backend. This will be functional when the marketplace API is built.

### 2. Dynamic Hosting (`--hosting dynamic`)
Dynamic app deployment via Akash is not yet integrated into the CLI. Only static site deployment (`--hosting static`) works for MVP.

### 3. On-Chain Pricing
The `set_app_price_on_chain()` function is fully commented out. Pricing is set manually through the developer portal.

### 4. Hidden Advanced Commands
The following commands are hidden from `--help` and are **not functional for MVP**:
- `varitykit contract` — Smart contract management
- `varitykit deploy` — Advanced deployment
- `varitykit fund` — Wallet funding
- `varitykit localnet` — Local blockchain environment
- `varitykit localdepin` — LocalDePIN distributed network
- `varitykit marketing` — Marketing tools
- `varitykit thirdweb` — thirdweb integration
- `varitykit task` — Task management

These are hidden because they require infrastructure that isn't ready for MVP.

### 5. Pre-existing Test Failure
`test_build_fails_for_invalid_command` in `test_build_manager.py` fails because it expects a `BuildError` but gets `FileNotFoundError`. This is a pre-existing issue, not from audit changes.

## Templates

Only **1 template** is available: `saas-starter` (Next.js SaaS application).

## Database Credentials

The CLI generates database credentials automatically during `varitykit app deploy`:
- Creates temporary `.env.local` with `NEXT_PUBLIC_VARITY_*` env vars
- Credentials are deleted after build completes
- JWT tokens are valid for 365 days

## Reporting Issues

Please report issues at: https://github.com/varity-labs/varity-sdk/issues
