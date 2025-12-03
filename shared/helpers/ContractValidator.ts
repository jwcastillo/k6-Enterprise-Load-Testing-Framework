/**
 * ContractValidator - API Contract Testing Helper
 * Validates API responses against JSON Schema contracts
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class ContractValidator {
  /**
   * Validate data against a JSON Schema
   */
  public static validateSchema(data: any, schema: any): ValidationResult {
    const errors: string[] = [];
    
    try {
      this.validateObject(data, schema, '', errors);
    } catch (error: any) {
      errors.push(`Validation error: ${error.message}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Recursive validation logic
   */
  private static validateObject(data: any, schema: any, path: string, errors: string[]): void {
    // Type validation
    if (schema.type) {
      const actualType = Array.isArray(data) ? 'array' : typeof data;
      if (actualType !== schema.type) {
        errors.push(`${path || 'root'}: Expected type '${schema.type}', got '${actualType}'`);
        return;
      }
    }

    // Required properties
    if (schema.required && schema.type === 'object') {
      for (const requiredProp of schema.required) {
        if (!(requiredProp in data)) {
          errors.push(`${path || 'root'}: Missing required property '${requiredProp}'`);
        }
      }
    }

    // Properties validation
    if (schema.properties && schema.type === 'object') {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in data) {
          const newPath = path ? `${path}.${key}` : key;
          this.validateObject(data[key], propSchema, newPath, errors);
        }
      }
    }

    // Array items validation
    if (schema.items && schema.type === 'array') {
      data.forEach((item: any, index: number) => {
        const newPath = `${path}[${index}]`;
        this.validateObject(item, schema.items, newPath, errors);
      });
    }

    // String validations
    if (schema.type === 'string') {
      if (schema.minLength !== undefined && data.length < schema.minLength) {
        errors.push(`${path}: String length ${data.length} is less than minimum ${schema.minLength}`);
      }
      if (schema.maxLength !== undefined && data.length > schema.maxLength) {
        errors.push(`${path}: String length ${data.length} exceeds maximum ${schema.maxLength}`);
      }
      if (schema.pattern) {
        const regex = new RegExp(schema.pattern);
        if (!regex.test(data)) {
          errors.push(`${path}: String does not match pattern ${schema.pattern}`);
        }
      }
      if (schema.format === 'email' && !this.isValidEmail(data)) {
        errors.push(`${path}: Invalid email format`);
      }
      if (schema.format === 'uri' && !this.isValidUri(data)) {
        errors.push(`${path}: Invalid URI format`);
      }
    }

    // Number validations
    if (schema.type === 'number' || schema.type === 'integer') {
      if (schema.minimum !== undefined && data < schema.minimum) {
        errors.push(`${path}: Value ${data} is less than minimum ${schema.minimum}`);
      }
      if (schema.maximum !== undefined && data > schema.maximum) {
        errors.push(`${path}: Value ${data} exceeds maximum ${schema.maximum}`);
      }
      if (schema.type === 'integer' && !Number.isInteger(data)) {
        errors.push(`${path}: Expected integer, got ${data}`);
      }
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(data)) {
      errors.push(`${path}: Value '${data}' is not in allowed values: ${schema.enum.join(', ')}`);
    }
  }

  /**
   * Email validation
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * URI validation
   */
  private static isValidUri(uri: string): boolean {
    try {
      new URL(uri);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate OpenAPI response
   */
  public static validateOpenAPIResponse(response: any, openApiSpec: any, path: string, method: string, statusCode: number): ValidationResult {
    const errors: string[] = [];

    try {
      // Navigate to the response schema in OpenAPI spec
      const pathSpec = openApiSpec.paths?.[path];
      if (!pathSpec) {
        errors.push(`Path '${path}' not found in OpenAPI spec`);
        return { valid: false, errors };
      }

      const methodSpec = pathSpec[method.toLowerCase()];
      if (!methodSpec) {
        errors.push(`Method '${method}' not found for path '${path}'`);
        return { valid: false, errors };
      }

      const responseSpec = methodSpec.responses?.[statusCode.toString()];
      if (!responseSpec) {
        errors.push(`Response ${statusCode} not defined for ${method} ${path}`);
        return { valid: false, errors };
      }

      // Get schema from response
      const schema = responseSpec.content?.['application/json']?.schema;
      if (!schema) {
        // No schema defined, skip validation
        return { valid: true, errors: [] };
      }

      // Validate against schema
      return this.validateSchema(response, schema);
    } catch (error: any) {
      errors.push(`OpenAPI validation error: ${error.message}`);
      return { valid: false, errors };
    }
  }
}
