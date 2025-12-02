import { Response } from 'k6/http';

/**
 * BaseService - Abstract base class for all API services
 * Provides common functionality for URL construction and response validation
 */
export abstract class BaseService {
  protected baseUrl: string;

  /**
   * Initialize the service with a base URL
   * @param baseUrl - The base URL for the API
   */
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Construct a full URL from a path
   * @param path - The URL path (e.g., '/api/users')
   * @returns The full URL
   */
  protected getUrl(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  /**
   * Validate a response (helper method)
   * @param response - The k6 HTTP response object
   * @param checkName - Name of the check for logging/reporting
   * @returns True if validation passes, false otherwise
   */
  protected validate(response: Response, checkName: string): boolean {
    // This can be expanded to use k6 checks
    return response.status === 200;
  }
}
