const puppeteer = require('puppeteer');
require("dotenv").config();

async function init(webAddress) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(webAddress);
  
  try {
    const authenticatedPage = await authenticate(page);
  } catch(e) {
    console.error("Error Authenticating");
    console.error(e);
  }
  const content = await authenticatedPage.content();
  return content;
}

async function authenticate(page) {
  const inputs =  await page.querySelectorAll('input');
  let email;
  let password;
  for await (const input of inputs) {
    if (!email) {
      email = await input.querySelector('[name="email"]');
      await input.type(process.env.EMAIL);
    }
    if (!password) {
      password = await input.querySelector('[name="password"]');
      await input.type(process.env.PASSWORD);
    }
  }
  if (email && password) {
    const submit = await page.querySelector('button[type="submit"]');
    if (submit) {
      // await submit.click();
    } else {
      throw new Error(`Could not find input element SUBMIT: ${submit}`);
    }
  } else {
    throw new Error(`Could not find input element EMAIL: ${email} or PASSWORD: ${password}`)
  }
}


module.exports = init;
