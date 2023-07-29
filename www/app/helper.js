const navigate = require('./navigate');
const { schedule, validateWebScrapingTime, calculateInterval, sleep } = require('./scheduler');
const {
  database,
  saveInstall,
  getInstall,
  delInstall,
  handleConnection
} = require('./db');
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
        const html = await navigate('https://hr.humi.ca/login', process.env.EMAIL, process.env.PASSWORD);
        let timeOff = render_mkdown(html);
        if (process.env.EMAIL_TWO) {
          const htmlTwo = await navigate('https://hr.humi.ca/login', process.env.EMAIL_TWO, process.env.PASSWORD_TWO);
          timeOff += render_mkdown(htmlTwo);
        }
         
        // const timeOff = ['test'];
        if (timeOff.length > 0 ) {
          const post_at = schedule(date, SCHEDULE);
          const { bot } = await handleConnection(database, getInstall, process.env.TEAM_ID);
          if (!bot && !bot.token) {
            throw new Error('Bot Token not found');
          };
          const { token } = bot;
          //message 
          await app.client.chat.scheduleMessage({
            channel: process.env.CHANNEL_ID,
            text: timeOff,
            post_at,
            token,
            team_id: process.env.TEAM_ID
          });
        } else {
          console.log('No Days off Today');
        }
      } catch(e) {
        console.error(e);
      }
    }
}

const installationStore = (database) => ({
    storeInstallation: async (installation) => {
      // Bolt will pass your handler an installation object
      if (installation.team !== undefined) {
        // single team app installation
        return handleConnection(database, saveInstall, installation);
      }
      throw new Error('Failed saving installation data to installationStore');
    },
    fetchInstallation: async (installQuery) => {
      // Bolt will pass your handler an installQuery object
      if (installQuery.teamId !== undefined) {
        // single team app installation lookup
        return handleConnection(database, getInstall, installQuery.teamId)
      }
      throw new Error('Failed fetching installation');
    },
    deleteInstallation: async (installQuery) => {
      if (installQuery.teamId !== undefined) {
        // single team app installation deletion
        return handleConnection(database, delInstall, installQuery.teamId);
      }
      throw new Error('Failed to delete installation');
    }
});

module.exports = {
  runTimeOffEvents,
  postChatMessage,
  installationStore
}
