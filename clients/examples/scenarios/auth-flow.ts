import { check, sleep } from 'k6';
import { AuthService } from '../lib/services/AuthService.js';
import { DataHelper } from '../../../shared/helpers/DataHelper.js';

const config = JSON.parse(open('../config/default.json'));
const service = new AuthService(config.baseUrl);

export const options = {
  scenarios: {
    auth: config.scenarios.auth
  },
  thresholds: config.thresholds
};

export default function () {
  const credentials = {
    username: 'user_' + DataHelper.randomString(5),
    password: 'password123'
  };
  let token: string;

  // 1. Login
  const loginRes = service.login(credentials);
  
  const success = check(loginRes, {
    'login successful': (r) => r.status === 200 && r.json('token') !== undefined
  });

  if (!success) return;

  token = loginRes.json('token') as string;
  service.setToken(token);

  sleep(1);

  // 2. Access Protected Resource
  const profileRes = service.getProfile();
  check(profileRes, {
    'profile access allowed': (r) => r.status === 200
  });

  sleep(1);

  // 3. Refresh Token
  const refreshRes = service.refreshToken(token);
  check(refreshRes, {
    'refresh successful': (r) => r.status === 200
  });
  
  if (refreshRes.status === 200) {
    token = refreshRes.json('token') as string;
    service.setToken(token);
  }

  sleep(1);

  // 4. Logout
  const logoutRes = service.logout();
  check(logoutRes, {
    'logout successful': (r) => r.status === 200
  });
}
