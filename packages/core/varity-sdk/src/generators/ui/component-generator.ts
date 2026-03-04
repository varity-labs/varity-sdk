/**
 * UI Component Generator
 *
 * Generates CRUD React components from template entity definitions
 */

import * as fs from 'fs'
import * as path from 'path'
import type { TemplateConfig, TemplateEntity, EntityField } from '../../core/template'

export interface GenerateUIOptions {
  templatePath: string
  outputPath: string
  componentsPath?: string
}

export interface GenerateUIResult {
  components: string[]
  success: boolean
  errors: string[]
}

/**
 * Generate UI components from template configuration
 */
export async function generateUIComponents(
  options: GenerateUIOptions
): Promise<GenerateUIResult> {
  const result: GenerateUIResult = {
    components: [],
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

    // Create output directories
    const outputPath = path.resolve(options.outputPath)
    const componentsPath = options.componentsPath || path.join(outputPath, 'src', 'components', 'entities')

    if (!fs.existsSync(componentsPath)) {
      fs.mkdirSync(componentsPath, { recursive: true })
    }

    // Generate components for each entity
    for (const entity of template.entities) {
      try {
        // Generate Create Form
        const createFormCode = generateCreateForm(entity, template)
        const createFormFile = path.join(componentsPath, `${capitalize(entity.name)}CreateForm.tsx`)
        fs.writeFileSync(createFormFile, createFormCode)
        result.components.push(createFormFile)

        // Generate Edit Form
        const editFormCode = generateEditForm(entity, template)
        const editFormFile = path.join(componentsPath, `${capitalize(entity.name)}EditForm.tsx`)
        fs.writeFileSync(editFormFile, editFormCode)
        result.components.push(editFormFile)

        // Generate Detail View
        const detailCode = generateDetailView(entity, template)
        const detailFile = path.join(componentsPath, `${capitalize(entity.name)}Detail.tsx`)
        fs.writeFileSync(detailFile, detailCode)
        result.components.push(detailFile)

        // Generate List View
        const listCode = generateListView(entity, template)
        const listFile = path.join(componentsPath, `${capitalize(entity.name)}List.tsx`)
        fs.writeFileSync(listFile, listCode)
        result.components.push(listFile)

      } catch (error) {
        result.errors.push(
          `Failed to generate components for entity ${entity.name}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        )
      }
    }

    // Generate index file
    const indexCode = generateIndexFile(template.entities)
    const indexFile = path.join(componentsPath, 'index.ts')
    fs.writeFileSync(indexFile, indexCode)
    result.components.push(indexFile)

    result.success = result.errors.length === 0

  } catch (error) {
    result.errors.push(
      `Failed to generate UI components: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }

  return result
}

/**
 * Generate Create Form component
 */
function generateCreateForm(entity: TemplateEntity, template: TemplateConfig): string {
  const entityName = capitalize(entity.name)
  const entityDisplayName = entity.displayName || entityName
  const contractMap = getContractMapping(entity)

  // Get fields excluding auto-generated ones
  const formFields = entity.fields.filter(
    f => !['createdAt', 'updatedAt', 'isActive', entity.idField].includes(f.name)
  )

  const formFieldsConfig = formFields.map(field => ({
    name: field.name,
    label: field.label,
    type: mapFieldTypeToFormType(field.type),
    required: field.required || false,
    helperText: field.description || undefined,
    enumValues: (field as any).enumValues || undefined
  }))

  return `/**
 * ${entityDisplayName} Create Form
 *
 * Auto-generated from template: ${template.name}
 */

import React, { useState } from 'react'
import { Box, Alert } from '@mui/material'
import { EntityForm, FormField } from '@varity-labs/sdk/ui/components'
import { useSDK } from '../hooks/useSDK'

const formFields: FormField[] = ${JSON.stringify(formFieldsConfig, null, 2)}

export interface ${entityName}CreateFormProps {
  onSuccess?: (id: string) => void
  onCancel?: () => void
}

export const ${entityName}CreateForm: React.FC<${entityName}CreateFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const { sdk } = useSDK()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const handleSubmit = async (formData: Record<string, any>) => {
    setLoading(true)
    setError('')

    try {
      // Call contract to create ${entity.name}
      const tx = await sdk.contracts.send(
        '${contractMap.contractName}',
        '${contractMap.functions.create}',
        Object.values(formData)
      )

      // Wait for transaction
      await tx.wait()

      // Get created ID from event
      const events = await sdk.contracts.getEvents('${contractMap.contractName}', '${contractMap.events.created}')
      const createdId = events[0]?.args?.${entity.idField}

      if (onSuccess && createdId) {
        onSuccess(createdId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ${entity.name}')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <EntityForm
        title="Create ${entityDisplayName}"
        fields={formFields}
        onSubmit={handleSubmit}
        onCancel={onCancel}
        submitText="Create ${entityDisplayName}"
        loading={loading}
      />
    </Box>
  )
}
`
}

/**
 * Generate Edit Form component
 */
function generateEditForm(entity: TemplateEntity, template: TemplateConfig): string {
  const entityName = capitalize(entity.name)
  const entityDisplayName = entity.displayName || entityName
  const contractMap = getContractMapping(entity)

  // Get editable fields
  const formFields = entity.fields.filter(
    f => !['createdAt', 'updatedAt', 'isActive', entity.idField].includes(f.name)
  )

  const formFieldsConfig = formFields.map(field => ({
    name: field.name,
    label: field.label,
    type: mapFieldTypeToFormType(field.type),
    required: field.required || false,
    helperText: field.description || undefined,
    enumValues: (field as any).enumValues || undefined
  }))

  return `/**
 * ${entityDisplayName} Edit Form
 *
 * Auto-generated from template: ${template.name}
 */

import React, { useState, useEffect } from 'react'
import { Box, Alert, CircularProgress } from '@mui/material'
import { EntityForm, FormField } from '@varity-labs/sdk/ui/components'
import { useSDK } from '../hooks/useSDK'

const formFields: FormField[] = ${JSON.stringify(formFieldsConfig, null, 2)}

export interface ${entityName}EditFormProps {
  ${entity.idField}: string
  onSuccess?: () => void
  onCancel?: () => void
}

export const ${entityName}EditForm: React.FC<${entityName}EditFormProps> = ({
  ${entity.idField},
  onSuccess,
  onCancel
}) => {
  const { sdk } = useSDK()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string>('')
  const [initialData, setInitialData] = useState<Record<string, any>>({})

  useEffect(() => {
    loadData()
  }, [${entity.idField}])

  const loadData = async () => {
    setLoadingData(true)
    try {
      const data = await sdk.contracts.call(
        '${contractMap.contractName}',
        '${contractMap.functions.get}',
        [${entity.idField}]
      )
      setInitialData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ${entity.name}')
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (formData: Record<string, any>) => {
    setLoading(true)
    setError('')

    try {
      // Call contract to update ${entity.name}
      const tx = await sdk.contracts.send(
        '${contractMap.contractName}',
        '${contractMap.functions.update}',
        [${entity.idField}, ...Object.values(formData)]
      )

      // Wait for transaction
      await tx.wait()

      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ${entity.name}')
      throw err
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <EntityForm
        title="Edit ${entityDisplayName}"
        fields={formFields}
        onSubmit={handleSubmit}
        onCancel={onCancel}
        submitText="Update ${entityDisplayName}"
        initialData={initialData}
        loading={loading}
      />
    </Box>
  )
}
`
}

/**
 * Generate Detail View component
 */
function generateDetailView(entity: TemplateEntity, template: TemplateConfig): string {
  const entityName = capitalize(entity.name)
  const entityDisplayName = entity.displayName || entityName
  const contractMap = getContractMapping(entity)

  const displayFields = entity.fields.map(field => ({
    name: field.name,
    label: field.label,
    format: getFieldFormatter(field.type)
  }))

  return `/**
 * ${entityDisplayName} Detail View
 *
 * Auto-generated from template: ${template.name}
 */

import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Button
} from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { useSDK } from '../hooks/useSDK'

export interface ${entityName}DetailProps {
  ${entity.idField}: string
  onEdit?: () => void
  onDelete?: () => void
}

const formatters = {
  ${displayFields.map(f => `${f.name}: ${f.format}`).join(',\n  ')}
}

export const ${entityName}Detail: React.FC<${entityName}DetailProps> = ({
  ${entity.idField},
  onEdit,
  onDelete
}) => {
  const { sdk } = useSDK()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [${entity.idField}])

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await sdk.contracts.call(
        '${contractMap.contractName}',
        '${contractMap.functions.get}',
        [${entity.idField}]
      )
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ${entity.name}')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>
  }

  if (!data) {
    return <Alert severity="warning">${entityDisplayName} not found</Alert>
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">${entityDisplayName} Details</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {onEdit && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={onEdit}
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={onDelete}
              >
                Delete
              </Button>
            )}
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          ${displayFields.map(field => `
          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary">
              ${field.label}
            </Typography>
            <Typography variant="body1">
              {formatters.${field.name}(data.${field.name})}
            </Typography>
          </Grid>`).join('\n          ')}
        </Grid>
      </CardContent>
    </Card>
  )
}
`
}

/**
 * Generate List View component
 */
function generateListView(entity: TemplateEntity, template: TemplateConfig): string {
  const entityName = capitalize(entity.name)
  const entityDisplayName = entity.displayName || entityName
  const contractMap = getContractMapping(entity)

  // Select key fields for table display (max 6 columns)
  const tableFields = entity.fields.slice(0, 6)

  const columns = tableFields.map(field => ({
    id: field.name,
    label: field.label,
    sortable: true,
    format: getFieldFormatter(field.type)
  }))

  return `/**
 * ${entityDisplayName} List View
 *
 * Auto-generated from template: ${template.name}
 */

import React, { useState, useEffect } from 'react'
import { Box, Button, Alert, CircularProgress } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { DataTable, Column, Modal } from '@varity-labs/sdk/ui/components'
import { useSDK } from '../hooks/useSDK'
import { ${entityName}CreateForm } from './${entityName}CreateForm'
import { ${entityName}EditForm } from './${entityName}EditForm'
import { ${entityName}Detail } from './${entityName}Detail'

const columns: Column[] = ${JSON.stringify(columns, null, 2).replace(/"format": "(.*?)"/g, 'format: $1')}

export interface ${entityName}ListProps {
  onRowClick?: (${entity.name}: any) => void
}

export const ${entityName}List: React.FC<${entityName}ListProps> = ({ onRowClick }) => {
  const { sdk } = useSDK()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [data, setData] = useState<any[]>([])
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      // Get all ${entity.name} IDs
      const ids = await sdk.contracts.call(
        '${contractMap.contractName}',
        '${contractMap.functions.getAll}',
        []
      )

      // Fetch data for each ID
      const results = await Promise.all(
        ids.map(async (id: string) => {
          const data = await sdk.contracts.call(
            '${contractMap.contractName}',
            '${contractMap.functions.get}',
            [id]
          )
          return data
        })
      )

      setData(results.filter(r => r.isActive))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ${entity.name}s')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setCreateModalOpen(true)
  }

  const handleEdit = (row: any) => {
    setSelectedId(row.${entity.idField})
    setEditModalOpen(true)
  }

  const handleView = (row: any) => {
    setSelectedId(row.${entity.idField})
    setDetailModalOpen(true)
  }

  const handleDelete = async (row: any) => {
    if (window.confirm(\`Are you sure you want to deactivate this ${entity.name}?\`)) {
      try {
        const tx = await sdk.contracts.send(
          '${contractMap.contractName}',
          '${contractMap.functions.delete}',
          [row.${entity.idField}]
        )
        await tx.wait()
        await loadData()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to deactivate ${entity.name}')
      }
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <h2>${entityDisplayName}s</h2>
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Create ${entityDisplayName}
        </Button>
      </Box>

      <DataTable
        columns={columns}
        data={data}
        onRowClick={onRowClick || handleView}
        actions={{
          onView: handleView,
          onEdit: handleEdit,
          onDelete: handleDelete
        }}
        emptyMessage="No ${entity.name}s found"
      />

      {/* Create Modal */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create ${entityDisplayName}"
        maxWidth="md"
      >
        <${entityName}CreateForm
          onSuccess={() => {
            setCreateModalOpen(false)
            loadData()
          }}
          onCancel={() => setCreateModalOpen(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit ${entityDisplayName}"
        maxWidth="md"
      >
        <${entityName}EditForm
          ${entity.idField}={selectedId}
          onSuccess={() => {
            setEditModalOpen(false)
            loadData()
          }}
          onCancel={() => setEditModalOpen(false)}
        />
      </Modal>

      {/* Detail Modal */}
      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="${entityDisplayName} Details"
        maxWidth="md"
      >
        <${entityName}Detail
          ${entity.idField}={selectedId}
          onEdit={() => {
            setDetailModalOpen(false)
            setEditModalOpen(true)
          }}
          onDelete={() => {
            setDetailModalOpen(false)
            handleDelete({ ${entity.idField}: selectedId })
          }}
        />
      </Modal>
    </Box>
  )
}
`
}

/**
 * Generate index file
 */
function generateIndexFile(entities: TemplateEntity[]): string {
  const exports = entities.flatMap(entity => {
    const name = capitalize(entity.name)
    return [
      `export { ${name}CreateForm } from './${name}CreateForm'`,
      `export { ${name}EditForm } from './${name}EditForm'`,
      `export { ${name}Detail } from './${name}Detail'`,
      `export { ${name}List } from './${name}List'`
    ]
  })

  return `/**
 * Entity Components
 *
 * Auto-generated entity CRUD components
 */

${exports.join('\n')}
`
}

/**
 * Get contract mapping configuration with defaults
 */
function getContractMapping(entity: TemplateEntity) {
  const entityName = capitalize(entity.name)
  const displayName = entity.displayName || entityName

  const mapping = entity.contractMapping || {}

  return {
    contractName: mapping.contractName || `${entityName}Registry`,
    functions: {
      create: mapping.functions?.create || `create${displayName}`,
      get: mapping.functions?.get || `get${displayName}`,
      getAll: mapping.functions?.getAll || `getAll${displayName}Ids`,
      update: mapping.functions?.update || `update${displayName}`,
      delete: mapping.functions?.delete || `deactivate${displayName}`,
      count: mapping.functions?.count || `get${displayName}Count`
    },
    events: {
      created: `${displayName}Created`,
      updated: `${displayName}Updated`,
      deleted: `${displayName}Deleted`
    },
    fieldMappings: mapping.fieldMappings || {}
  }
}

/**
 * Map entity field type to form field type - Universal support for all 33+ types
 */
function mapFieldTypeToFormType(type: string): string {
  const typeMap: Record<string, string> = {
    // Basic types
    'string': 'string',
    'number': 'number',
    'boolean': 'boolean',
    'enum': 'enum',
    'array': 'array',
    'object': 'object',
    // Financial types
    'currency': 'number',
    'decimal': 'number',
    'percentage': 'number',
    // Temporal types
    'date': 'date',
    'time': 'string',
    'datetime': 'date',
    'duration': 'string',
    // Contact types
    'email': 'string',
    'phone': 'string',
    'url': 'string',
    // Blockchain types
    'address': 'address',
    // Identification types
    'ssn': 'string',
    'tax-id': 'string',
    'medical-code': 'string',
    'sku': 'string',
    'barcode': 'string',
    // Content types
    'rich-text': 'string',
    'markdown': 'string',
    'json': 'string',
    // Media types
    'file': 'string',
    'image': 'string',
    'document': 'string',
    // Advanced types
    'lookup': 'string',
    'multi-select': 'array',
    'coordinates': 'string',
    'color': 'string',
    'ip-address': 'string',
    // Legacy types
    'bytes': 'bytes',
    'bytes32': 'bytes32'
  }
  return typeMap[type] || 'string'
}

/**
 * Get formatter function for field type
 */
function getFieldFormatter(type: string): string {
  switch (type) {
    case 'boolean':
      return '(v: boolean) => v ? "Yes" : "No"'
    case 'number':
      return '(v: number) => v.toLocaleString()'
    case 'address':
      return '(v: string) => `${v.slice(0, 6)}...${v.slice(-4)}`'
    case 'date':
      return '(v: number) => new Date(v * 1000).toLocaleDateString()'
    default:
      return '(v: any) => v?.toString() || "-"'
  }
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
