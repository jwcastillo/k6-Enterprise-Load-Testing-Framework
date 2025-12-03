import { check } from 'k6';
import { RequestHelper } from '../../../shared/helpers/RequestHelper.js';
import { DataHelper } from '../../../shared/helpers/DataHelper.js';

const config = JSON.parse(open('../config/default.json'));
const request = new RequestHelper(config.baseUrl);

export const options = {
  scenarios: {
    heavy_load: config.scenarios.heavy_load
  },
  thresholds: config.thresholds
};

export default function () {
  // Simulate heavy payload
  const payload = {
    id: DataHelper.uuid(),
    data: DataHelper.randomString(1024), // 1KB data
    timestamp: new Date().toISOString()
  };

  const res = request.post('/api/data', payload);

  check(res, {
    'status is 201': (r) => r.status === 201,
    'response time < 200ms': (r) => r.timings.duration < 200
  });
}
