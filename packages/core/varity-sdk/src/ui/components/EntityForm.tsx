/**
 * Entity Form Component
 *
 * Dynamic form generator based on entity field configuration
 */

import React, { useState } from 'react'
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Checkbox,
  FormControlLabel,
  Button,
  Box,
  Grid,
  Typography,
  Alert
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

export interface FormField {
  /** Field name/id */
  name: string
  /** Field label */
  label: string
  /** Field type - Universal support for all industries */
  type:
    | 'string' | 'number' | 'boolean' | 'enum' | 'array' | 'object'
    | 'currency' | 'decimal' | 'percentage'
    | 'date' | 'time' | 'datetime' | 'duration'
    | 'email' | 'phone' | 'url'
    | 'address'
    | 'ssn' | 'tax-id' | 'medical-code' | 'sku' | 'barcode'
    | 'rich-text' | 'markdown' | 'json'
    | 'file' | 'image' | 'document'
    | 'lookup' | 'multi-select' | 'coordinates' | 'color' | 'ip-address'
    | 'bytes' | 'bytes32'
  /** Required field */
  required?: boolean
  /** Help text */
  helperText?: string
  /** Enum options (for enum/multi-select types) */
  enumValues?: string[]
  /** Validation rules */
  validation?: {
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
    pattern?: string
    precision?: number
    fileTypes?: string[]
    maxFileSize?: number
    custom?: (value: any) => string | null
  }
  /** Default value */
  defaultValue?: any
  /** Disabled state */
  disabled?: boolean
  /** Placeholder text */
  placeholder?: string
}

export interface EntityFormProps {
  /** Form fields */
  fields: FormField[]
  /** Form title */
  title?: string
  /** Submit button text */
  submitText?: string
  /** Cancel button text */
  cancelText?: string
  /** Submit handler */
  onSubmit: (data: Record<string, any>) => Promise<void> | void
  /** Cancel handler */
  onCancel?: () => void
  /** Initial data (for edit mode) */
  initialData?: Record<string, any>
  /** Loading state */
  loading?: boolean
  /** Grid columns (2 or 1) */
  columns?: 1 | 2
}

