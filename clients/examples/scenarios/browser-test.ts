import { browser } from 'k6/browser';
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
  const page = await browser.newPage();

  try {
    // Navigate to the homepage
    await page.goto(config.baseUrl);
    
    check(page, {
      'page loaded': () => page.url() !== '',
    });

    // Take a screenshot
    page.screenshot({ path: 'screenshots/homepage.png' });

    sleep(1);

    // Interact with the page
    const heading = await page.locator('h2').textContent();
    check(page, {
      'heading is correct': () => heading === 'Welcome to the k6 browser demo',
      'heading is visible': () => heading !== null && heading.length > 0
    });

    console.log(`Page title: ${page.title()}`);
    console.log(`Header text: ${heading}`);

    sleep(2);

  } finally {
    page.close();
  }
}
