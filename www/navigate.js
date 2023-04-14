const puppeteer = require('puppeteer');
require("dotenv").config();

async function init(webAddress) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(webAddress);
  
  await authenticate(page)
    .then(() => page.waitForNavigation({waitUntil: 'load'}));
  let content = "";
  const page_url = page.url();
  if (page_url && page_url.includes('dashboard') ) content = await page.content();
  await browser.close();
  return content;
}

async function authenticate(page) {
  let email = await page.$('input[name="email"]');
  let password = await page.$('input[name="password"]');
  if (email && password) {
    await email.type(process.env.EMAIL);
    await password.type(process.env.PASSWORD);
    const submit = await page.$('button[type="submit"]');
    if (submit) {
      await submit.click();
    } else {
      throw new Error(`Could not find input element SUBMIT: ${submit}`);
    }
  } else {
    throw new Error(`Could not find input element EMAIL: ${email} or PASSWORD: ${password}`)
  }
}


module.exports = init;
