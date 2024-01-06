const navigate = require('./navigate');
const { schedule, validateWebScrapingTime, calculateInterval, sleep } = require('./scheduler');
const {
  database,
  saveInstall,
  getInstall,
  delInstall,
  handleConnection
} = require('./db');
const { getTimeoffFromCalendar } = require('./api');
const { render_mkdown } = require("wasm-build");
const { log } = require('./logger');


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
    log.info(`Sleep Time: ${sleepTime}`)
    try {
      const d = dayjs().tz('America/Toronto');
      await postChatMessage(d, app);
    } catch(e) {
      log.error(e.message);
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
      log.info(`Valid Web Scraping Time: ${date.toString()}`);
      try {
        /**const html = await navigate('https://hr.humi.ca/login', process.env.EMAIL, process.env.PASSWORD);
        let timeOff = render_mkdown(html);
        if (process.env.EMAIL_TWO) {
          const htmlTwo = await navigate('https://hr.humi.ca/login', process.env.EMAIL_TWO, process.env.PASSWORD_TWO);
          timeOff += render_mkdown(htmlTwo);
        }**/
         
        let timeOff = await getTimeoffFromCalendar();
        log.debug(timeOff);
        if (timeOff.length > 0 ) {
          log.debug('Time off found');
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
          log.debug('Nobody off Today');
          console.log('No Days off Today');
        }
      } catch(e) {
        log.error(e.message);
        console.error(e);
      }
    }
}

const installationStore = (database) => ({
    storeInstallation: async (installation) => {
      // Bolt will pass your handler an installation object
      if (installation.team !== undefined) {
        // single team app installation
        log.debug('Installation Item stored');
        return handleConnection(database, saveInstall, installation);
      }
      log.error('Failed saving installation data to installationStore');
      throw new Error('Failed saving installation data to installationStore');
    },
    fetchInstallation: async (installQuery) => {
      // Bolt will pass your handler an installQuery object
      if (installQuery.teamId !== undefined) {
        // single team app installation lookup
        log.debug('Installation Item found');
        return handleConnection(database, getInstall, installQuery.teamId)
      }
      log.error('Failed fetching installation');
      throw new Error('Failed fetching installation');
    },
    deleteInstallation: async (installQuery) => {
      if (installQuery.teamId !== undefined) {
        // single team app installation deletion
        log.debug('Installation Item deleted');
        return handleConnection(database, delInstall, installQuery.teamId);
      }
      log.error('Failed to delete installation');
      throw new Error('Failed to delete installation');
    }
});

module.exports = {
  runTimeOffEvents,
  postChatMessage,
  installationStore
}
