// /files/puppeteer-script.js
const puppeteer = require('puppeteer');

async function run() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto('https://example.com');
    const title = await page.title();
    
    console.log(JSON.stringify({
      success: true,
      title: title,
      timestamp: new Date().toISOString()
    }));
    
  } catch (error) {
    console.log(JSON.stringify({
      success: false,
      error: error.message
    }));
  } finally {
    await browser.close();
  }
}

run();