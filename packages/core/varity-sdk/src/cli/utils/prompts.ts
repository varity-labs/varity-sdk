/**
 * CLI Prompt Utilities
 *
 * Interactive prompt helpers for CLI commands
 */

import inquirer from 'inquirer'

export interface InitPromptAnswers {
  templateName: string
  description: string
  network: string
  entities: string
  contracts: string
}

export interface GenerateContractsPromptAnswers {
  templatePath: string
  outputPath: string
  includeTests: boolean
}

export async function promptInit(): Promise<InitPromptAnswers> {
  return await inquirer.prompt([
    {
      type: 'input',
      name: 'templateName',
      message: 'Template name (e.g., healthcare, finance):',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return 'Template name is required'
        }
        if (!/^[a-z][a-z0-9-]*$/.test(input)) {
          return 'Template name must be lowercase letters, numbers, and hyphens only'
        }
        return true
      }
    },
    {
      type: 'input',
      name: 'description',
      message: 'Template description:',
      default: 'Business template powered by Varity'
    },
    {
      type: 'list',
      name: 'network',
      message: 'Default network:',
      choices: [
        { name: 'Arbitrum Sepolia (Testnet)', value: 'arbitrum-sepolia' },
        { name: 'Arbitrum L3 Testnet', value: 'arbitrum-l3-testnet' },
        { name: 'Arbitrum L3 Mainnet', value: 'arbitrum-l3-mainnet' }
      ],
      default: 'arbitrum-sepolia'
    },
    {
      type: 'input',
      name: 'entities',
      message: 'Business entities (comma-separated, e.g., patient,appointment):',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return 'At least one entity is required'
        }
        const entities = input.split(',').map(e => e.trim())
        for (const entity of entities) {
          if (!/^[a-z][a-z0-9_]*$/.test(entity)) {
            return `Invalid entity name: ${entity}. Use lowercase letters, numbers, and underscores only`
          }
        }
        return true
      }
    },
    {
      type: 'input',
      name: 'contracts',
      message: 'Contract names (comma-separated, leave empty for auto-generation):',
      default: ''
    }
  ])
}

export async function promptGenerateContracts(): Promise<GenerateContractsPromptAnswers> {
  return await inquirer.prompt([
    {
      type: 'input',
      name: 'templatePath',
      message: 'Path to template JSON file:',
      default: './templates/template.json',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return 'Template path is required'
        }
        return true
      }
    },
    {
      type: 'input',
      name: 'outputPath',
      message: 'Output directory for contracts:',
      default: './contracts'
    },
    {
      type: 'confirm',
      name: 'includeTests',
      message: 'Generate test files?',
      default: true
    }
  ])
}

export async function confirmAction(message: string, defaultValue: boolean = false): Promise<boolean> {
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message,
      default: defaultValue
    }
  ])
  return confirmed
}
