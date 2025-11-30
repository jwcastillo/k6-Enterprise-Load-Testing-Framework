import { check } from 'k6';
import { RequestHelper } from '../../../shared/helpers/RequestHelper.js';

const config = JSON.parse(open('../config/default.json'));
const request = new RequestHelper(config.baseUrl);

export const options = {
  scenarios: {
    baseline: config.scenarios.baseline
  },
  thresholds: config.thresholds
};

export default function () {
  // Minimal overhead test - just hitting a health endpoint
  const res = request.get('/api/health');

  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
