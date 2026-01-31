/**
 * varity clone - Clone existing template
 *
 * Quickly create new template from existing one
 */

import { Command } from 'commander'
import * as fs from 'fs'
import * as path from 'path'
import { Logger } from '../utils/logger'
import inquirer from 'inquirer'
import type { TemplateConfig } from '../../core/template'

export const cloneCommand = new Command('clone')
  .description('Clone an existing template to create a new one')
  .option('--from <template>', 'Source template name')
  .option('--to <name>', 'New template name')
  .option('-d, --dir <directory>', 'Output directory', '.')
  .action(async (options) => {
    try {
      Logger.header('📋 Clone Template')

      // Get source and destination if not provided
      let sourceTemplate = options.from
      let newTemplateName = options.to

      if (!sourceTemplate || !newTemplateName) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'sourceTemplate',
            message: 'Source template to clone from (e.g., iso, healthcare):',
            when: !sourceTemplate,
            validate: (input: string) => {
              if (!input || input.trim().length === 0) {
                return 'Source template is required'
              }
              return true
            }
          },
          {
            type: 'input',
            name: 'newTemplateName',
            message: 'New template name:',
            when: !newTemplateName,
            validate: (input: string) => {
              if (!input || input.trim().length === 0) {
                return 'New template name is required'
              }
              if (!/^[a-z][a-z0-9-]*$/.test(input)) {
                return 'Template name must be lowercase letters, numbers, and hyphens only'
              }
              return true
            }
          }
        ])

        sourceTemplate = sourceTemplate || answers.sourceTemplate
        newTemplateName = newTemplateName || answers.newTemplateName
      }

      const outputDir = path.join(options.dir, newTemplateName)

      // Check if output directory already exists
      if (fs.existsSync(outputDir)) {
        Logger.error(`Directory ${outputDir} already exists`)
        process.exit(1)
      }

      Logger.step(1, 5, `Locating source template: ${sourceTemplate}...`)

      // Find source template
      const sourceTemplatePath = findSourceTemplate(sourceTemplate)
      if (!sourceTemplatePath) {
        Logger.error(`Source template "${sourceTemplate}" not found`)
        Logger.info('Available templates in SDK:')
        Logger.code('  - iso')
        Logger.newline()
        process.exit(1)
      }

      Logger.step(2, 5, 'Copying template structure...')

      // Create output directory
      fs.mkdirSync(outputDir, { recursive: true })

      // Copy and transform template JSON
      const templateJson = loadAndTransformTemplate(
        path.join(sourceTemplatePath, `${sourceTemplate}.template.json`),
        sourceTemplate,
        newTemplateName
      )

      // Create project structure
      createProjectStructure(outputDir)

      // Write transformed template
      const templatesDir = path.join(outputDir, 'templates')
      fs.mkdirSync(templatesDir, { recursive: true })
      fs.writeFileSync(
        path.join(templatesDir, `${newTemplateName}.template.json`),
        JSON.stringify(templateJson, null, 2)
      )

      Logger.step(3, 5, 'Generating environment configuration...')
      generateEnvFile(outputDir, newTemplateName, templateJson.api?.basePath)

      Logger.step(4, 5, 'Creating package.json...')
      generatePackageJson(outputDir, newTemplateName, templateJson.description)

      Logger.step(5, 5, 'Creating README.md...')
      generateReadme(outputDir, newTemplateName, templateJson)

      Logger.newline()
      Logger.success(`Template cloned successfully from "${sourceTemplate}" to "${newTemplateName}"!`)
      Logger.newline()
      Logger.info('Next steps:')
      Logger.code(`  cd ${newTemplateName}`)
      Logger.code(`  npm install`)
      Logger.code(`  # Edit templates/${newTemplateName}.template.json to customize entities`)
      Logger.code(`  varity generate contracts`)
      Logger.code(`  varity generate ui`)
      Logger.code(`  varity generate dashboard`)
      Logger.code(`  varity dev --watch`)
      Logger.newline()

    } catch (error) {
      Logger.error(`Failed to clone template: ${error instanceof Error ? error.message : 'Unknown error'}`)
      process.exit(1)
    }
  })

