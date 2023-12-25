const puppeteer = require('puppeteer');
const { sleep } = require('./scheduler')
require("dotenv").config();

async function init(webAddress, email, password) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();

  await page.goto(webAddress);
  
  await authenticate(page, email, password)
    .then(async () => {
      try {
        await page.waitForNavigation({waitUntil: 'networkidle0', timeout: 8000 });
        await sleep(20000);
        await closeBlockingModals(page);
      } catch(e) {
        console.error(e);
      }
    });
  let content = "";
  const page_url = page.url();
  if (page_url && page_url.includes('dashboard') ) content = await page.content();
  await signOut(page);
  await browser.close();
  return content;
}

async function authenticate(page, EMAIL, PASSWORD) {
  let email = await page.$('input[name="username"]');
  let password = await page.$('input[name="password"]');
  if (email && password) {
    await email.type(EMAIL);
    await password.type(PASSWORD);
    await page.keyboard.press('Enter');
    /*const submit = await page.$('button[type="submit"]');
    if (submit) {
    } else {
      throw new Error(`Could not find input element SUBMIT: ${submit}`);
    }*/
  } else {
    throw new Error(`Could not find input element EMAIL: ${email} or PASSWORD: ${password}`)
  }
}

async function closeBlockingModals(page) {
  await page.keyboard.press('Escape');
  //const close = await page.$('button[aria-label="Close"]');
  //button aria-label="Close"
}

async function signOut(page) {
  try {
    let menu = await page.$('div.name-and-role-container');
    if (menu) {
      await menu.click();
      await sleep(1000);
      let buttons = await page.$$('button.mat-focus-indicator');
      let signOut;
      for (let btn of buttons){
        let text = await btn.evaluate(x => x.textContent);
        if (text.includes('Logout')) {
          signOut = btn;  
        }
      }
      if (signOut) {
        await Promise.all[
          signOut.click(),
          page.waitForNavigation()
        ];
        await sleep(2500);
      } else {
        throw new Error(`Could not find input element signOut: ${signOut}`);
      }
    } else {
      throw new Error(`Could not find input element MENU: ${menu}`);
    }
  } catch(e) {
    console.error(e);
  }
}

module.exports = init;
