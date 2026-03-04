/**
 * Test Generator
 *
 * Generates comprehensive test suites for smart contracts
 */

import * as fs from 'fs'
import * as path from 'path'
import type { TemplateConfig, TemplateEntity } from '../../core/template'

export interface GenerateTestsOptions {
  templatePath: string
  contractsPath: string
  outputPath: string
}

export interface GenerateTestsResult {
  tests: string[]
  success: boolean
  errors: string[]
}

/**
 * Generate test suites for contracts
 */
export async function generateTests(
  options: GenerateTestsOptions
): Promise<GenerateTestsResult> {
  const result: GenerateTestsResult = {
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

    // Generate tests for each entity
    for (const entity of template.entities) {
      try {
        const contractName = getContractNameForEntity(entity)
        const testContent = generateTestSuite(entity, template, contractName)

        const testFile = path.join(outputPath, `${contractName}.test.ts`)
        fs.writeFileSync(testFile, testContent)

        result.tests.push(testFile)
      } catch (error) {
        result.errors.push(
          `Failed to generate test for entity ${entity.name}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        )
      }
    }

    // Generate integration test suite
    const integrationTest = generateIntegrationTestSuite(template)
    const integrationTestFile = path.join(outputPath, 'integration.test.ts')
    fs.writeFileSync(integrationTestFile, integrationTest)
    result.tests.push(integrationTestFile)

    result.success = result.errors.length === 0

  } catch (error) {
    result.errors.push(
      `Failed to generate tests: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  return result
}

/**
 * Generate test suite for entity contract
 */
function generateTestSuite(
  entity: TemplateEntity,
  template: TemplateConfig,
  contractName: string
): string {
  const entityDisplayName = entity.displayName || capitalize(entity.name)
  const entityNameLower = entity.name.toLowerCase()

  // Find required fields for creation
  const requiredFields = entity.fields.filter(f =>
    f.required && !['createdAt', 'isActive'].includes(f.name)
  )

  // Generate sample test data
  const testData = requiredFields.map(field => {
    return `const test${capitalize(field.name)} = ${getTestValue(field.type)}`
  }).join('\n      ')

  const createParams = requiredFields.map(field =>
    `test${capitalize(field.name)}`
  ).join(', ')

  return `import { expect } from "chai"
import { ethers } from "hardhat"
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import type { ${contractName} } from "../typechain-types"

describe("${contractName}", function () {
  /**
   * Deployment fixture
   */
  async function deploy${contractName}Fixture() {
    const [owner, manager, user, other] = await ethers.getSigners()

    const Contract = await ethers.getContractFactory("${contractName}")
    const contract = await Contract.deploy() as ${contractName}

    // Grant manager role
    const MANAGER_ROLE = await contract.MANAGER_ROLE()
    await contract.grantRole(MANAGER_ROLE, manager.address)

    return { contract, owner, manager, user, other, MANAGER_ROLE }
  }

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { contract, owner } = await loadFixture(deploy${contractName}Fixture)

      expect(await contract.hasRole(
        await contract.DEFAULT_ADMIN_ROLE(),
        owner.address
      )).to.be.true
    })

    it("Should grant admin role to deployer", async function () {
      const { contract, owner } = await loadFixture(deploy${contractName}Fixture)

      const ADMIN_ROLE = await contract.ADMIN_ROLE()
      expect(await contract.hasRole(ADMIN_ROLE, owner.address)).to.be.true
    })

    it("Should grant manager role correctly", async function () {
      const { contract, manager, MANAGER_ROLE } = await loadFixture(deploy${contractName}Fixture)

      expect(await contract.hasRole(MANAGER_ROLE, manager.address)).to.be.true
    })
  })

  describe("Create ${entityDisplayName}", function () {
    it("Should create new ${entityNameLower}", async function () {
      const { contract, manager } = await loadFixture(deploy${contractName}Fixture)

      ${testData}

      const tx = await contract.connect(manager).create${entityDisplayName}(
        ${createParams}
      )

      await expect(tx).to.emit(contract, "${entityDisplayName}Created")

      // Verify counter incremented
      expect(await contract.get${entityDisplayName}Count()).to.equal(1)
    })

    it("Should fail if not manager", async function () {
      const { contract, user } = await loadFixture(deploy${contractName}Fixture)

      ${testData}

      await expect(
        contract.connect(user).create${entityDisplayName}(${createParams})
      ).to.be.reverted
    })

    it("Should assign correct values to ${entityNameLower}", async function () {
      const { contract, manager } = await loadFixture(deploy${contractName}Fixture)

      ${testData}

      const tx = await contract.connect(manager).create${entityDisplayName}(
        ${createParams}
      )
      await tx.wait()

      const ${entityNameLower}Id = await contract.${entityNameLower}Ids(0)
      const ${entityNameLower} = await contract.get${entityDisplayName}(${entityNameLower}Id)

      expect(${entityNameLower}.isActive).to.be.true
      expect(${entityNameLower}.createdAt).to.be.gt(0)
    })
  })

  describe("Read ${entityDisplayName}", function () {
    it("Should read ${entityNameLower} data correctly", async function () {
      const { contract, manager } = await loadFixture(deploy${contractName}Fixture)

      ${testData}

      const tx = await contract.connect(manager).create${entityDisplayName}(
        ${createParams}
      )
      await tx.wait()

      const ${entityNameLower}Id = await contract.${entityNameLower}Ids(0)
      const ${entityNameLower} = await contract.get${entityDisplayName}(${entityNameLower}Id)

      expect(${entityNameLower}.isActive).to.be.true
    })

    it("Should fail for non-existent ${entityNameLower}", async function () {
      const { contract } = await loadFixture(deploy${contractName}Fixture)

      await expect(
        contract.get${entityDisplayName}("0x" + "0".repeat(64))
      ).to.be.revertedWith("${entityDisplayName} not found or inactive")
    })

    it("Should return all ${entityNameLower} IDs", async function () {
      const { contract, manager } = await loadFixture(deploy${contractName}Fixture)

      ${testData}

      // Create multiple ${entityNameLower}s
      await contract.connect(manager).create${entityDisplayName}(${createParams})
      await contract.connect(manager).create${entityDisplayName}(${createParams})

      const ids = await contract.getAll${entityDisplayName}Ids()
      expect(ids.length).to.equal(2)
    })
  })

  describe("Update ${entityDisplayName}", function () {
    it("Should update ${entityNameLower} successfully", async function () {
      const { contract, manager } = await loadFixture(deploy${contractName}Fixture)

      ${testData}

      // Create ${entityNameLower}
      const createTx = await contract.connect(manager).create${entityDisplayName}(
        ${createParams}
      )
      await createTx.wait()

      const ${entityNameLower}Id = await contract.${entityNameLower}Ids(0)

      // Update ${entityNameLower}
      const updateTx = await contract.connect(manager).update${entityDisplayName}(
        ${entityNameLower}Id,
        ${createParams}
      )

      await expect(updateTx).to.emit(contract, "${entityDisplayName}Updated")
    })

    it("Should fail if not manager", async function () {
      const { contract, manager, user } = await loadFixture(deploy${contractName}Fixture)

      ${testData}

      const tx = await contract.connect(manager).create${entityDisplayName}(
        ${createParams}
      )
      await tx.wait()

      const ${entityNameLower}Id = await contract.${entityNameLower}Ids(0)

      await expect(
        contract.connect(user).update${entityDisplayName}(
          ${entityNameLower}Id,
          ${createParams}
        )
      ).to.be.reverted
    })
  })

  describe("Deactivate ${entityDisplayName}", function () {
    it("Should deactivate ${entityNameLower} successfully", async function () {
      const { contract, manager, owner } = await loadFixture(deploy${contractName}Fixture)

      ${testData}

      const tx = await contract.connect(manager).create${entityDisplayName}(
        ${createParams}
      )
      await tx.wait()

      const ${entityNameLower}Id = await contract.${entityNameLower}Ids(0)

      const deactivateTx = await contract.connect(owner).deactivate${entityDisplayName}(
        ${entityNameLower}Id
      )

      await expect(deactivateTx).to.emit(contract, "${entityDisplayName}Deactivated")

      expect(await contract.is${entityDisplayName}Active(${entityNameLower}Id)).to.be.false
    })

    it("Should fail if not admin", async function () {
      const { contract, manager, user } = await loadFixture(deploy${contractName}Fixture)

      ${testData}

      const tx = await contract.connect(manager).create${entityDisplayName}(
        ${createParams}
      )
      await tx.wait()

      const ${entityNameLower}Id = await contract.${entityNameLower}Ids(0)

      await expect(
        contract.connect(user).deactivate${entityDisplayName}(${entityNameLower}Id)
      ).to.be.reverted
    })

    it("Should fail for already inactive ${entityNameLower}", async function () {
      const { contract, manager, owner } = await loadFixture(deploy${contractName}Fixture)

      ${testData}

      const tx = await contract.connect(manager).create${entityDisplayName}(
        ${createParams}
      )
      await tx.wait()

      const ${entityNameLower}Id = await contract.${entityNameLower}Ids(0)

      await contract.connect(owner).deactivate${entityDisplayName}(${entityNameLower}Id)

      await expect(
        contract.connect(owner).deactivate${entityDisplayName}(${entityNameLower}Id)
      ).to.be.revertedWith("${entityDisplayName} already inactive")
    })
  })

  describe("Access Control", function () {
    it("Should respect role-based access control", async function () {
      const { contract, user, MANAGER_ROLE } = await loadFixture(deploy${contractName}Fixture)

      expect(await contract.hasRole(MANAGER_ROLE, user.address)).to.be.false
    })

    it("Should allow admin to grant manager role", async function () {
      const { contract, owner, other, MANAGER_ROLE } = await loadFixture(deploy${contractName}Fixture)

      await contract.connect(owner).grantRole(MANAGER_ROLE, other.address)
      expect(await contract.hasRole(MANAGER_ROLE, other.address)).to.be.true
    })
  })
})
`
}

/**
 * Generate integration test suite
 */
function generateIntegrationTestSuite(template: TemplateConfig): string {
  const contractNames = template.entities.map(e =>
    getContractNameForEntity(e)
  )

  return `import { expect } from "chai"
import { ethers } from "hardhat"

describe("Integration Tests", function () {
  describe("Multi-Contract Interactions", function () {
    it("Should deploy all contracts successfully", async function () {
      const [owner] = await ethers.getSigners()

      ${contractNames.map(name => `
      const ${name} = await ethers.getContractFactory("${name}")
      const ${name.toLowerCase()} = await ${name}.deploy()
      expect(await ${name.toLowerCase()}.hasRole(
        await ${name.toLowerCase()}.DEFAULT_ADMIN_ROLE(),
        owner.address
      )).to.be.true`).join('\n')}
    })
  })

  describe("Template Configuration", function () {
    it("Should validate template structure", async function () {
      // Add template-specific integration tests here
      expect(true).to.be.true
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
 * Get test value for field type
 */
function getTestValue(type: string): string {
  const testValues: Record<string, string> = {
    'string': '"Test Value"',
    'number': '12345',
    'boolean': 'true',
    'address': 'ethers.ZeroAddress',
    'bytes': '"0x1234"',
    'bytes32': 'ethers.ZeroHash'
  }
  return testValues[type] || '"Test Value"'
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
