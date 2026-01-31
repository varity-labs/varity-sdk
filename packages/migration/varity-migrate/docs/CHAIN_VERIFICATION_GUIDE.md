# Blockchain Chain Verification Guide

## Overview

The `@varity/migrate` package includes comprehensive blockchain chain verification capabilities to ensure safe and successful migrations between blockchains. This guide covers all verification features, supported chains, and best practices.

## Table of Contents

1. [Supported Chains](#supported-chains)
2. [Chain Verification](#chain-verification)
3. [Contract Verification](#contract-verification)
4. [Pre-Flight Checks](#pre-flight-checks)
5. [Migration Reports](#migration-reports)
6. [CLI Commands](#cli-commands)
7. [Best Practices](#best-practices)

---

## Supported Chains

### Destination Chains

**Varity L3** (Chain ID: 33529)
- Gas Token: USDC (6 decimals)
- Parent Chain: Arbitrum One
- Features: Lit Protocol encryption, Celestia DA, 90% cost savings
- Settlement: Arbitrum One → Ethereum

### Source Chains

| Chain | Chain ID | Gas Token | Decimals | Status |
|-------|----------|-----------|----------|--------|
| Ethereum Mainnet | 1 | ETH | 18 | ✅ Supported |
| Polygon | 137 | MATIC | 18 | ✅ Supported |
| Arbitrum One | 42161 | ETH | 18 | ✅ Supported |
| Arbitrum Sepolia | 421614 | ETH | 18 | ✅ Testnet |
| Base | 8453 | ETH | 18 | ✅ Supported |
| Optimism | 10 | ETH | 18 | ✅ Supported |

### List All Supported Chains

```bash
varity migrate chains
```

---

## Chain Verification

### What It Checks

1. **RPC Connectivity**
   - Tests connection to blockchain RPC
   - Measures latency
   - Fetches current block number

2. **Chain ID Validation**
   - Verifies chain ID matches expected value
   - Prevents accidental wrong-chain operations

3. **Gas Token Information**
   - Identifies native gas token (ETH, USDC, MATIC)
   - Determines decimal precision
   - Critical for cost calculations

4. **Wallet Balance** (optional)
   - Checks gas token balance for provided wallet
   - Ensures sufficient funds for operations

### CLI Command

```bash
# Basic chain verification
varity migrate verify-chain --source-chain 1

# Verify both source and destination
varity migrate verify-chain --source-chain 1 --dest-chain 33529

# Include wallet balance check
varity migrate verify-chain \
  --source-chain 1 \
  --dest-chain 33529 \
  --wallet 0xYourWalletAddress

# Use custom RPC endpoints
varity migrate verify-chain \
  --source-chain 1 \
  --source-rpc https://your-ethereum-rpc.com \
  --dest-chain 33529 \
  --dest-rpc https://your-varity-rpc.com
```

### Example Output

```
╔═══════════════════════════════════════════════════════════╗
║         BLOCKCHAIN MIGRATION VERIFICATION                 ║
╚═══════════════════════════════════════════════════════════╝

=== Ethereum Mainnet (Chain ID: 1) ===
Status: ✅ VALID

RPC Connectivity:
  URL: https://eth.llamarpc.com
  Connected: ✅ Yes
  Latency: 145ms
  Block Number: 18500000

Chain ID Verification:
  Expected: 1
  Actual: 1
  Matches: ✅ Yes

=== Varity L3 (Chain ID: 33529) ===
Status: ✅ VALID

RPC Connectivity:
  URL: https://rpc.varity.network
  Connected: ✅ Yes
  Latency: 89ms
  Block Number: 1250000

Chain ID Verification:
  Expected: 33529
  Actual: 33529
  Matches: ✅ Yes

Gas Token:
  Symbol: USDC
  Decimals: 6

Warnings:
  ⚠️  Gas paid in USDC (6 decimals)
  ⚠️  All storage encrypted with Lit Protocol

=== Migration Compatibility ===
Migration Allowed: ✅ YES

Recommendations:
  💡 Varity L3 uses USDC (6 decimals) for gas instead of ETH (18 decimals).
     Ensure you have sufficient USDC for gas fees on Varity L3.
```

---

## Contract Verification

### What It Checks

1. **Contract Size**
   - Verifies bytecode size ≤ 24KB limit
   - Prevents deployment failures

2. **ABI Compatibility**
   - Basic checks for incompatible patterns
   - Detects precompile usage

3. **Gas Estimation**
   - Estimates deployment costs
   - Accounts for gas token decimals

4. **USDC Compatibility** (Varity L3)
   - Checks decimal handling in contract
   - Warns about amount calculations
   - Ensures 6-decimal USDC compatibility

### CLI Command

```bash
# Verify single contract
varity migrate report \
  --source-chain 1 \
  --dest-chain 33529 \
  --contracts 0xContractAddress

# Verify multiple contracts
varity migrate report \
  --source-chain 1 \
  --contracts 0xContract1,0xContract2,0xContract3
```

### Example Output

```
╔═══════════════════════════════════════════════════════════╗
║         SMART CONTRACT VERIFICATION                       ║
╚═══════════════════════════════════════════════════════════╝

Contract Address: 0x1234...5678
Source Chain ID: 1
Destination Chain ID: 33529

Deployable: ✅ YES

--- Size Compatibility ---
Status: ✅ PASSED
Contract Size: 15234 bytes
Max Allowed: 24576 bytes
Message: Contract size 15234 bytes is within limit of 24576 bytes

--- ABI Compatibility ---
Status: ✅ PASSED
Message: Basic ABI compatibility checks passed

--- Gas Estimation ---
Estimable: ✅ YES
Estimated Cost: 0.6000 USDC
Message: Estimated deployment cost: 0.6000 USDC

--- USDC Compatibility (Varity L3) ---
Status: ✅ PASSED
Message: USDC compatibility checks completed
Recommendations:
  💡 Contract appears to handle token amounts. Verify that decimal
     handling is correct for USDC (6 decimals) vs ETH (18 decimals)
  💡 Test all amount calculations with 6-decimal USDC values before deploying
  💡 Varity L3 uses USDC (6 decimals) for gas. Ensure gas estimation
     logic accounts for this difference.
```

---

## Pre-Flight Checks

### What It Checks

1. **Chain Connectivity**
   - Verifies both source and destination chains
   - Ensures RPC accessibility

2. **Wallet Balance**
   - Checks source chain balance
   - Verifies sufficient destination gas
   - Compares against minimum required

3. **Contract Compatibility**
   - Validates all contracts can deploy
   - Reports incompatibility percentage

4. **Network Permissions**
   - Tests read access on source chain
   - Tests write access on destination chain

5. **Gas Cost Estimation**
   - Calculates total migration cost
   - Provides cost breakdown

### CLI Command

```bash
# Basic pre-flight check
varity migrate preflight --source-chain 1

# Complete pre-flight with all options
varity migrate preflight \
  --source-chain 1 \
  --dest-chain 33529 \
  --wallet 0xYourWalletAddress \
  --contracts 0xContract1,0xContract2 \
  --min-gas 1.0
```

### Example Output

```
╔═══════════════════════════════════════════════════════════╗
║         PRE-FLIGHT MIGRATION CHECKS                        ║
╚═══════════════════════════════════════════════════════════╝

Check Time: 2025-11-14T12:00:00.000Z
Overall Status: ✅ PASSED

═══ Individual Checks ═══

1. Chain Connectivity:
   Status: ✅ PASSED

2. Wallet Balance:
   Status: ✅ PASSED
   Source Balance: 1.5 ETH
   Destination Balance: 150.0 USDC
   Minimum Required: 1.0 USDC

3. Contract Compatibility:
   Status: ✅ PASSED
   Total Contracts: 3
   Deployable: 3

4. Network Permissions:
   Status: ✅ PASSED
   Can Read Source: ✅
   Can Write Destination: ✅

5. Gas Cost Estimation:
   Status: ✅ PASSED
   Estimated Cost: 1.8 USDC

═══ Recommendations ═══
1. 💡 Estimated migration cost: 1.8 USDC
2. 💡 Migration to Varity L3 includes:
     • Lit Protocol encryption for all data
     • Celestia DA for data availability
     • Settlement to Arbitrum One L2
     • Gas paid in USDC (6 decimals)
     • 90% cost savings vs traditional cloud

✅ All pre-flight checks passed! Migration can proceed.
```

---

## Migration Reports

### What It Includes

1. **Summary**
   - Migration allowed status
   - Risk level assessment
   - Estimated duration and cost

2. **Chain Verification Results**
   - Source and destination chain details
   - Compatibility analysis

3. **Contract Verification** (if contracts provided)
   - Total contracts analyzed
   - Deployable vs incompatible counts

4. **Cost Analysis**
   - Deployment costs
   - Storage costs
   - Cloud cost comparison (Varity L3)

5. **Recommendations & Warnings**
   - Action items
   - Potential issues
   - Best practices

6. **Next Steps**
   - Ordered list of actions to take

### CLI Command

```bash
# Generate console report
varity migrate report --source-chain 1

# Generate JSON report
varity migrate report \
  --source-chain 1 \
  --format json \
  --output report.json

# Generate Markdown report
varity migrate report \
  --source-chain 1 \
  --format markdown \
  --output report.md

# Complete report with all data
varity migrate report \
  --source-chain 1 \
  --dest-chain 33529 \
  --wallet 0xYourWalletAddress \
  --contracts 0xContract1,0xContract2 \
  --format json \
  --output migration-report.json
```

### Example Output

```
╔═══════════════════════════════════════════════════════════╗
║         BLOCKCHAIN MIGRATION REPORT                        ║
╚═══════════════════════════════════════════════════════════╝

Report ID: MR-1731585600000-abc123def
Generated: 2025-11-14T12:00:00.000Z

═══ SUMMARY ═══
Source Chain: Ethereum Mainnet (1)
Destination Chain: Varity L3 (33529)
Migration Allowed: ✅ YES
Risk Level: LOW
Estimated Duration: 15 minutes
Estimated Cost: $5.50

═══ CONTRACT VERIFICATION ═══
Total Contracts: 5
Deployable: 5
Incompatible: 0

═══ COST ANALYSIS ═══
Deployment Costs: 2.5 USDC
Storage Costs: $3.00 per month
Total Estimate: 2.5 USDC + $3.00 per month

Cloud Cost Comparison:
  Traditional Cloud: $30.00/month
  Varity L3: $3.00/month
  Monthly Savings: $27.00/month (90%)

═══ RECOMMENDATIONS ═══
1. 💡 Varity L3 Benefits:
     • 90% cost savings compared to traditional cloud
     • Lit Protocol encryption for maximum security
     • Celestia DA for data availability
     • Decentralized infrastructure (no single point of failure)
     • Settlement to Arbitrum One for security
2. 💡 Before Migration:
     • Ensure you have sufficient USDC for gas fees
     • Verify all decimal conversions (USDC uses 6 decimals)
     • Test contract deployments on testnet first
     • Backup all data before starting migration

═══ NEXT STEPS ═══
✅ Migration can proceed. Recommended steps:
   1. Review this report thoroughly
   2. Run pre-flight checks: varity migrate preflight --source-chain 1
   3. Test on testnet first (if available)
   4. Backup all source data
   5. Execute migration: varity migrate s3/gcs --verify
   6. Verify data integrity after migration
   7. Monitor for 24-48 hours after migration
```

---

## CLI Commands Reference

### Chain Verification

```bash
varity migrate verify-chain \
  --source-chain <chainId> \
  [--dest-chain <chainId>] \
  [--source-rpc <url>] \
  [--dest-rpc <url>] \
  [--wallet <address>]
```

### Pre-Flight Checks

```bash
varity migrate preflight \
  --source-chain <chainId> \
  [--dest-chain <chainId>] \
  [--wallet <address>] \
  [--contracts <addresses>] \
  [--source-rpc <url>] \
  [--dest-rpc <url>] \
  [--min-gas <amount>]
```

### List Supported Chains

```bash
varity migrate chains
```

### Generate Migration Report

```bash
varity migrate report \
  --source-chain <chainId> \
  [--dest-chain <chainId>] \
  [--contracts <addresses>] \
  [--wallet <address>] \
  [--source-rpc <url>] \
  [--dest-rpc <url>] \
  [--output <file>] \
  [--format console|json|markdown]
```

---

## Best Practices

### 1. Always Run Pre-Flight Checks

Before any migration, run comprehensive pre-flight checks:

```bash
varity migrate preflight \
  --source-chain 1 \
  --wallet $WALLET_ADDRESS \
  --contracts $CONTRACT_ADDRESSES
```

### 2. Verify Decimal Handling

When migrating to Varity L3, pay special attention to decimal conversions:

- **Ethereum/Arbitrum/etc:** ETH uses 18 decimals
- **Varity L3:** USDC uses 6 decimals

Ensure all amount calculations account for this 12-decimal difference.

### 3. Test on Testnet First

Before mainnet migration, test on Arbitrum Sepolia (testnet):

```bash
varity migrate verify-chain \
  --source-chain 421614 \
  --dest-chain 33529
```

### 4. Check Wallet Gas Balance

Ensure sufficient gas on destination chain:

```bash
varity migrate verify-chain \
  --source-chain 1 \
  --dest-chain 33529 \
  --wallet $WALLET_ADDRESS
```

Minimum recommended: 1.0 USDC on Varity L3

### 5. Verify Contract Compatibility

For smart contract migrations, always verify deployability:

```bash
varity migrate report \
  --source-chain 1 \
  --contracts $CONTRACT_ADDRESSES \
  --format markdown \
  --output compatibility-report.md
```

### 6. Generate Comprehensive Reports

Before migration, generate and review a full report:

```bash
varity migrate report \
  --source-chain 1 \
  --wallet $WALLET_ADDRESS \
  --contracts $CONTRACT_ADDRESSES \
  --format json \
  --output pre-migration-report.json
```

### 7. Monitor After Migration

After successful migration:

1. Run verification again to confirm
2. Monitor gas costs for 24-48 hours
3. Verify data integrity checksums
4. Test all functionality

---

## Troubleshooting

### RPC Connection Failures

If RPC connectivity fails:

```bash
# Test with alternative RPC
varity migrate verify-chain \
  --source-chain 1 \
  --source-rpc https://alternative-rpc.com
```

Common RPC providers:
- **Ethereum:** https://eth.llamarpc.com, https://rpc.ankr.com/eth
- **Arbitrum One:** https://arb1.arbitrum.io/rpc, https://rpc.ankr.com/arbitrum
- **Polygon:** https://polygon-rpc.com, https://rpc.ankr.com/polygon

### Chain ID Mismatch

If chain ID doesn't match:

1. Verify you're using the correct RPC URL
2. Check RPC provider's chain configuration
3. Try an alternative RPC provider

### Insufficient Gas Balance

If wallet doesn't have enough gas:

- **Varity L3:** Acquire USDC (6 decimals)
- Bridge from Arbitrum One to Varity L3
- Minimum recommended: 1.0 USDC

### Contract Size Exceeds Limit

If contract is too large:

1. Review contract optimization opportunities
2. Consider splitting into multiple contracts
3. Use proxy patterns to reduce deployment size

---

## Support

For issues or questions:

- **Documentation:** https://docs.varity.network
- **GitHub Issues:** https://github.com/varity/packages/issues
- **Discord:** https://discord.gg/varity

---

**Powered by Varity** - Decentralized Infrastructure for the Modern Web
