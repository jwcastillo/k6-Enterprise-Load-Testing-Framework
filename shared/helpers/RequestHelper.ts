import http, { RefinedParams, RefinedResponse } from 'k6/http';
// @ts-ignore
import { HttpInstrumentation as TempoInstrumentation } from 'https://jslib.k6.io/http-instrumentation-tempo/1.0.0/index.js';
// @ts-ignore
import { HttpInstrumentation as PyroscopeInstrumentation } from 'https://jslib.k6.io/http-instrumentation-pyroscope/1.0.0/index.js';
import { ChaosHelper } from './ChaosHelper.js';

/**
 * RequestHelper - Utility for building and executing HTTP requests
 */
export class RequestHelper {
  private baseUrl: string;
  private headers: { [key: string]: string };
  private httpClient: typeof http;
  private defaultHeaders: { [key: string]: string };

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {};
    this.headers = this.defaultHeaders; // Alias for backward compatibility if needed

    // Initialize HTTP client with default k6 http
    this.httpClient = http;

    // Apply Tempo Tracing if enabled
    if (__ENV.K6_TEMPO_ENABLED === 'true') {
      console.log('✨ Enabling Tempo Tracing instrumentation');
      try {
        const tempo = new TempoInstrumentation(this.httpClient, {
          propagation: __ENV.K6_TEMPO_PROPAGATION || 'w3c',
        });
        this.httpClient = tempo.client;
      } catch (e) {
        console.warn('Failed to initialize Tempo instrumentation:', e);
      }
    }

