import { check, sleep } from 'k6';
import { ConfigLoader } from '../../../core/config.js';
import { ExampleService } from '../lib/example-service.js';
import { ValidationHelper } from '../../../shared/helpers/ValidationHelper.js';

const config = new ConfigLoader().load();
const service = new ExampleService(config.baseUrl);

export const options = {
  scenarios: config.scenarios || {
    default: {
      executor: 'constant-vus',
      vus: 1,
      duration: '10s'
    }
  },
  thresholds: config.thresholds || {},
};

export default function () {
  const res = service.getHomepage();
  check(res, { 
    'status was 200': (r) => ValidationHelper.hasStatus(r, 200),
    'response time < 500ms': (r) => ValidationHelper.isResponseTimeLessThan(r, 500)
  });
  sleep(1);
}
