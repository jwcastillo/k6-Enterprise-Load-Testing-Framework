import { check, sleep } from 'k6';
import http from 'k6/http';
import { ConfigLoader } from '../../../core/config.js';
import { RequestHelper } from '../../../shared/helpers/RequestHelper.js';

// Load configuration
const config = new ConfigLoader().load();

export const options = {
  scenarios: config.scenarios ||{
    config_tests: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      maxDuration: '30s',
    }
  },
  thresholds: config.thresholds || {},
};

export default function () {
  const testCases = config.test_cases || [];

  if (testCases.length === 0) {
    console.log('No test cases defined in configuration.');
    return;
  }

  testCases.forEach((testCase: any) => {
    console.log(`Executing: ${testCase.name}`);

    const url = `${config.baseUrl}${testCase.path}`;
    const params: any = {
      headers: testCase.headers || {},
      tags: { name: testCase.name }
    };

    // Handle Auth if specified (simple example)
    if (testCase.auth && config.auth_token) {
      params.headers = RequestHelper.mergeHeaders(
        params.headers,
        RequestHelper.buildAuthHeaders(config.auth_token)
      );
    }

    let res: any;
    const body = testCase.body ? JSON.stringify(testCase.body) : null;

    switch (testCase.method.toUpperCase()) {
      case 'GET':
        res = http.get(url, params);
        break;
      case 'POST':
        res = http.post(url, body, params);
        break;
      case 'PUT':
        res = http.put(url, body, params);
        break;
      case 'PATCH':
        res = http.patch(url, body, params);
        break;
      case 'DELETE':
        res = http.del(url, body, params);
        break;
      default:
        console.error(`Unsupported method: ${testCase.method}`);
        return;
    }

    // Standard Status Check
    const checks: Record<string, (r: any) => boolean> = {
      [`${testCase.name} - status is ${testCase.expected_status}`]: (r: any) => r.status === testCase.expected_status,
    };

    // Dynamic Checks from Config
    if (testCase.checks) {
      Object.keys(testCase.checks).forEach((checkName) => {
        const checkExpression = testCase.checks[checkName];
        try {
          // Create a safe evaluation context
          // We expose a helper 'json' function to make paths easier: json('data.id')
          const json = (path: string) => RequestHelper.extractValue(res, path);
          
          // Use Function constructor for dynamic evaluation (safer than eval, but still needs care)
          // In k6 context this is generally acceptable for test logic
          const checkFn = new Function('res', 'json', `return ${checkExpression}`);
          
          checks[`${testCase.name} - ${checkName}`] = () => checkFn(res, json);
        } catch (e: any) {
          console.error(`Failed to create check '${checkName}': ${e.message}`);
          checks[`${testCase.name} - ${checkName} (ERROR)`] = () => false;
        }
      });
    }

    check(res, checks);
    sleep(1);
  });
}