/**
 * Find source template in SDK
 */
function findSourceTemplate(templateName: string): string | null {
  // Check in SDK templates directory
  const sdkTemplatesPath = path.join(__dirname, '..', '..', '..', 'templates')
  const templatePath = path.join(sdkTemplatesPath, `${templateName}.template.json`)

  if (fs.existsSync(templatePath)) {
    return sdkTemplatesPath
  }

  return null
}

/**
 * Load and transform template JSON
 */
function loadAndTransformTemplate(
  sourcePath: string,
  sourceTemplate: string,
  newTemplate: string
): TemplateConfig {
  const content = fs.readFileSync(sourcePath, 'utf-8')
  const template: TemplateConfig = JSON.parse(content)

  // Transform template
  template.type = newTemplate as any
  template.name = `${capitalize(newTemplate)} Business Template`
  template.description = `${capitalize(newTemplate)} business template (cloned from ${sourceTemplate})`

  // Update storage namespaces
  if (template.storage) {
    if (template.storage.varityNamespace) {
      template.storage.varityNamespace = template.storage.varityNamespace.replace(
        sourceTemplate,
        newTemplate
      )
    }
    if (template.storage.industryNamespace) {
      template.storage.industryNamespace = template.storage.industryNamespace.replace(
        sourceTemplate,
        newTemplate
      )
    }
    if (template.storage.customerNamespacePattern) {
      template.storage.customerNamespacePattern = template.storage.customerNamespacePattern.replace(
        sourceTemplate,
        newTemplate
      )
    }
  }

  // Update API base path
  if (template.api) {
    template.api.basePath = `/api/v1/${newTemplate}`
  }

  // Update contract ABIs paths (only if they're strings)
  if (template.contracts) {
    template.contracts = template.contracts.map(contract => ({
      ...contract,
      abi: typeof contract.abi === 'string'
        ? contract.abi.replace(sourceTemplate, newTemplate)
        : contract.abi
    }))
  }

  return template
}

/**
 * Create project structure
 */
