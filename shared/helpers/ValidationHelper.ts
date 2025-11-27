import { RefinedResponse } from 'k6/http';

/**
 * ValidationHelper - Utility functions for validating responses and data
 */

export class ValidationHelper {
  /**
   * Validate HTTP status code
   */
  public static isStatusOk(response: RefinedResponse<any>): boolean {
    return response.status >= 200 && response.status < 300;
  }

  /**
   * Validate specific status code
   */
  public static hasStatus(response: RefinedResponse<any>, expectedStatus: number): boolean {
    return response.status === expectedStatus;
  }

  /**
   * Validate response time
   */
  public static isResponseTimeLessThan(response: RefinedResponse<any>, maxMs: number): boolean {
    return response.timings.duration < maxMs;
  }

  /**
   * Validate JSON response structure
   */
  public static hasJsonStructure(response: RefinedResponse<any>, keys: string[]): boolean {
    try {
      if (!response.body) return false;
      const json = JSON.parse(response.body as string);
      return keys.every(key => key in json);
    } catch {
      return false;
    }
  }

  /**
   * Validate response has body
   */
  public static hasBody(response: RefinedResponse<any>): boolean {
    return response.body !== null && response.body !== undefined && response.body !== '';
  }

  /**
   * Validate email format
   */
  public static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL format
   */
  public static isValidUrl(url: string): boolean {
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
    return urlPattern.test(url);
  }

  /**
   * Validate string is not empty
   */
  public static isNotEmpty(value: string | null | undefined): boolean {
    return value !== null && value !== undefined && value.trim() !== '';
  }

  /**
   * Validate number is in range
   */
  public static isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }

  /**
   * Validate array is not empty
   */
  public static isArrayNotEmpty<T>(array: T[] | null | undefined): boolean {
    return Array.isArray(array) && array.length > 0;
  }

  /**
   * Validate object has property
   */
  public static hasProperty(obj: any, property: string): boolean {
    return obj && typeof obj === 'object' && property in obj;
  }

  /**
   * Validate all properties exist
   */
  public static hasAllProperties(obj: any, properties: string[]): boolean {
    return properties.every(prop => this.hasProperty(obj, prop));
  }

  /**
   * Validate response content type
   */
  public static isContentType(response: RefinedResponse<any>, expectedType: string): boolean {
    const contentType = response.headers['Content-Type'] || response.headers['content-type'];
    return contentType ? contentType.includes(expectedType) : false;
  }

  /**
   * Validate JSON response
   */
  public static isJson(response: RefinedResponse<any>): boolean {
    return this.isContentType(response, 'application/json');
  }

  /**
   * Validate response contains text
   */
  public static bodyContains(response: RefinedResponse<any>, text: string): boolean {
    if (!response.body) return false;
    return (response.body as string).includes(text);
  }

  /**
   * Validate response matches regex
   */
  public static bodyMatches(response: RefinedResponse<any>, pattern: RegExp): boolean {
    if (!response.body) return false;
    return pattern.test(response.body as string);
  }

  /**
   * Create validation result object
   */
  public static createCheckResult(name: string, passed: boolean, message?: string): Record<string, boolean> {
    if (!passed && message) {
      console.error(`Validation failed: ${name} - ${message}`);
    }
    return { [name]: passed };
  }

  /**
   * Validate multiple conditions
   */
  public static validateAll(checks: Record<string, boolean>): boolean {
    return Object.values(checks).every(result => result === true);
  }

  /**
   * Validate phone number format (basic validation)
   */
  public static isValidPhone(phone: string): boolean {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    // Check if it has 10-15 digits (international format)
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  /**
   * Validate credit card number using Luhn algorithm
   */
  public static isValidCreditCard(cardNumber: string): boolean {
    // Remove spaces and dashes
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    
    // Check if it contains only digits and has valid length
    if (!/^\d{13,19}$/.test(cleaned)) {
      return false;
    }

    // Luhn algorithm
    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Validate postal/zip code (US format)
   */
  public static isValidPostalCode(code: string, country: string = 'US'): boolean {
    const patterns: Record<string, RegExp> = {
      'US': /^\d{5}(-\d{4})?$/,
      'CA': /^[A-Z]\d[A-Z] \d[A-Z]\d$/i,
      'UK': /^[A-Z]{1,2}\d{1,2} \d[A-Z]{2}$/i,
      'DE': /^\d{5}$/,
      'FR': /^\d{5}$/,
    };

    const pattern = patterns[country.toUpperCase()];
    return pattern ? pattern.test(code) : false;
  }

  /**
   * Validate IP address (v4 and v6)
   */
  public static isValidIPAddress(ip: string): boolean {
    // IPv4 pattern
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Pattern.test(ip)) {
      const parts = ip.split('.');
      return parts.every(part => {
        const num = parseInt(part);
        return num >= 0 && num <= 255;
      });
    }

    // IPv6 pattern (simplified)
    const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv6Pattern.test(ip);
  }

  /**
   * Validate UUID format
   */
  public static isValidUUID(uuid: string): boolean {
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidPattern.test(uuid);
  }

  /**
   * Validate value matches regex pattern
   */
  public static matchesPattern(value: string, pattern: RegExp): boolean {
    return pattern.test(value);
  }

  /**
   * Validate string length is within range
   */
  public static isLengthInRange(value: string, min: number, max: number): boolean {
    return value.length >= min && value.length <= max;
  }

  /**
   * Validate number is positive
   */
  public static isPositive(value: number): boolean {
    return value > 0;
  }

  /**
   * Validate number is negative
   */
  public static isNegative(value: number): boolean {
    return value < 0;
  }

  /**
   * Validate value is integer
   */
  public static isInteger(value: number): boolean {
    return Number.isInteger(value);
  }

  /**
   * Validate date is valid
   */
  public static isValidDate(date: any): boolean {
    if (date instanceof Date) {
      return !isNaN(date.getTime());
    }
    if (typeof date === 'string') {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }
    return false;
  }

  /**
   * Validate JSON string
   */
  public static isValidJson(jsonString: string): boolean {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  }
}
