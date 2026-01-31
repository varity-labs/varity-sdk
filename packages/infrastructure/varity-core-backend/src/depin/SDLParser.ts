/**
 * SDL Parser - Akash Stack Definition Language Parser
 * PROPRIETARY - DO NOT DISTRIBUTE
 *
 * Parses and validates Akash SDL (YAML format) for deployment manifests
 */

import * as yaml from 'js-yaml';
import logger from '../utils/logger';
import { StorageError } from '../types';

export interface SDLService {
  image: string;
  command?: string[];
  args?: string[];
  env?: Record<string, string>;
  expose?: SDLExpose[];
  params?: {
    storage?: Record<string, SDLStorage>;
  };
  dependencies?: {
    [serviceName: string]: {
      conditions: string[];
    };
  };
}

export interface SDLExpose {
  port: number;
  as?: number;
  to?: SDLExposeTo[];
  accept?: string[];
  proto?: string;
  http_options?: {
    max_body_size?: number;
    read_timeout?: number;
    send_timeout?: number;
    next_tries?: number;
    next_timeout?: number;
    next_cases?: string[];
  };
}

export interface SDLExposeTo {
  global?: boolean;
  service?: string;
  ip?: string;
}

export interface SDLStorage {
  size: string;
  attributes?: {
    persistent?: boolean;
    class?: string;
  };
}

export interface SDLResources {
  cpu: {
    units: number | string;
    attributes?: {
      arch?: string;
    };
  };
  memory: {
    size: string;
    attributes?: Record<string, any>;
  };
  storage?: {
    size: string;
    attributes?: {
      persistent?: boolean;
      class?: string;
    };
  }[];
  gpu?: {
    units: number;
    attributes?: {
      vendor?: {
        nvidia?: {
          model?: string;
        };
      };
    };
  };
}

export interface SDLComputeProfile {
  [serviceName: string]: {
    resources: SDLResources;
  };
}

export interface SDLPlacementProfile {
  [profileName: string]: {
    attributes?: Record<string, any>;
    signedBy?: {
      allOf?: string[];
      anyOf?: string[];
    };
    pricing: {
      [serviceName: string]: {
        denom: string;
        amount: number;
      };
    };
  };
}

export interface SDLDeployment {
  [serviceName: string]: {
    [profileName: string]: {
      profile: string;
      count: number;
    };
  };
}

export interface SDL {
  version: string;
  services: Record<string, SDLService>;
  profiles: {
    compute: SDLComputeProfile;
    placement: SDLPlacementProfile;
  };
  deployment: SDLDeployment;
}

export class SDLParser {
  /**
   * Parse SDL from YAML string
   */
  static parse(sdlYaml: string): SDL {
    try {
      logger.info('Parsing SDL manifest...');

      const sdl = yaml.load(sdlYaml) as SDL;

      // Validate SDL structure
      this.validate(sdl);

      logger.info('SDL manifest parsed successfully', {
        version: sdl.version,
        serviceCount: Object.keys(sdl.services || {}).length,
      });

      return sdl;
    } catch (error: any) {
      logger.error('Failed to parse SDL manifest', {
        error: error.message,
      });
      throw new StorageError('Invalid SDL manifest format', error);
    }
  }

  /**
   * Convert SDL object to YAML string
   */
  static stringify(sdl: SDL): string {
    try {
      return yaml.dump(sdl, {
        indent: 2,
        lineWidth: 120,
      });
    } catch (error: any) {
      logger.error('Failed to stringify SDL manifest', {
        error: error.message,
      });
      throw new StorageError('Failed to stringify SDL manifest', error);
    }
  }

