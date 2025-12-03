import { browser } from 'k6/browser';
import { check, sleep } from 'k6';
import { ConfigLoader } from '../../../core/config.js';
import { AuthService } from '../lib/auth-service.js';
import { DataHelper } from '../../../shared/helpers/DataHelper.js';
import { ValidationHelper } from '../../../shared/helpers/ValidationHelper.js';

const config = new ConfigLoader().load();
const authService = new AuthService(config.baseUrl);

export const options = {
  scenarios: {
    mixed: {
      executor: 'constant-vus',
      vus: 1,
      duration: '1m',
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<2000'],
    'browser_web_vital_lcp': ['p(95)<4000'],
    'checks': ['rate>0.9']
  }
};

export default async function () {
  // PART 1: API - Create user via API
  const username = `user_${DataHelper.randomString(8)}`;
  const email = DataHelper.randomEmail();
  const password = DataHelper.randomPassword();

  console.log(`Creating user ${username} via API...`);
  const registerRes = authService.register(username, email, password);
  const apiCheck = check(registerRes, {
    'API: user created': (r) => ValidationHelper.hasStatus(r, 201),
  });

  if (!apiCheck) {
    console.error('Failed to create user via API');
    return;
  }

  sleep(2);

  // PART 2: Browser - Login via UI
  const page = await browser.newPage();

  try {
    console.log('Opening login page in browser...');
    await page.goto(`${config.baseUrl}/login`);

    // Fill login form
    page.locator('input[name="username"]').type(username);
    page.locator('input[name="password"]').type(password);
    
    // Take screenshot before login
    const timestamp = Date.now();
    page.screenshot({ path: `screenshots/before-login-${timestamp}.png` });

    // Submit form
    await Promise.all([
      page.waitForNavigation(),
      page.locator('button[type="submit"]').click(),
    ]);

    // Verify login success
    const isVisible = await page.locator('.welcome-message').isVisible();
    const uiCheck = check(page, {
      'Browser: login successful': () => page.url().includes('/dashboard'),
      'Browser: welcome message visible': () => isVisible,
    });

    // Take screenshot after login
    page.screenshot({ path: `screenshots/after-login-${timestamp}.png` });

    console.log(`Mixed test completed for user ${username}`);

    sleep(2);

  } finally {
    page.close();
  }

  // PART 3: API - Cleanup (logout via API)
  const loginRes = authService.login(username, password);
  if (loginRes.status === 200 && loginRes.body) {
    const token = JSON.parse(loginRes.body as string).auth_token;
    authService.logout(token);
    console.log(`User ${username} logged out via API`);
  }
}
