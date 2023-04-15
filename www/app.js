const { App } = require("@slack/bolt");
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const { find_today } = require("wasm-build");
require("dotenv").config();
const navigate = require('./navigate');
const { schedule, validateWebScrapingTime }= require('./scheduler');

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.APP_TOKEN,
});

// INITIALIZE SCHEDULE TIME;
let SCHEDULED_TIME;

//events
app.event('app_home_append',async ({event})=>{
  console.log(event,1); 
});

//Mention Hi, say Hi

app.event('app_mention', async ({event, client})=> {
  try{
     if (event.text.includes('Hi')) {
        client.chat.postMessage({"channel":event.channel, "text":"Hi"})
     }
  } catch(e){
    console.log(e);
  };
});

// commands
app.command('/time_off/help', async ({ command, ack, respond})=>{
  try {
    await ack();
    await respond("The Time Off Bot will remind you every weekday if anyone is off");
  } catch(e){
    console.error(e);
  }
});

async function runTimeOffEvents(startTime) {
  let timeInterval = null;
   
  const date = dayjs().tz('America/Toronto');
  if (validateWebScrapingTime(date) && !SCHEDULED_TIME) {
    try {
      console.time('nav');
      const html = await navigate('https://hr.humi.ca/login');
      console.timeEnd('nav');
      console.log(find_today(html));
    } catch(e) {
      console.error(e);
    }
  }
  
}

(async () => {
  const port = 3000
  // Start your app
  try {
    await app.start(process.env.PORT || port);
    console.log(`⚡️ Slack Bolt app is running on port ${port}!`);
  } catch(e) {
    console.error(e);
  }
})();