function createProjectStructure(baseDir: string): void {
  const dirs = [
    path.join(baseDir, 'contracts'),
    path.join(baseDir, 'contracts', 'abis'),
    path.join(baseDir, 'templates'),
    path.join(baseDir, 'scripts'),
    path.join(baseDir, 'test'),
    path.join(baseDir, 'src'),
    path.join(baseDir, 'src', 'components'),
    path.join(baseDir, 'src', 'hooks'),
    path.join(baseDir, 'src', 'services')
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
cache
artifacts
typechain-types
`.trim()
  fs.writeFileSync(path.join(baseDir, '.gitignore'), gitignore)
}

/**
 * Generate .env.example file
 */
function generateEnvFile(baseDir: string, templateName: string, basePath?: string): void {
  const envContent = `# Varity SDK Configuration

# Network
VARITY_NETWORK=arbitrum-sepolia

# API Configuration
VARITY_API_KEY=
VARITY_API_ENDPOINT=https://api.varity.io${basePath || `/api/v1/${templateName}`}

# RPC URLs
ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
ARBITRUM_L3_TESTNET_RPC=
ARBITRUM_L3_MAINNET_RPC=

# Contract Addresses (populated after deployment)
# Arbitrum Sepolia contracts
# Add your contract addresses here after deployment

# Storage Configuration
PINATA_API_KEY=
CELESTIA_TESTNET_RPC=https://rpc-mocha.pops.one

# Private Key (NEVER commit this!)
PRIVATE_KEY=
`
  fs.writeFileSync(path.join(baseDir, '.env.example'), envContent)
}

/**
 * Generate package.json
 */
function generatePackageJson(baseDir: string, templateName: string, description?: string): void {
  const packageJson = {
    name: `varity-${templateName}-template`,
    version: '1.0.0',
    description: description || `Varity ${capitalize(templateName)} template`,
    scripts: {
      'generate:contracts': 'varity generate contracts',
      'generate:ui': 'varity generate ui',
      'generate:dashboard': 'varity generate dashboard',
      'generate:types': 'varity generate types',
      'generate:tests': 'varity generate tests',
      'generate:all': 'npm run generate:contracts && npm run generate:ui && npm run generate:dashboard && npm run generate:types',
      'dev': 'varity dev --watch',
      'validate': 'varity validate',
      'test': 'hardhat test',
      'deploy:sepolia': 'varity deploy --network arbitrum-sepolia',
      'deploy:testnet': 'varity deploy --network arbitrum-l3-testnet',
      'deploy:mainnet': 'varity deploy --network arbitrum-l3-mainnet',
      'start': 'react-scripts start',
      'build': 'react-scripts build'
    },
    dependencies: {
      '@varity-labs/sdk': '^2.0.0-beta.1',
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      'react-scripts': '^5.0.1',
      'ethers': '^6.9.0',
      '@mui/material': '^5.15.0',
      '@mui/icons-material': '^5.15.0',
      '@emotion/react': '^11.11.0',
      '@emotion/styled': '^11.11.0'
    },
    devDependencies: {
      '@nomicfoundation/hardhat-toolbox': '^4.0.0',
      'hardhat': '^2.19.0',
      'typescript': '^5.0.0',
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0'
    }
  }
  fs.writeFileSync(path.join(baseDir, 'package.json'), JSON.stringify(packageJson, null, 2))
}

/**
 * Generate README.md
 */
function generateReadme(baseDir: string, templateName: string, template: TemplateConfig): void {
  const entityNames = template.entities?.map(e => e.displayName || capitalize(e.name)).join(', ') || 'entities'

  const readme = `# ${capitalize(templateName)} Template

${template.description || `Business template for ${capitalize(templateName)}`}

**Business Entities**: ${entityNames}

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Generate all code
npm run generate:all

# Start development mode (hot-reload)
npm run dev

# Validate template configuration
npm run validate
\`\`\`

## Development Workflow

### 1. Customize Template

Edit \`templates/${templateName}.template.json\` to define your business entities:

\`\`\`json
{
  "entities": [
    {
      "name": "customer",
      "fields": [
        { "name": "customerId", "type": "string", "required": true },
        { "name": "email", "type": "string", "required": true }
      ]
    }
  ]
}
\`\`\`

### 2. Generate Code

\`\`\`bash
# Generate smart contracts
npm run generate:contracts

# Generate UI components (CRUD interfaces)
npm run generate:ui

# Generate dashboard layouts
npm run generate:dashboard

# Generate TypeScript types
npm run generate:types

# Or generate everything at once
npm run generate:all
\`\`\`

### 3. Test & Deploy

\`\`\`bash
# Test on Arbitrum Sepolia
npm run deploy:sepolia

# Run tests
npm test

# Deploy to mainnet
npm run deploy:mainnet
\`\`\`

## Generated Structure

After running \`npm run generate:all\`:

\`\`\`
${templateName}/
├── contracts/              # Generated Solidity contracts
├── src/
│   ├── components/
│   │   ├── entities/      # Generated CRUD components
│   │   └── dashboards/    # Generated dashboard layouts
│   ├── hooks/             # React hooks for SDK
│   └── services/          # API service layer
├── test/                  # Generated test suites
└── templates/             # Template configuration
\`\`\`

## Features

- ✅ Automated smart contract generation
- ✅ Complete CRUD UI components
- ✅ Dashboard layouts with KPIs and charts
- ✅ TypeScript type safety
- ✅ Comprehensive test coverage
- ✅ Hot-reload development mode
- ✅ One-command deployment

## Documentation

- [Varity SDK Documentation](https://docs.varity.com)
- [CLI Guide](https://docs.varity.com/cli)
- [Template Guide](https://docs.varity.com/templates)

## Support

- Discord: https://discord.gg/varity
- Email: support@varity.com
`
  fs.writeFileSync(path.join(baseDir, 'README.md'), readme)
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
