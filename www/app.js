const { App } = require("@slack/bolt");
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const { find_today } = require("wasm-build");
require("dotenv").config();
const navigate = require('./navigate');
const { schedule, validateWebScrapingTime, calculateInterval, sleep }= require('./scheduler');

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.APP_TOKEN,
});

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

async function runTimeOffEvents() {
  const start_time = dayjs().tz('America/Toronto');
  // calculate timeout ms
  const sleepTime = calculateInterval(start_time);
  console.log(sleepTime);
  await sleep(sleepTime);
  const timeInterval = 8.64e7;
  setInterval(async () => {
    if (validateWebScrapingTime(date)) {
      try {
        console.time('nav');
        const html = await navigate('https://hr.humi.ca/login');
        console.timeEnd('nav');
        const timeOff = find_today(html);
        // const timeOff = ['test'];
        if (timeOff.length > 0 ) {
          const post_at = schedule(date); 
          //message 
          await app.client.chat.scheduleMessage({
            channel: process.env.CHANNEL_ID,
            text: 'Tset Dome is away: Away for 1.00 day',
            post_at
          });
        } else {
          console.log('No Days off Today');
        }
      } catch(e) {
        console.error(e);
      }
    }
  }, timeInterval);
}

(async () => {
  const port = 3000
  try {
    await app.start(process.env.PORT || port);
    console.log(`⚡️ Time off bot is running on port ${port}!`);
    runTimeOffEvents(undefined);
  } catch(e) {
    console.error(e);
  }
})();
