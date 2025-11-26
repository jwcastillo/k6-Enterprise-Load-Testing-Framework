import { browser } from 'k6/experimental/browser';
import { check, sleep } from 'k6';
import { ConfigLoader } from '../../../core/config.js';

const config = new ConfigLoader().load();

export const options = {
  scenarios: {
    ui: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
  thresholds: {
    'browser_web_vital_fcp': ['p(95)<3000'],
    'browser_web_vital_lcp': ['p(95)<4000'],
    'checks': ['rate>0.9']
  }
};

export default async function () {
  const page = browser.newPage();

  try {
    // Navigate to the homepage
    await page.goto(config.baseUrl || 'https://test.k6.io');
    
    check(page, {
      'page loaded': () => page.url() !== '',
    });

    // Take a screenshot
    page.screenshot({ path: 'screenshots/homepage.png' });

    sleep(1);

    // Interact with the page
    const headerText = page.locator('h1').textContent();
    check(headerText, {
      'header exists': (text) => text !== null && text.length > 0,
    });

    console.log(`Page title: ${page.title()}`);
    console.log(`Header text: ${headerText}`);

    sleep(2);

  } finally {
    page.close();
  }
}
