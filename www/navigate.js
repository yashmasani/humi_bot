const puppeteer = require('puppeteer');

async function init(webAddress) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(webAddress);
  const content = await page.content();
  return content;
}

module.exports = init;
