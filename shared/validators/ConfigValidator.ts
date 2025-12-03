import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

/**
 * ConfigValidator - Validates configuration files against JSON Schema
 * Supports both JSON and YAML formats
 */
export class ConfigValidator {
  private static ajv: Ajv;
  private static validator: ValidateFunction | null = null;

  /**
   * Initialize AJV with schema
   */
  private static init(): void {
    if (!this.ajv) {
      this.ajv = new Ajv({
        allErrors: true,
        verbose: true,
        strict: false
      });
      addFormats(this.ajv);

      // Load config schema
      const schemaPath = path.join(process.cwd(), 'shared/schemas/config.schema.json');
      const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
      this.validator = this.ajv.compile(schema);
    }
  }

  /**
   * Validate configuration object
   */
  static validate(config: any): { valid: boolean; errors: string[] } {
    this.init();

    if (!this.validator) {
      return {
        valid: false,
        errors: ['Schema validator not initialized']
      };
    }

    const valid = this.validator(config);

    if (!valid && this.validator.errors) {
      const errors = this.validator.errors.map(err => {
        const path = err.instancePath || 'root';
        const message = err.message || 'Unknown error';
        const params = err.params ? ` (${JSON.stringify(err.params)})` : '';
        return `${path}: ${message}${params}`;
      });

      return { valid: false, errors };
    }

    return { valid: true, errors: [] };
  }

  /**
   * Load config from file (supports JSON and YAML)
   */
  private static loadConfigFile(filePath: string): any {
    const content = fs.readFileSync(filePath, 'utf-8');
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.json') {
      return JSON.parse(content);
    } else if (ext === '.yaml' || ext === '.yml') {
      return yaml.load(content);
    } else {
      // Try to parse as JSON first, then YAML
      try {
        return JSON.parse(content);
      } catch {
        return yaml.load(content);
      }
    }
  }

  /**
   * Validate configuration file (supports JSON and YAML)
   */
  static validateFile(filePath: string): { valid: boolean; errors: string[]; config?: any } {
    try {
      const config = this.loadConfigFile(filePath);
      const result = this.validate(config);
      return { ...result, config };
    } catch (error) {
      return {
        valid: false,
        errors: [`Failed to read or parse config file: ${error}`]
      };
    }
  }

  /**
   * Validate and throw if invalid
   */
  static validateOrThrow(config: any): void {
    const result = this.validate(config);
    if (!result.valid) {
      throw new Error(`Configuration validation failed:\n${result.errors.join('\n')}`);
    }
  }

  /**
   * Get schema for documentation
   */
  static getSchema(): any {
    const schemaPath = path.join(process.cwd(), 'shared/schemas/config.schema.json');
    return JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
  }

  /**
   * Generate example config (JSON format)
   */
  static generateExampleJSON(): any {
    return {
      baseUrl: 'https://api.example.com',
      scenarios: {
        default: {
          executor: 'constant-vus',
          vus: 10,
          duration: '30s'
        },
        ramp: {
          executor: 'ramping-vus',
          startVUs: 0,
          stages: [
            { target: 10, duration: '30s' },
            { target: 10, duration: '1m' },
            { target: 0, duration: '30s' }
          ]
        }
      },
      thresholds: {
        'http_req_duration': ['p(95)<500', 'p(99)<1000'],
        'http_req_failed': ['rate<0.01'],
        'checks': ['rate>0.95']
      },
      tags: {
        environment: 'staging',
        team: 'qa'
      }
    };
  }

  /**
   * Generate example config (YAML format)
   */
  static generateExampleYAML(): string {
    const example = this.generateExampleJSON();
    return yaml.dump(example, {
      indent: 2,
      lineWidth: 120,
      noRefs: true
    });
  }

  /**
   * Convert JSON config to YAML
   */
  static toYAML(config: any): string {
    return yaml.dump(config, {
      indent: 2,
      lineWidth: 120,
      noRefs: true
    });
  }

  /**
   * Convert YAML config to JSON
   */
  static toJSON(yamlContent: string): any {
    return yaml.load(yamlContent);
  }
}