export const EntityForm: React.FC<EntityFormProps> = ({
  fields,
  title,
  submitText = 'Submit',
  cancelText = 'Cancel',
  onSubmit,
  onCancel,
  initialData = {},
  loading = false,
  columns = 2
}) => {
  const [formData, setFormData] = useState<Record<string, any>>(
    fields.reduce((acc, field) => ({
      ...acc,
      [field.name]: initialData[field.name] ?? field.defaultValue ?? ''
    }), {})
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string>('')

  const validateField = (field: FormField, value: any): string | null => {
    if (field.required && !value) {
      return `${field.label} is required`
    }

    if (field.validation) {
      const { min, max, pattern, custom } = field.validation

      if (field.type === 'number') {
        const numValue = Number(value)
        if (min !== undefined && numValue < min) {
          return `${field.label} must be at least ${min}`
        }
        if (max !== undefined && numValue > max) {
          return `${field.label} must be at most ${max}`
        }
      }

      if (field.type === 'string' && pattern && value) {
        const regex = new RegExp(pattern)
        if (!regex.test(value)) {
          return `${field.label} format is invalid`
        }
      }

      if (custom) {
        const customError = custom(value)
        if (customError) return customError
      }
    }

    if (field.type === 'address' && value) {
      const addressRegex = /^0x[a-fA-F0-9]{40}$/
      if (!addressRegex.test(value)) {
        return 'Invalid Ethereum address'
      }
    }

    return null
  }

  const handleChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))

    // Clear error for this field
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')

    // Validate all fields
    const newErrors: Record<string, string> = {}
    fields.forEach(field => {
      const error = validateField(field, formData[field.name])
      if (error) {
        newErrors[field.name] = error
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await onSubmit(formData)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  const renderField = (field: FormField) => {
    const value = formData[field.name] ?? ''
    const error = errors[field.name]

    // Get placeholder based on field type
    const getPlaceholder = () => {
      if (field.placeholder) return field.placeholder
      switch (field.type) {
        case 'address': return '0x...'
        case 'email': return 'user@example.com'
        case 'phone': return '+1 (555) 123-4567'
        case 'url': return 'https://example.com'
        case 'ssn': return '123-45-6789'
        case 'tax-id': return '12-3456789'
        case 'sku': return 'SKU-12345'
        case 'ip-address': return '192.168.1.1'
        case 'coordinates': return '40.7128, -74.0060'
        default: return undefined
      }
    }

    // Text-based inputs (string and string-like types)
    if (['string', 'address', 'bytes', 'bytes32', 'email', 'phone', 'url',
         'ssn', 'tax-id', 'medical-code', 'sku', 'barcode', 'ip-address',
         'coordinates', 'markdown', 'json'].includes(field.type)) {
      return (
        <TextField
          fullWidth
          name={field.name}
          label={field.label}
          value={value}
          onChange={(e) => handleChange(field.name, e.target.value)}
          required={field.required}
          error={!!error}
          helperText={error || field.helperText}
          disabled={field.disabled || loading}
          placeholder={getPlaceholder()}
          type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
        />
      )
    }

    // Multi-line text inputs
    if (['rich-text', 'time', 'duration'].includes(field.type)) {
      return (
        <TextField
          fullWidth
          multiline
          rows={field.type === 'rich-text' ? 6 : 3}
          name={field.name}
          label={field.label}
          value={value}
          onChange={(e) => handleChange(field.name, e.target.value)}
          required={field.required}
          error={!!error}
          helperText={error || field.helperText}
          disabled={field.disabled || loading}
        />
      )
    }

    // Number-based inputs
    if (['number', 'currency', 'decimal', 'percentage'].includes(field.type)) {
      return (
        <TextField
          fullWidth
          type="number"
          name={field.name}
          label={field.label}
          value={value}
          onChange={(e) => handleChange(field.name, e.target.value)}
          required={field.required}
          error={!!error}
          helperText={error || field.helperText}
          disabled={field.disabled || loading}
          inputProps={{
            step: field.type === 'currency' ? '0.01' : field.type === 'decimal' ? '0.001' : '1',
            min: field.validation?.min,
            max: field.validation?.max
          }}
        />
      )
    }

    // Boolean checkbox
    if (field.type === 'boolean') {
      return (
        <FormControlLabel
          control={
            <Checkbox
              checked={!!value}
              onChange={(e) => handleChange(field.name, e.target.checked)}
              disabled={field.disabled || loading}
            />
          }
          label={field.label}
        />
      )
    }

    // Enum/Select dropdown
    if (field.type === 'enum') {
      return (
        <FormControl fullWidth error={!!error} disabled={field.disabled || loading}>
          <InputLabel>{field.label}</InputLabel>
          <Select
            value={value}
            label={field.label}
            onChange={(e) => handleChange(field.name, e.target.value)}
            required={field.required}
          >
            {field.enumValues?.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
          {(error || field.helperText) && (
            <FormHelperText>{error || field.helperText}</FormHelperText>
          )}
        </FormControl>
      )
    }

    // Multi-select
    if (field.type === 'multi-select') {
      return (
        <FormControl fullWidth error={!!error} disabled={field.disabled || loading}>
          <InputLabel>{field.label}</InputLabel>
          <Select
            multiple
            value={Array.isArray(value) ? value : []}
            label={field.label}
            onChange={(e) => handleChange(field.name, e.target.value)}
            required={field.required}
          >
            {field.enumValues?.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
          {(error || field.helperText) && (
            <FormHelperText>{error || field.helperText}</FormHelperText>
          )}
        </FormControl>
      )
    }

    // Date picker
    if (['date', 'datetime'].includes(field.type)) {
      return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label={field.label}
            value={value ? new Date(value) : null}
            onChange={(date) => handleChange(field.name, date?.getTime())}
            disabled={field.disabled || loading}
            slotProps={{
              textField: {
                fullWidth: true,
                required: field.required,
                error: !!error,
                helperText: error || field.helperText
              }
            }}
          />
        </LocalizationProvider>
      )
    }

    // Color picker
    if (field.type === 'color') {
      return (
        <TextField
          fullWidth
          type="color"
          name={field.name}
          label={field.label}
          value={value}
          onChange={(e) => handleChange(field.name, e.target.value)}
          required={field.required}
          error={!!error}
          helperText={error || field.helperText}
          disabled={field.disabled || loading}
        />
      )
    }

    // File/Image/Document upload
    if (['file', 'image', 'document'].includes(field.type)) {
      return (
        <Box>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            {field.label} {field.required && '*'}
          </Typography>
          <TextField
            fullWidth
            type="file"
            name={field.name}
            onChange={(e) => {
              const file = (e.target as HTMLInputElement).files?.[0]
              handleChange(field.name, file)
            }}
            required={field.required}
            error={!!error}
            helperText={error || field.helperText}
            disabled={field.disabled || loading}
            inputProps={{
              accept: field.validation?.fileTypes?.join(',')
            }}
          />
        </Box>
      )
    }

    // Fallback for unsupported types (array, object, lookup)
    return (
      <TextField
        fullWidth
        name={field.name}
        label={field.label}
        value={value}
        onChange={(e) => handleChange(field.name, e.target.value)}
        required={field.required}
        error={!!error}
        helperText={error || `${field.type} field type - advanced configuration needed`}
        disabled={field.disabled || loading}
        placeholder={`Enter ${field.type} value...`}
      />
    )
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}

      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {submitError}
        </Alert>
      )}

      <Grid container spacing={2}>
        {fields.map((field) => (
          <Grid item xs={12} md={columns === 2 ? 6 : 12} key={field.name}>
            {renderField(field)}
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        {onCancel && (
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Submitting...' : submitText}
        </Button>
      </Box>
    </Box>
  )
}
