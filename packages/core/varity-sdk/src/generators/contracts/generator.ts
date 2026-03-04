/**
 * Contract Generator
 *
 * Generates Solidity smart contracts from template configuration
 */

import * as fs from 'fs'
import * as path from 'path'
import Handlebars from 'handlebars'
import type { TemplateConfig, TemplateEntity } from '../../core/template'

export interface GenerateContractsOptions {
  templatePath: string
  outputPath: string
  includeTests?: boolean
}

export interface GenerateContractsResult {
  contracts: string[]
  tests: string[]
  success: boolean
  errors: string[]
}

/**
 * Generate smart contracts from template configuration
 */
export async function generateContracts(
  options: GenerateContractsOptions
): Promise<GenerateContractsResult> {
  const result: GenerateContractsResult = {
    contracts: [],
    tests: [],
    success: false,
    errors: []
  }

  try {
    // Load template configuration
    const templatePath = path.resolve(options.templatePath)
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`)
    }

    const templateContent = fs.readFileSync(templatePath, 'utf-8')
    const template: TemplateConfig = JSON.parse(templateContent)

    // Create output directory
    const outputPath = path.resolve(options.outputPath)
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true })
    }

    // Load Handlebars template
    const templatesDir = path.join(__dirname, 'templates')
    const registryTemplate = fs.readFileSync(
      path.join(templatesDir, 'registry.sol.hbs'),
      'utf-8'
    )
    const compiledTemplate = Handlebars.compile(registryTemplate)

    // Generate contracts for each entity
    for (const entity of template.entities) {
      try {
        const contractCode = generateContractForEntity(entity, template, compiledTemplate)
        const contractName = getContractNameForEntity(entity)
        const contractFile = path.join(outputPath, `${contractName}.sol`)

        fs.writeFileSync(contractFile, contractCode)
        result.contracts.push(contractFile)

        // Generate test file if requested
        if (options.includeTests) {
          const testCode = generateTestForEntity(entity, template, contractName)
          const testFile = path.join(
            path.dirname(outputPath),
            'test',
            `${contractName}.test.ts`
          )

          // Create test directory if needed
          const testDir = path.dirname(testFile)
          if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true })
          }

          fs.writeFileSync(testFile, testCode)
          result.tests.push(testFile)
        }
      } catch (error) {
        result.errors.push(
          `Failed to generate contract for entity ${entity.name}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        )
      }
    }

    result.success = result.errors.length === 0

  } catch (error) {
    result.errors.push(
      `Failed to generate contracts: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  return result
}

/**
 * Generate contract code for a single entity
 */
function generateContractForEntity(
  entity: TemplateEntity,
  template: TemplateConfig,
  compiledTemplate: HandlebarsTemplateDelegate
): string {
  const contractName = getContractNameForEntity(entity)
  const entityStructName = capitalize(entity.name)
  const entityDisplayName = entity.displayName || capitalize(entity.name)
  const entityNameLower = entity.name.toLowerCase()

  // Find ID field
  const idField = entity.fields.find(f => f.name === entity.idField) || entity.fields[0]
  const idFieldType = mapTypeToSolidity(idField.type)

  // Prepare template data
  const templateData = {
    contractName,
    entityName: entity.name,
    entityStructName,
    entityDisplayName,
    entityNameLower,
    description: entity.description || `${entityDisplayName} registry contract`,
    templateName: template.name,
    timestamp: new Date().toISOString(),
    idField: entity.idField,
    idFieldType,
    fields: entity.fields.map(field => ({
      name: field.name,
      type: mapTypeToSolidity(field.type),
      description: field.description || field.name
    })),
    createParams: entity.fields
      .filter(f => f.required && !['createdAt', 'isActive'].includes(f.name))
      .map(field => ({
        name: field.name,
        type: mapTypeToSolidity(field.type),
        description: field.description || field.name,
        isMemory: needsMemoryKeyword(field.type)
      })),
    fieldAssignments: entity.fields.map(field => ({
      name: field.name,
      value: getFieldAssignmentValue(field)
    })),
    updateParams: [
      {
        name: entity.idField,
        type: idFieldType,
        description: `The ${entity.name} ID`,
        isMemory: false
      },
      ...entity.fields
        .filter(f => !['createdAt', 'isActive', entity.idField].includes(f.name))
        .map(field => ({
          name: field.name,
          type: mapTypeToSolidity(field.type),
          description: field.description || field.name,
          isMemory: needsMemoryKeyword(field.type)
        }))
    ],
    updateAssignments: entity.fields
      .filter(f => !['createdAt', 'isActive', entity.idField].includes(f.name))
      .map(field => ({
        name: field.name,
        value: field.name
      })),
    generateId: idFieldType === 'bytes32'
      ? `keccak256(abi.encodePacked(${entity.fields.filter(f => f.name !== entity.idField && f.required).map(f => f.name).join(', ')}, block.timestamp))`
      : '_${entityNameLower}Counter.current()'
  }

  return compiledTemplate(templateData)
}

/**
 * Generate test file for entity contract
 */
function generateTestForEntity(
  entity: TemplateEntity,
  template: TemplateConfig,
  contractName: string
): string {
  const entityDisplayName = entity.displayName || capitalize(entity.name)

  return `import { expect } from "chai"
import { ethers } from "hardhat"
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"

describe("${contractName}", function () {
  async function deploy${contractName}Fixture() {
    const [owner, manager, user] = await ethers.getSigners()

    const Contract = await ethers.getContractFactory("${contractName}")
    const contract = await Contract.deploy()

    // Grant manager role
    const MANAGER_ROLE = await contract.MANAGER_ROLE()
    await contract.grantRole(MANAGER_ROLE, manager.address)

    return { contract, owner, manager, user }
  }

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { contract, owner } = await loadFixture(deploy${contractName}Fixture)
      expect(await contract.hasRole(await contract.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true
    })
  })

  describe("Create ${entityDisplayName}", function () {
    it("Should create new ${entity.name}", async function () {
      const { contract, manager } = await loadFixture(deploy${contractName}Fixture)

      // TODO: Add test parameters based on entity fields
      // const tx = await contract.connect(manager).create${entityDisplayName}(...)
      // expect(tx).to.emit(contract, "${entityDisplayName}Created")
    })

    it("Should fail if not manager", async function () {
      const { contract, user } = await loadFixture(deploy${contractName}Fixture)

      // TODO: Add test logic
    })
  })

  describe("Read ${entityDisplayName}", function () {
    it("Should read ${entity.name} data", async function () {
      const { contract } = await loadFixture(deploy${contractName}Fixture)

      // TODO: Add test logic
    })
  })

  describe("Update ${entityDisplayName}", function () {
    it("Should update ${entity.name}", async function () {
      const { contract, manager } = await loadFixture(deploy${contractName}Fixture)

      // TODO: Add test logic
    })
  })

  describe("Deactivate ${entityDisplayName}", function () {
    it("Should deactivate ${entity.name}", async function () {
      const { contract, owner } = await loadFixture(deploy${contractName}Fixture)

      // TODO: Add test logic
    })
  })
})
`
}

/**
 * Get contract name for entity
 */
function getContractNameForEntity(entity: TemplateEntity): string {
  const baseName = capitalize(entity.name)
  return `${baseName}Registry`
}

/**
 * Map template field types to Solidity types
 */
function mapTypeToSolidity(type: string): string {
  const typeMap: Record<string, string> = {
    'string': 'string',
    'number': 'uint256',
    'boolean': 'bool',
    'address': 'address',
    'bytes': 'bytes',
    'bytes32': 'bytes32'
  }
  return typeMap[type] || 'string'
}

/**
 * Check if type needs memory keyword
 */
function needsMemoryKeyword(type: string): boolean {
  return ['string', 'bytes'].includes(type)
}

/**
 * Get field assignment value
 */
function getFieldAssignmentValue(field: any): string {
  if (field.name === 'createdAt') {
    return 'block.timestamp'
  }
  if (field.name === 'isActive') {
    return 'true'
  }
  return field.name
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
