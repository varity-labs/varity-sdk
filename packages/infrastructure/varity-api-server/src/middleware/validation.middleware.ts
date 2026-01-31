import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './error.middleware';

/**
 * Validation Schema Interface
 */
interface ValidationSchema {
  body?: Record<string, any>;
  params?: Record<string, any>;
  query?: Record<string, any>;
}

/**
 * Simple validation rules
 */
const validationRules = {
  required: (value: any) => value !== undefined && value !== null && value !== '',
  string: (value: any) => typeof value === 'string',
  number: (value: any) => typeof value === 'number' && !isNaN(value),
  boolean: (value: any) => typeof value === 'boolean',
  array: (value: any) => Array.isArray(value),
  object: (value: any) => typeof value === 'object' && value !== null && !Array.isArray(value),
  email: (value: any) => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  ethereum_address: (value: any) => typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value),
  url: (value: any) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  min: (value: any, min: number) => {
    if (typeof value === 'number') return value >= min;
    if (typeof value === 'string') return value.length >= min;
    if (Array.isArray(value)) return value.length >= min;
    return false;
  },
  max: (value: any, max: number) => {
    if (typeof value === 'number') return value <= max;
    if (typeof value === 'string') return value.length <= max;
    if (Array.isArray(value)) return value.length <= max;
    return false;
  },
  enum: (value: any, allowedValues: any[]) => allowedValues.includes(value),
};

/**
 * Validate Request Data
 */
export const validate = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: Record<string, string[]> = {};

    // Validate body
    if (schema.body) {
      const bodyErrors = validateObject(req.body, schema.body);
      if (Object.keys(bodyErrors).length > 0) {
        errors.body = bodyErrors;
      }
    }

    // Validate params
    if (schema.params) {
      const paramsErrors = validateObject(req.params, schema.params);
      if (Object.keys(paramsErrors).length > 0) {
        errors.params = paramsErrors;
      }
    }

    // Validate query
    if (schema.query) {
      const queryErrors = validateObject(req.query, schema.query);
      if (Object.keys(queryErrors).length > 0) {
        errors.query = queryErrors;
      }
    }

    // If there are errors, throw ValidationError
    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Validation failed', errors);
    }

    next();
  };
};

/**
 * Validate an object against schema
 */
function validateObject(data: any, schema: Record<string, any>): any {
  const errors: any = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = data?.[field];
    const fieldErrors: string[] = [];

    // Required check
    if (rules.required && !validationRules.required(value)) {
      fieldErrors.push(`${field} is required`);
      errors[field] = fieldErrors;
      continue;
    }

    // Skip other validations if field is not required and not present
    if (!rules.required && !validationRules.required(value)) {
      continue;
    }

    // Type checks
    if (rules.type) {
      const typeValidator = validationRules[rules.type as keyof typeof validationRules];
      if (typeValidator && typeof typeValidator === 'function' && !(typeValidator as any)(value)) {
        fieldErrors.push(`${field} must be of type ${rules.type}`);
      }
    }

    // Min/Max checks
    if (rules.min !== undefined && !validationRules.min(value, rules.min)) {
      fieldErrors.push(`${field} must be at least ${rules.min}`);
    }
    if (rules.max !== undefined && !validationRules.max(value, rules.max)) {
      fieldErrors.push(`${field} must be at most ${rules.max}`);
    }

    // Enum check
    if (rules.enum && !validationRules.enum(value, rules.enum)) {
      fieldErrors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
    }

    // Custom validator
    if (rules.custom && typeof rules.custom === 'function') {
      const customError = rules.custom(value);
      if (customError) {
        fieldErrors.push(customError);
      }
    }

    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  }

  return errors;
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  ethereumAddress: {
    type: 'ethereum_address',
    required: true,
  },
  optionalEthereumAddress: {
    type: 'ethereum_address',
    required: false,
  },
  pagination: {
    page: {
      type: 'number',
      required: false,
      min: 1,
    },
    limit: {
      type: 'number',
      required: false,
      min: 1,
      max: 100,
    },
  },
};

export default validate;
