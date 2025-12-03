import http, { Response } from 'k6/http';
import { BaseService } from '../../../core/service.js';

/**
 * ExampleService - Service for interacting with the example API
 * Extends BaseService for common functionality
 */
export class ExampleService extends BaseService {
  /**
   * Initialize ExampleService
   * @param baseUrl - The base URL for the API
   */
  constructor(baseUrl: string) {
    super(baseUrl);
  }

  /**
   * Get the homepage content
   * @returns The k6 HTTP response
   */
  public getHomepage(): Response {
    return http.get(this.getUrl('/'));
  }

  /**
   * Get the features page content
   * @returns The k6 HTTP response
   */
  public getFeatures(): Response {
    return http.get(this.getUrl('/features'));
  }
}