    // Apply Pyroscope Profiling if enabled
    if (__ENV.K6_PYROSCOPE_ENABLED === 'true') {
      console.log('🔥 Enabling Pyroscope Profiling instrumentation');
      try {
        const pyroscope = new PyroscopeInstrumentation(this.httpClient);
        this.httpClient = pyroscope.client;
      } catch (e) {
        console.warn('Failed to initialize Pyroscope instrumentation:', e);
      }
    }
  }

  /**
   * Log debug information if K6_DEBUG is enabled
   */
  private logDebug(method: string, url: string, params?: any, response?: RefinedResponse<any>): void {
    if (__ENV.K6_DEBUG === 'true') {
      console.log(`\n🔍 [DEBUG] ${method} ${url}`);
      if (params) {
        console.log('   Request Headers:', JSON.stringify(params.headers || {}));
        if (params.body) console.log('   Request Body:', params.body);
      }
      
      if (response) {
        console.log(`   Response Status: ${response.status}`);
        console.log('   Response Headers:', JSON.stringify(response.headers || {}));
        // Only log body if it's text/json and not too large
        if (response.body && typeof response.body === 'string' && response.body.length < 2000) {
          console.log('   Response Body:', response.body);
        } else if (response.body) {
          console.log('   Response Body: [Binary or too large]');
        }
      }
    }
  }

  /**
   * Build full URL from path
   */
  public buildUrl(path: string, params?: Record<string, string>): string {
    let url = `${this.baseUrl}${path}`;
    
    if (params) {
      const queryString = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      url += `?${queryString}`;
    }
    
    return url;
  }

  /**
   * Merge headers
   */
  public buildHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
    return {
      ...this.defaultHeaders,
      ...additionalHeaders
    };
  }

  /**
   * Build request params
   */
  public buildParams(options?: Partial<RefinedParams<any>>): RefinedParams<any> {
    return {
      headers: this.defaultHeaders,
      ...options
    } as RefinedParams<any>;
  }

  /**
   * GET request
   */
  public get(path: string, params?: Record<string, string>, headers?: Record<string, string>): RefinedResponse<any> {
    // Chaos Injection
    if (ChaosHelper.apply()) {
      return ChaosHelper.getErrorResponse() as unknown as RefinedResponse<any>;
    }

    const url = this.buildUrl(path, params);
    const requestParams = this.buildParams({ headers: this.buildHeaders(headers) });
    this.logDebug('GET', url, requestParams);
    const response = this.httpClient.get(url, requestParams);
    this.logDebug('GET', url, null, response);
    return response;
  }

  /**
   * POST request
   */
  public post(path: string, body: any, headers?: Record<string, string>): RefinedResponse<any> {
    // Chaos Injection
    if (ChaosHelper.apply()) {
      return ChaosHelper.getErrorResponse() as unknown as RefinedResponse<any>;
    }

    const url = this.buildUrl(path);
    const payload = typeof body === 'string' ? body : JSON.stringify(body);
    const headersWithContentType = {
      'Content-Type': 'application/json',
      ...headers
    };
    const requestParams = this.buildParams({ headers: this.buildHeaders(headersWithContentType) });
    this.logDebug('POST', url, { ...requestParams, body: payload });
    const response = this.httpClient.post(url, payload, requestParams);
    this.logDebug('POST', url, null, response);
    return response;
  }

  /**
   * PUT request
   */
  public put(path: string, body: any, headers?: Record<string, string>): RefinedResponse<any> {
    const url = this.buildUrl(path);
    const payload = typeof body === 'string' ? body : JSON.stringify(body);
    const headersWithContentType = {
      'Content-Type': 'application/json',
      ...headers
    };
    const requestParams = this.buildParams({ headers: this.buildHeaders(headersWithContentType) });
    this.logDebug('PUT', url, { ...requestParams, body: payload });
    const response = this.httpClient.put(url, payload, requestParams);
    this.logDebug('PUT', url, null, response);
    return response;
  }

  /**
   * PATCH request
   */
  public patch(path: string, body: any, headers?: Record<string, string>): RefinedResponse<any> {
    const url = this.buildUrl(path);
    const payload = typeof body === 'string' ? body : JSON.stringify(body);
    const headersWithContentType = {
      'Content-Type': 'application/json',
      ...headers
    };
    const requestParams = this.buildParams({ headers: this.buildHeaders(headersWithContentType) });
    this.logDebug('PATCH', url, { ...requestParams, body: payload });
    const response = this.httpClient.patch(url, payload, requestParams);
    this.logDebug('PATCH', url, null, response);
    return response;
  }

  /**
   * DELETE request
   */
  public del(path: string, headers?: Record<string, string>): RefinedResponse<any> {
    const url = this.buildUrl(path);
    const requestParams = this.buildParams({ headers: this.buildHeaders(headers) });
    this.logDebug('DELETE', url, requestParams);
    const response = this.httpClient.del(url, null, requestParams);
    this.logDebug('DELETE', url, null, response);
    return response;
  }

  /**
   * Set authorization header
   */
  public setAuth(token: string, type: 'Bearer' | 'Token' | 'Basic' = 'Bearer'): void {
    this.defaultHeaders['Authorization'] = `${type} ${token}`;
  }

  /**
   * Remove authorization header
   */
  public clearAuth(): void {
    delete this.defaultHeaders['Authorization'];
  }

  /**
   * Set custom header
   */
  public setHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value;
  }

  /**
   * Remove custom header
   */
  public removeHeader(key: string): void {
    delete this.defaultHeaders[key];
  }

  // ============================================
  // Static Utility Methods
  // ============================================

  /**
   * Build authorization headers (static utility)
   */
  public static buildAuthHeaders(token: string, type: 'Bearer' | 'Token' | 'Basic' = 'Bearer'): Record<string, string> {
    return {
      'Authorization': `${type} ${token}`
    };
  }

  /**
   * Parse JSON response safely
   */
  public static parseJsonResponse<T = any>(response: RefinedResponse<any>): T | null {
    try {
      if (!response.body) return null;
      return JSON.parse(response.body as string) as T;
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      return null;
    }
  }

  /**
   * Extract nested value from JSON response
   * Example: extractValue(response, 'data.user.id')
   */
  public static extractValue(response: RefinedResponse<any>, path: string): any {
    const data = this.parseJsonResponse(response);
    if (!data) return undefined;

    const parts = path.split('.');
    let current: any = data;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Check if response is successful (2xx status)
   */
  public static isSuccess(response: RefinedResponse<any>): boolean {
    return response.status >= 200 && response.status < 300;
  }

  /**
   * Check if response has specific status code
   */
  public static hasStatus(response: RefinedResponse<any>, statusCode: number): boolean {
    return response.status === statusCode;
  }

  /**
   * Build query string from object
   */
  public static buildQueryString(params: Record<string, any>): string {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined) {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
      }
    }
    return parts.length > 0 ? `?${parts.join('&')}` : '';
  }

  /**
   * Merge multiple header objects
   */
  public static mergeHeaders(...headers: Record<string, string>[]): Record<string, string> {
    return Object.assign({}, ...headers);
  }

  /**
   * Get header value from response (case-insensitive)
   */
  public static getHeader(response: RefinedResponse<any>, headerName: string): string | undefined {
    const lowerHeaderName = headerName.toLowerCase();
    const key = Object.keys(response.headers).find(k => k.toLowerCase() === lowerHeaderName);
    return key ? response.headers[key] : undefined;
  }

  /**
   * Check if response is JSON
   */
  public static isJson(response: RefinedResponse<any>): boolean {
    const contentType = this.getHeader(response, 'content-type');
    return contentType ? contentType.includes('application/json') : false;
  }

  /**
   * Build correlation ID for request tracking
   */
  public static correlationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Common HTTP headers presets
   */
  public static readonly Headers = {
    JSON: { 'Content-Type': 'application/json' },
    FORM: { 'Content-Type': 'application/x-www-form-urlencoded' },
    MULTIPART: { 'Content-Type': 'multipart/form-data' },
    TEXT: { 'Content-Type': 'text/plain' },
    XML: { 'Content-Type': 'application/xml' },
  };
}
