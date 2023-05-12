const navigate = require('./navigate');
const { schedule, validateWebScrapingTime, calculateInterval, sleep } = require('./scheduler');
const { saveInstall, getInstall, delInstall } = require('./db');
const { find_today, render_mkdown } = require("wasm-build");
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
        const timeOff = render_mkdown(html);
        // const timeOff = ['test'];
        if (timeOff.length > 0 ) {
          const post_at = schedule(date, SCHEDULE); 
          //message 
          await app.client.chat.scheduleMessage({
            channel: process.env.CHANNEL_ID,
            text: timeOff,
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

const installationStore = (db) => ({
    storeInstallation: (installation) => {
      // Bolt will pass your handler an installation object
      if (installation.team !== undefined) {
        // single team app installation
        return saveInstall(db, installation);
      }
      console.error('Failed saving installation data to installationStore');
    },
    fetchInstallation: (installQuery) => {
      // Bolt will pass your handler an installQuery object
      if (installQuery.teamId !== undefined) {
        // single team app installation lookup
        return getInstall(db, installQuery.teamId);
      }
      console.error('Failed fetching installation');
    },
    deleteInstallation: (installQuery) => {
      if (installQuery.teamId !== undefined) {
        // single team app installation deletion
        return delInstall(db, installQuery.teamId);
      }
      console.error('Failed to delete installation');
    }
});

module.exports = {
  runTimeOffEvents,
  postChatMessage,
  installationStore
}
