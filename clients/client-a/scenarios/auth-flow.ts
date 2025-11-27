import { check, sleep } from 'k6';
import { ConfigLoader } from '../../../core/config.js';
import { AuthService } from '../lib/auth-service.js';
import { DataHelper } from '../../../shared/helpers/DataHelper.js';

const config = new ConfigLoader().load();
const authService = new AuthService(config.baseUrl);

export const options = {
  scenarios: config.scenarios || {
    default: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s'
    }
  },
  thresholds: config.thresholds || {
    'http_req_duration': ['p(95)<2000'],
    'checks': ['rate>0.9']
  },
};

// Shared data for the flow
let authToken = '';

export default function () {
  // Step 1: Register a new user
  const username = `user_${DataHelper.randomString(8)}`;
  const email = DataHelper.randomEmail();
  const password = DataHelper.randomPassword();

  const registerRes = authService.register(username, email, password);
  const registerSuccess = check(registerRes, {
    'registration successful': (r) => r.status === 201,
    'registration response has id': (r) => {
      if (!r.body) return false;
      return JSON.parse(r.body as string).id !== undefined;
    }
  });

  sleep(1);

  // Step 2: Login with the created user
  if (registerSuccess) {
    const loginRes = authService.login(username, password);
    const loginCheck = check(loginRes, {
      'login successful': (r) => r.status === 200,
      'login returns token': (r) => {
        if (!r.body) return false;
        return JSON.parse(r.body as string).auth_token !== undefined;
      }
    });

    if (loginCheck && loginRes.body) {
      authToken = JSON.parse(loginRes.body as string).auth_token;
      console.log(`User ${username} logged in successfully`);
    }

    sleep(1);

    // Step 3: Logout
    if (authToken) {
      const logoutRes = authService.logout(authToken);
      check(logoutRes, {
        'logout successful': (r) => r.status === 204
      });
      
      console.log(`User ${username} completed full auth flow`);
    }
  }

  sleep(2);
}
