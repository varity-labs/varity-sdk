/**
 * SDL Parser Tests
 */

import SDLParser, { SDL } from '../SDLParser';

describe('SDLParser', () => {
  const validSDL: SDL = {
    version: '2.0',
    services: {
      web: {
        image: 'nginx:latest',
        expose: [
          {
            port: 80,
            as: 80,
            to: [{ global: true }],
          },
        ],
      },
    },
    profiles: {
      compute: {
        web: {
          resources: {
            cpu: {
              units: 0.5,
            },
            memory: {
              size: '512Mi',
            },
            storage: {
              size: '512Mi',
            },
          },
        },
      },
      placement: {
        default: {
          pricing: {
            web: {
              denom: 'uakt',
              amount: 100,
            },
          },
        },
      },
    },
    deployment: {
      web: {
        default: {
          profile: 'web',
          count: 1,
        },
      },
    },
  };

  describe('parse', () => {
    it('should parse valid SDL YAML', () => {
      const yaml = `
version: "2.0"
services:
  web:
    image: nginx:latest
    expose:
      - port: 80
        as: 80
        to:
          - global: true
profiles:
  compute:
    web:
      resources:
        cpu:
          units: 0.5
        memory:
          size: 512Mi
        storage:
          size: 512Mi
  placement:
    default:
      pricing:
        web:
          denom: uakt
          amount: 100
deployment:
  web:
    default:
      profile: web
      count: 1
`;

      const sdl = SDLParser.parse(yaml);

      expect(sdl.version).toBe('2.0');
      expect(sdl.services.web.image).toBe('nginx:latest');
      expect(sdl.profiles.compute.web.resources.cpu.units).toBe(0.5);
    });

    it('should throw error for invalid YAML', () => {
      const invalidYaml = 'invalid: yaml: structure:::';

      expect(() => SDLParser.parse(invalidYaml)).toThrow();
    });

    it('should throw error for missing version', () => {
      const yaml = `
services:
  web:
    image: nginx
`;

      expect(() => SDLParser.parse(yaml)).toThrow('SDL version is required');
    });
  });

  describe('stringify', () => {
    it('should convert SDL to YAML string', () => {
      const yaml = SDLParser.stringify(validSDL);

      expect(yaml).toContain('version: "2.0"');
      expect(yaml).toContain('nginx:latest');
      expect(yaml).toContain('uakt');
    });
  });

  describe('validate', () => {
    it('should validate correct SDL structure', () => {
      expect(() => SDLParser.validate(validSDL)).not.toThrow();
    });

    it('should reject SDL without services', () => {
      const invalidSDL: any = {
        version: '2.0',
        services: {},
        profiles: validSDL.profiles,
        deployment: validSDL.deployment,
      };

      expect(() => SDLParser.validate(invalidSDL)).toThrow(
        'SDL must define at least one service'
      );
    });

    it('should reject service without image', () => {
      const invalidSDL: any = {
        ...validSDL,
        services: {
          web: {
            expose: [],
          },
        },
      };

      expect(() => SDLParser.validate(invalidSDL)).toThrow(
        'Service web must specify an image'
      );
    });

    it('should reject SDL without compute profiles', () => {
      const invalidSDL: any = {
        ...validSDL,
        profiles: {
          placement: validSDL.profiles.placement,
        },
      };

      expect(() => SDLParser.validate(invalidSDL)).toThrow(
        'SDL compute profiles are required'
      );
    });

    it('should reject compute profile without CPU', () => {
      const invalidSDL: any = {
        ...validSDL,
        profiles: {
          compute: {
            web: {
              resources: {
                memory: { size: '512Mi' },
              },
            },
          },
          placement: validSDL.profiles.placement,
        },
      };

      expect(() => SDLParser.validate(invalidSDL)).toThrow(
        'Compute profile web must define CPU resources'
      );
    });
  });

  describe('normalizeResources', () => {
    it('should normalize CPU string to number', () => {
      const resources = {
        cpu: { units: '2' as any },
        memory: { size: '2Gi' },
      };

      const normalized = SDLParser.normalizeResources(resources);

      expect(normalized.cpu.units).toBe(2);
    });

    it('should normalize CPU millicores to cores', () => {
      const resources = {
        cpu: { units: '2000m' as any },
        memory: { size: '2Gi' },
      };

      const normalized = SDLParser.normalizeResources(resources);

      expect(normalized.cpu.units).toBe(2);
    });

    it('should normalize memory from MB to standard format', () => {
      const resources = {
        cpu: { units: 1 },
        memory: { size: '2048' },
      };

      const normalized = SDLParser.normalizeResources(resources);

      expect(normalized.memory.size).toMatch(/\d+[MG]i/);
    });
  });

  describe('estimateCost', () => {
    it('should calculate total cost from SDL', () => {
      const cost = SDLParser.estimateCost(validSDL);

      expect(cost.totalUAKT).toBeGreaterThan(0);
      expect(cost.breakdown.web).toBe(100);
    });

    it('should handle multiple services', () => {
      const multiServiceSDL: SDL = {
        ...validSDL,
        services: {
          ...validSDL.services,
          api: {
            image: 'api:latest',
          },
        },
        profiles: {
          compute: {
            ...validSDL.profiles.compute,
            api: validSDL.profiles.compute.web,
          },
          placement: {
            default: {
              pricing: {
                web: { denom: 'uakt', amount: 100 },
                api: { denom: 'uakt', amount: 200 },
              },
            },
          },
        },
        deployment: {
          ...validSDL.deployment,
          api: {
            default: {
              profile: 'api',
              count: 1,
            },
          },
        },
      };

      const cost = SDLParser.estimateCost(multiServiceSDL);

      expect(cost.totalUAKT).toBe(300);
      expect(cost.breakdown.web).toBe(100);
      expect(cost.breakdown.api).toBe(200);
    });
  });

  describe('extractEndpoints', () => {
    it('should extract global endpoints from services', () => {
      const endpoints = SDLParser.extractEndpoints(validSDL);

      expect(endpoints.web).toBeDefined();
      expect(endpoints.web.length).toBe(1);
      expect(endpoints.web[0].port).toBe(80);
    });

    it('should filter non-global endpoints', () => {
      const sdlWithInternalService: SDL = {
        ...validSDL,
        services: {
          ...validSDL.services,
          db: {
            image: 'postgres:14',
            expose: [
              {
                port: 5432,
                to: [{ service: 'web' }],
              },
            ],
          },
        },
      };

      const endpoints = SDLParser.extractEndpoints(sdlWithInternalService);

      expect(endpoints.db).toBeDefined();
      expect(endpoints.db.length).toBe(0); // No global endpoints
    });
  });
});
