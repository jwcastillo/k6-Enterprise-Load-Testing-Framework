import { DataHelper } from './DataHelper.js';

/**
 * HeaderHelper - Utility for managing standard corporate headers
 */
export class HeaderHelper {
  /**
   * Generate standard corporate headers
   */
  public static getStandardHeaders(
    country: string = 'US',
    trackId: string = DataHelper.uuid(),
    requestId: string = DataHelper.uuid(),
    token: string | null = null
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': 'k6-performance-test',
      'X-Request-ID': requestId,
      'X-Correlation-ID': trackId,
      'X-Trace-ID': trackId,
      'X-Session-ID': DataHelper.uuid(),
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': `en-${country}`,
      'X-Country': country,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Environment specific headers
    // @ts-ignore
    if (__ENV.ENVIRONMENT_NAME && __ENV.ENVIRONMENT_NAME.toLowerCase() === 'dev') {
       // @ts-ignore
       if (__ENV.SECURITY_TOKEN) {
         // @ts-ignore
         headers['X-Security-Token'] = __ENV.SECURITY_TOKEN;
       }
    }

    return headers;
  }

  /**
   * Merge headers
   */
  public static mergeHeaders(base: Record<string, string>, additional: Record<string, string>): Record<string, string> {
    return { ...base, ...additional };
  }
}
