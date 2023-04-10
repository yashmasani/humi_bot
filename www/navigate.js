const puppeteer = require('puppeteer');
require("dotenv").config();

async function init(webAddress) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(webAddress);
  
  await authenticate(page);
  const response = await page.waitForResponse(response => response.status() == 200);
  let content = "";
  if (response) content = page.content();
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