  /**
   * Validate SDL structure
   */
  static validate(sdl: SDL): void {
    if (!sdl.version) {
      throw new StorageError('SDL version is required');
    }

    if (!sdl.services || Object.keys(sdl.services).length === 0) {
      throw new StorageError('SDL must define at least one service');
    }

    if (!sdl.profiles) {
      throw new StorageError('SDL profiles are required');
    }

    if (!sdl.profiles.compute) {
      throw new StorageError('SDL compute profiles are required');
    }

    if (!sdl.profiles.placement) {
      throw new StorageError('SDL placement profiles are required');
    }

    if (!sdl.deployment) {
      throw new StorageError('SDL deployment configuration is required');
    }

    // Validate each service
    for (const [serviceName, service] of Object.entries(sdl.services)) {
      if (!service.image) {
        throw new StorageError(`Service ${serviceName} must specify an image`);
      }
    }

    // Validate compute profiles reference services
    const serviceNames = Object.keys(sdl.services);
    for (const [profileName, profile] of Object.entries(sdl.profiles.compute)) {
      if (!serviceNames.includes(profileName)) {
        logger.warn(`Compute profile ${profileName} does not match any service`);
      }

      if (!profile.resources) {
        throw new StorageError(`Compute profile ${profileName} must define resources`);
      }

      if (!profile.resources.cpu) {
        throw new StorageError(`Compute profile ${profileName} must define CPU resources`);
      }

      if (!profile.resources.memory) {
        throw new StorageError(`Compute profile ${profileName} must define memory resources`);
      }
    }

    // Validate placement profiles have pricing
    for (const [profileName, profile] of Object.entries(sdl.profiles.placement)) {
      if (!profile.pricing) {
        throw new StorageError(`Placement profile ${profileName} must define pricing`);
      }
    }

    logger.info('SDL validation passed');
  }

  /**
   * Normalize resource units
   */
  static normalizeResources(resources: SDLResources): SDLResources {
    const normalized = { ...resources };

    // Normalize CPU units (convert string to number if needed)
    if (typeof normalized.cpu.units === 'string') {
      // Handle formats like "0.5", "2", "2000m"
      const cpuStr = normalized.cpu.units as string;
      if (cpuStr.endsWith('m')) {
        normalized.cpu.units = parseInt(cpuStr) / 1000;
      } else {
        normalized.cpu.units = parseFloat(cpuStr);
      }
    }

    // Normalize memory size to standard format (e.g., "512Mi", "1Gi")
    if (!normalized.memory.size.match(/^[0-9]+[KMGT]i$/)) {
      // Convert from bytes or other formats
      normalized.memory.size = this.normalizeMemorySize(normalized.memory.size);
    }

    return normalized;
  }

  /**
   * Normalize memory size to Ki/Mi/Gi format
   */
  private static normalizeMemorySize(size: string): string {
    // Parse numeric value and unit
    const match = size.match(/^([0-9.]+)([A-Za-z]*)$/);
    if (!match) {
      throw new StorageError(`Invalid memory size format: ${size}`);
    }

    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();

    // Convert to Mi (megabytes)
    let megabytes: number;
    switch (unit) {
      case 'B':
      case '':
        megabytes = value / (1024 * 1024);
        break;
      case 'K':
      case 'KB':
      case 'KI':
        megabytes = value / 1024;
        break;
      case 'M':
      case 'MB':
      case 'MI':
        megabytes = value;
        break;
      case 'G':
      case 'GB':
      case 'GI':
        megabytes = value * 1024;
        break;
      case 'T':
      case 'TB':
      case 'TI':
        megabytes = value * 1024 * 1024;
        break;
      default:
        throw new StorageError(`Unknown memory unit: ${unit}`);
    }

    // Return in appropriate unit
    if (megabytes >= 1024) {
      return `${Math.round(megabytes / 1024)}Gi`;
    } else {
      return `${Math.round(megabytes)}Mi`;
    }
  }

  /**
   * Calculate estimated cost from SDL
   */
  static estimateCost(sdl: SDL): {
    totalUAKT: number;
    breakdown: Record<string, number>;
  } {
    const breakdown: Record<string, number> = {};
    let totalUAKT = 0;

    for (const [serviceName, deployConfig] of Object.entries(sdl.deployment)) {
      for (const [placementName, config] of Object.entries(deployConfig)) {
        const pricing = sdl.profiles.placement[placementName]?.pricing[serviceName];
        if (pricing) {
          const serviceCount = config.count;
          const costPerService = pricing.amount;
          const serviceCost = serviceCount * costPerService;

          breakdown[serviceName] = serviceCost;
          totalUAKT += serviceCost;
        }
      }
    }

    return { totalUAKT, breakdown };
  }

  /**
   * Extract service endpoints from SDL
   */
  static extractEndpoints(sdl: SDL): Record<string, SDLExpose[]> {
    const endpoints: Record<string, SDLExpose[]> = {};

    for (const [serviceName, service] of Object.entries(sdl.services)) {
      if (service.expose) {
        endpoints[serviceName] = service.expose.filter(exp =>
          exp.to?.some(t => t.global === true)
        );
      }
    }

    return endpoints;
  }
}

export default SDLParser;
