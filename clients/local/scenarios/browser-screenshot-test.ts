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
    console.log('Navigating to page...');
    await page.goto('https://test.k6.io/browser.php', { waitUntil: 'networkidle' });
    
    const headerText = await page.locator('h2').textContent();
    console.log('Header text:', headerText);
    
    check(page, {
      'header is visible': () => headerText == 'Welcome to the k6 browser test page',
    });

    // Use the injected K6_REPORT_DIR environment variable
    // Fallback to 'screenshots' if not set (local dev without runner)
    const reportDir = __ENV.K6_REPORT_DIR || 'screenshots';
    
    console.log(`Taking screenshot to: ${reportDir}/homepage.png`);
    // Take a screenshot
    await page.screenshot({ path: `${reportDir}/homepage.png` });
    
    // Click a checkbox
    const checkbox = page.locator('#checkbox1');
    await checkbox.click();
    
    const isChecked = await page.locator('#checkbox1').isChecked();
    check(page, {
      'checkbox is checked': () => isChecked,
    });
    
    console.log(`Taking screenshot to: ${reportDir}/checkbox-clicked.png`);
    // Take another screenshot
    await page.screenshot({ path: `${reportDir}/checkbox-clicked.png` });

  } finally {
    page.close();
  }
}
