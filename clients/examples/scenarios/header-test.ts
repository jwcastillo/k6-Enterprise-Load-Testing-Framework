import { check } from 'k6';
import { RequestHelper } from '../../../shared/helpers/RequestHelper.js';
import { HeaderHelper } from '../../../shared/helpers/HeaderHelper.js';

export const options = {
  vus: 1,
  iterations: 1,
};

export default function () {
  console.log('🧪 Starting Header Management System Verification');

  // 1. Test HeaderHelper directly
  console.log('Checking HeaderHelper.getStandardHeaders()...');
  const standardHeaders = HeaderHelper.getStandardHeaders('US', 'track-123', 'req-456', 'token-789');
  
  check(standardHeaders, {
    'HeaderHelper: has correlation id': (h) => h['X-Correlation-ID'] === 'track-123',
    'HeaderHelper: has trace id': (h) => h['X-Trace-ID'] === 'track-123',
    'HeaderHelper: has request id': (h) => h['X-Request-ID'] === 'req-456',
    'HeaderHelper: has auth token': (h) => h['Authorization'] === 'Bearer token-789',
    'HeaderHelper: has country': (h) => h['X-Country'] === 'US',
    'HeaderHelper: has lang': (h) => h['Accept-Language'] === 'en-US',
    'HeaderHelper: has user agent': (h) => h['User-Agent'] === 'k6-performance-test',
  });

  // 2. Test RequestHelper integration
  console.log('Checking RequestHelper.applyStandardHeaders()...');
  const request = new RequestHelper('http://example.com');
  
  // Initial state
  const initialHeaders = request.buildHeaders();
  check(initialHeaders, {
    'RequestHelper: initially empty (except defaults)': (h) => !h['X-Correlation-ID'],
  });

  // Apply headers
  request.applyStandardHeaders('CA', 'my-token');
  
  const finalHeaders = request.buildHeaders();
  check(finalHeaders, {
    'RequestHelper: has correlation id after apply': (h) => h['X-Correlation-ID'] !== undefined,
    'RequestHelper: has country CA': (h) => h['X-Country'] === 'CA',
    'RequestHelper: has token': (h) => h['Authorization'] === 'Bearer my-token',
  });

  console.log('✅ Header Verification Complete');
}
