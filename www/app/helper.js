const navigate = require('./navigate');
const { schedule, validateWebScrapingTime, calculateInterval, sleep } = require('./scheduler');
const { find_today } = require("wasm-build");
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

async function runTimeOffEvents(app, startTime, timeInterval) {
  // calculate timeout ms
  const sleepTime = calculateInterval(startTime);
  console.log(sleepTime);
  await sleep(sleepTime);
  setInterval(async () => {
    const date = dayjs().tz('America/Toronto');
    console.log(date.locale());
    if (validateWebScrapingTime(date)) {
      try {
        console.time('nav');
        const html = await navigate('https://hr.humi.ca/login');
        console.timeEnd('nav');
        const timeOff = find_today(html);
        // const timeOff = ['test'];
        if (timeOff.length > 0 ) {
          await postChatMessage(date, app)
        } else {
          console.log('No Days off Today');
        }
      } catch(e) {
        console.error(e);
      }
    }
  }, timeInterval);
};


async function postChatMessage(date, app) {
  const post_at = schedule(date); 
  //message 
  await app.client.chat.scheduleMessage({
    channel: process.env.CHANNEL_ID,
    text: 'Tset Dome is away: Away for 1.00 day',
    post_at
  });
}

module.exports = { runTimeOffEvents }
