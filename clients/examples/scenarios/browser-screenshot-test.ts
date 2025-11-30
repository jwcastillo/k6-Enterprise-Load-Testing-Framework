import { browser } from 'k6/browser';
import { check } from 'k6';

export const options = {
  scenarios: {
    browser: {
      executor: 'shared-iterations',
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
  thresholds: {
    checks: ['rate==1.0'],
  },
};

export default async function () {
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to example.com...');
    await page.goto('https://example.com');
    
    // Use the injected K6_REPORT_DIR environment variable
    const reportDir = __ENV.K6_REPORT_DIR || 'screenshots';
    
    console.log(`Taking screenshot to: ${reportDir}/example.png`);
    await page.screenshot({ path: `${reportDir}/example.png` });
    
    const headerText = await page.locator('h1').textContent();
    console.log('Header text:', headerText);
    
    check(page, {
      'header is visible': () => headerText == 'Example Domain',
    });

  } finally {
    page.close();
  }
}
