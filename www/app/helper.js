const navigate = require('./navigate');
const { schedule, validateWebScrapingTime, calculateInterval, sleep } = require('./scheduler');
const { find_today } = require("wasm-build");
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const SCHEDULE = 10; //10AM in 24hr

async function runTimeOffEvents(app, startTime, timeInterval) {
  const TARGET_TIME = 8//8AM
  // calculate timeout ms
  const sleepTime = calculateInterval(startTime, TARGET_TIME);
  if (startTime.hour() >= TARGET_TIME && startTime.hour() < SCHEDULE) {
    try {
      const d = dayjs().tz('America/Toronto');
      await postChatMessage(d, app);
    } catch(e) {
      console.error(e);
    }
  }
  console.log(sleepTime);
  await sleep(sleepTime);
  const date = dayjs().tz('America/Toronto');
  await postChatMessage(date, app);
  return setInterval(() => {
    const date = dayjs().tz('America/Toronto');
    console.log(date.toString());
    postChatMessage(date, app);
  }, timeInterval);
};


async function postChatMessage(date, app) {
    if (validateWebScrapingTime(date)) {
      try {
        const html = await navigate('https://hr.humi.ca/login');
        const timeOff = find_today(html);
        // const timeOff = ['test'];
        if (timeOff.length > 0 ) {
          const post_at = schedule(date, SCHEDULE); 
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
}

module.exports = { runTimeOffEvents, postChatMessage }
