/**
 * varity init - Initialize new template project
 *
 * Creates a new template project with all necessary files
 */

import { Command } from 'commander'
import * as fs from 'fs'
import * as path from 'path'
import { Logger } from '../utils/logger'
import { promptInit } from '../utils/prompts'
import type { TemplateConfig } from '../../core/template'

export const initCommand = new Command('init')
  .description('Initialize a new template project')
  .option('-n, --name <name>', 'Template name')
  .option('-d, --dir <directory>', 'Output directory', '.')
  .action(async (options) => {
    try {
      Logger.header('🚀 Initialize New Varity Template Project')

      // Get template configuration from prompts
      const answers = await promptInit()

      // Parse entities
      const entities = answers.entities
        .split(',')
        .map(e => e.trim())
        .filter(e => e.length > 0)

      // Parse contracts (or auto-generate from entities)
      let contracts: string[]
      if (answers.contracts && answers.contracts.trim().length > 0) {
        contracts = answers.contracts
          .split(',')
          .map(c => c.trim())
          .filter(c => c.length > 0)
      } else {
        // Auto-generate contract names from entities
        contracts = entities.map(entity => {
          const capitalized = entity.charAt(0).toUpperCase() + entity.slice(1)
          return `${capitalized}Registry`
        })
      }

      // Create output directory
      const outputDir = path.join(options.dir, answers.templateName)
      if (fs.existsSync(outputDir)) {
        Logger.error(`Directory ${outputDir} already exists`)
        process.exit(1)
      }

      Logger.step(1, 5, 'Creating project structure...')
      createProjectStructure(outputDir)

      Logger.step(2, 5, 'Generating template configuration...')
      const template = generateTemplateConfig(answers, entities, contracts)
      fs.writeFileSync(
        path.join(outputDir, 'templates', `${answers.templateName}.template.json`),
        JSON.stringify(template, null, 2)
      )

      Logger.step(3, 5, 'Creating environment configuration...')
      generateEnvFile(outputDir, answers)

      Logger.step(4, 5, 'Generating package.json...')
      generatePackageJson(outputDir, answers)

      Logger.step(5, 5, 'Creating README.md...')
      generateReadme(outputDir, answers, entities)

      Logger.newline()
      Logger.success('Template project initialized successfully!')
      Logger.newline()
      Logger.info('Next steps:')
      Logger.code(`  cd ${answers.templateName}`)
      Logger.code(`  npm install`)
      Logger.code(`  npx varity generate contracts`)
      Logger.code(`  npx varity dev --watch`)
      Logger.newline()

    } catch (error) {
      Logger.error(`Failed to initialize project: ${error instanceof Error ? error.message : 'Unknown error'}`)
      process.exit(1)
    }
  })

function createProjectStructure(baseDir: string): void {
  const dirs = [
    baseDir,
    path.join(baseDir, 'contracts'),
    path.join(baseDir, 'contracts', 'abis'),
    path.join(baseDir, 'templates'),
    path.join(baseDir, 'scripts'),
    path.join(baseDir, 'test'),
    path.join(baseDir, 'frontend'),
    path.join(baseDir, 'frontend', 'src')
  ]

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  })

  // Create .gitignore
  const gitignore = `
node_modules
.env
.env.local
dist
build
*.log
.DS_Store
deployments
`.trim()
  fs.writeFileSync(path.join(baseDir, '.gitignore'), gitignore)
}

function generateTemplateConfig(
  answers: any,
  entities: string[],
  contracts: string[]
): TemplateConfig {
  return {
    type: answers.templateName as any,
    name: `${answers.templateName.charAt(0).toUpperCase() + answers.templateName.slice(1)} Business Template`,
    version: '1.0.0',
    description: answers.description,
    contracts: contracts.map((contractName, idx) => ({
      name: contractName,
      description: `${entities[idx]} management contract`,
      abi: `../../contracts/abis/${answers.templateName}/${contractName}.json`,
      addresses: {
        'arbitrum-sepolia': '',
        'arbitrum-l3-testnet': '',
        'arbitrum-l3-mainnet': ''
      },
      required: true
    })),
    entities: entities.map(entity => ({
      name: entity,
      displayName: entity.charAt(0).toUpperCase() + entity.slice(1),
      description: `${entity.charAt(0).toUpperCase() + entity.slice(1)} entity`,
      idField: `${entity}Id`,
      displayField: `${entity}Name`,
      fields: [
        {
          name: `${entity}Id`,
          label: `${entity.charAt(0).toUpperCase() + entity.slice(1)} ID`,
          type: 'string',
          description: `Unique ${entity} identifier`,
          required: true
        },
        {
          name: `${entity}Name`,
          label: `${entity.charAt(0).toUpperCase() + entity.slice(1)} Name`,
          type: 'string',
          description: `${entity.charAt(0).toUpperCase() + entity.slice(1)} name`,
          required: true
        },
        {
          name: 'createdAt',
          label: 'Created At',
          type: 'number',
          description: 'Creation timestamp',
          required: true
        },
        {
          name: 'isActive',
          label: 'Is Active',
          type: 'boolean',
          description: 'Active status',
          required: true
        }
      ]
    })),
    events: [
      {
        name: `${entities[0]}_created`,
        displayName: `${entities[0].charAt(0).toUpperCase() + entities[0].slice(1)} Created`,
        description: `New ${entities[0]} created`,
        category: 'entity'
      }
    ],
    metrics: [
      {
        name: `total_${entities[0]}s`,
        displayName: `Total ${entities[0].charAt(0).toUpperCase() + entities[0].slice(1)}s`,
        description: `Total number of ${entities[0]}s`,
        type: 'count',
        source: 'contract'
      }
    ],
    storage: {
      varityNamespace: `varity-internal-${answers.templateName}`,
      industryNamespace: `industry-${answers.templateName}-rag`,
      customerNamespacePattern: `customer-${answers.templateName}-{company-id}-{data-type}`,
      encryptionEnabled: true,
      litProtocolEnabled: true,
      celestiaDAEnabled: true,
      zkProofsEnabled: true
    },
    api: {
      basePath: `/api/v1/${answers.templateName}`
    },
    features: {
      analytics: true,
      forecasting: true,
      notifications: true,
      export: true,
      cache: true,
      monitoring: true,
      webhooks: true
    }
  }
}

