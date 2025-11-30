import { check } from 'k6';
import { RequestHelper } from '../../../shared/helpers/RequestHelper';
import { ContractValidator } from '../../../shared/helpers/ContractValidator';

const config = JSON.parse(open('../config/default.json'));
const request = new RequestHelper(config.baseUrl);

// Load contract schema
const userSchema = JSON.parse(open('../contracts/user-api.schema.json'));

export const options = {
  vus: 1,
  duration: '10s'
};

export default function () {
  // Make API request
  const res = request.get('/api/users/1');

  // Parse response
  const userData = JSON.parse(res.body as string);

  // Validate against contract
  const validation = ContractValidator.validateSchema(userData, userSchema);

  // Check if response matches contract
  check(validation, {
    'response matches contract': (v) => v.valid,
    'no validation errors': (v) => v.errors.length === 0
  });

  // Log validation errors if any
  if (!validation.valid) {
    console.error('Contract validation failed:');
    validation.errors.forEach(err => console.error(`  - ${err}`));
  }

  // Additional checks
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response has id': () => 'id' in userData,
    'response has email': () => 'email' in userData
  });
}
