import { chromium } from 'playwright';

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  try {
    console.log('Navigating to http://localhost:3001/ge ...');
    const response = await page.goto('http://localhost:3001/ge', { waitUntil: 'load', timeout: 20000 });
    console.log('Navigation response status:', response ? response.status() : 'no response');
    
    // Wait a bit for page load/hydration
    await page.waitForTimeout(5000);
    
    const title = await page.title();
    console.log('Page title:', title);
    
    const screenshotPath = 'G:/AI/Claude/agents/fullstack-developer/clinic/test-screenshots/local_ge_test.png';
    await page.screenshot({ path: screenshotPath });
    console.log('Screenshot saved to:', screenshotPath);
  } catch (e) {
    console.error('Error during navigation:', e);
    // Take a screenshot of whatever state it is in
    try {
      const screenshotPath = 'G:/AI/Claude/agents/fullstack-developer/clinic/test-screenshots/local_ge_error.png';
      await page.screenshot({ path: screenshotPath });
      console.log('Error screenshot saved to:', screenshotPath);
    } catch (secErr) {
      console.error('Could not take error screenshot:', secErr);
    }
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

run();