function generateEnvFile(baseDir: string, answers: any): void {
  const envContent = `# Varity SDK Configuration

# Network
VARITY_NETWORK=${answers.network}

# API Configuration
VARITY_API_KEY=
VARITY_API_ENDPOINT=https://api.varity.io

# RPC URLs
ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
ARBITRUM_L3_TESTNET_RPC=
ARBITRUM_L3_MAINNET_RPC=

# Contract Addresses (populated after deployment)
# ${answers.network.toUpperCase().replace(/-/g, '_')} contracts
# Add your contract addresses here after deployment

# Storage Configuration
PINATA_API_KEY=
CELESTIA_TESTNET_RPC=https://rpc-mocha.pops.one

# Private Key (NEVER commit this!)
PRIVATE_KEY=
`
  fs.writeFileSync(path.join(baseDir, '.env.example'), envContent)
}

function generatePackageJson(baseDir: string, answers: any): void {
  const packageJson = {
    name: `varity-${answers.templateName}-template`,
    version: '1.0.0',
    description: answers.description,
    scripts: {
      'generate:contracts': 'varity generate contracts',
      'generate:types': 'varity generate types',
      'generate:tests': 'varity generate tests',
      'dev': 'varity dev --watch',
      'validate': 'varity validate',
      'test': 'hardhat test',
      'deploy:sepolia': 'hardhat run scripts/deploy.ts --network arbitrum-sepolia',
      'deploy:testnet': 'hardhat run scripts/deploy.ts --network arbitrum-l3-testnet',
      'deploy:mainnet': 'hardhat run scripts/deploy.ts --network arbitrum-l3-mainnet'
    },
    dependencies: {
      '@varity-labs/sdk': '^2.0.0-beta.1',
      'ethers': '^6.9.0'
    },
    devDependencies: {
      '@nomicfoundation/hardhat-toolbox': '^4.0.0',
      'hardhat': '^2.19.0',
      'typescript': '^5.0.0'
    }
  }
  fs.writeFileSync(path.join(baseDir, 'package.json'), JSON.stringify(packageJson, null, 2))
}

function generateReadme(baseDir: string, answers: any, entities: string[]): void {
  const readme = `# ${answers.templateName.charAt(0).toUpperCase() + answers.templateName.slice(1)} Template

${answers.description}

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Generate smart contracts
npm run generate:contracts

# Start development mode (hot-reload)
npm run dev

# Validate template configuration
npm run validate
\`\`\`

## Business Entities

${entities.map(e => `- **${e.charAt(0).toUpperCase() + e.slice(1)}**: ${e} management`).join('\n')}

## Smart Contracts

Contracts will be generated in \`contracts/\` directory when you run:

\`\`\`bash
npm run generate:contracts
\`\`\`

## Testing

Deploy and test on Arbitrum Sepolia before production:

\`\`\`bash
# Deploy to testnet
npm run deploy:sepolia

# Run tests
npm test
\`\`\`

## Production Deployment

When ready for production:

\`\`\`bash
# Deploy to mainnet
npm run deploy:mainnet
\`\`\`

## Documentation

- [Varity SDK Documentation](https://docs.varity.com)
- [Template Guide](https://docs.varity.com/templates)
- [Quick Start Guide](../../docs/QUICK_START_TEMPLATE.md)

## Support

- Discord: https://discord.gg/varity
- Email: support@varity.com
`
  fs.writeFileSync(path.join(baseDir, 'README.md'), readme)
}
