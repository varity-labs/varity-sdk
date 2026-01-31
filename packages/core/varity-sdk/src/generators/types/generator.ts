/**
 * TypeScript Type Generator
 *
 * Generates TypeScript type definitions from contract ABIs
 */

import * as fs from 'fs'
import * as path from 'path'

export interface GenerateTypesOptions {
  abiDir: string
  outputPath: string
}

export interface GenerateTypesResult {
  types: string[]
  success: boolean
  errors: string[]
}

/**
 * Generate TypeScript types from contract ABIs
 */
export async function generateTypes(
  options: GenerateTypesOptions
): Promise<GenerateTypesResult> {
  const result: GenerateTypesResult = {
    types: [],
    success: false,
    errors: []
  }

  try {
    // Check if ABI directory exists
    if (!fs.existsSync(options.abiDir)) {
      throw new Error(`ABI directory not found: ${options.abiDir}`)
    }

    // Create output directory
    const outputPath = path.resolve(options.outputPath)
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true })
    }

    // Find all ABI files
    const abiFiles = findABIFiles(options.abiDir)

    if (abiFiles.length === 0) {
      result.errors.push('No ABI files found in directory')
      return result
    }

    // Generate types for each ABI
    for (const abiFile of abiFiles) {
      try {
        const abiContent = fs.readFileSync(abiFile, 'utf-8')
        const abi = JSON.parse(abiContent)

        const contractName = path.basename(abiFile, '.json')
        const typeDefinition = generateTypeDefinitionFromABI(contractName, abi)

        const typeFile = path.join(outputPath, `${contractName}.ts`)
        fs.writeFileSync(typeFile, typeDefinition)

        result.types.push(typeFile)
      } catch (error) {
        result.errors.push(
          `Failed to generate types for ${abiFile}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        )
      }
    }

    // Generate index file
    const indexContent = generateIndexFile(result.types, outputPath)
    const indexFile = path.join(outputPath, 'index.ts')
    fs.writeFileSync(indexFile, indexContent)
    result.types.push(indexFile)

    result.success = result.errors.length === 0

  } catch (error) {
    result.errors.push(
      `Failed to generate types: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  return result
}

/**
 * Find all ABI JSON files in directory
 */
function findABIFiles(dir: string): string[] {
  const files: string[] = []

  function scanDirectory(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)

      if (entry.isDirectory()) {
        scanDirectory(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        files.push(fullPath)
      }
    }
  }

  scanDirectory(dir)
  return files
}

/**
 * Generate TypeScript type definition from ABI
 */
function generateTypeDefinitionFromABI(contractName: string, abi: any[]): string {
  // Extract function signatures
  const functions = abi.filter(item => item.type === 'function')
  const events = abi.filter(item => item.type === 'event')

  // Generate function interface
  const functionSignatures = functions.map(fn => {
    const inputs = fn.inputs.map((input: any) =>
      `${input.name}: ${mapABITypeToTypeScript(input.type)}`
    ).join(', ')

    const outputs = fn.outputs && fn.outputs.length > 0
      ? mapABITypeToTypeScript(fn.outputs[0].type)
      : 'void'

    return `  ${fn.name}(${inputs}): Promise<${outputs}>`
  }).join('\n')

  // Generate event interface
  const eventSignatures = events.map(event => {
    const inputs = event.inputs.map((input: any) =>
      `${input.name}: ${mapABITypeToTypeScript(input.type)}`
    ).join(', ')

    return `  ${event.name}: { ${inputs} }`
  }).join('\n')

  return `/**
 * TypeScript definitions for ${contractName}
 * Generated from contract ABI
 */

import { ethers } from 'ethers'

export interface ${contractName}Functions {
${functionSignatures}
}

export interface ${contractName}Events {
${eventSignatures}
}

export type ${contractName} = ethers.Contract & ${contractName}Functions

export const ${contractName}ABI = ${JSON.stringify(abi, null, 2)}
`
}

/**
 * Map Solidity ABI types to TypeScript types
 */
function mapABITypeToTypeScript(abiType: string): string {
  if (abiType.startsWith('uint') || abiType.startsWith('int')) {
    return 'bigint'
  }
  if (abiType === 'address') {
    return 'string'
  }
  if (abiType === 'bool') {
    return 'boolean'
  }
  if (abiType === 'string') {
    return 'string'
  }
  if (abiType.startsWith('bytes')) {
    return 'string'
  }
  if (abiType.endsWith('[]')) {
    const baseType = abiType.slice(0, -2)
    return `${mapABITypeToTypeScript(baseType)}[]`
  }
  return 'any'
}

/**
 * Generate index.ts file that exports all types
 */
function generateIndexFile(typeFiles: string[], outputPath: string): string {
  const exports = typeFiles
    .filter(file => !file.endsWith('index.ts'))
    .map(file => {
      const basename = path.basename(file, '.ts')
      return `export * from './${basename}'`
    })
    .join('\n')

  return `/**
 * Auto-generated type definitions
 *
 * Import contract types:
 * import { MyContract } from './types'
 */

${exports}
`
}
