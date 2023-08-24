const { App, HTTPReceiver } = require("@slack/bolt");
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
require("dotenv").config();
const { runTimeOffEvents, installationStore, postChatMessage } = require('./app/helper');
const { getTable, database, handleConnection, provideLogs } = require('./app/db');
const { log } = require('./app/logger')

dayjs.extend(utc);
dayjs.extend(timezone);
// Initializes your app with your bot token and signing secret


const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  scopes: ['app_mentions:read', 'chat:write', 'commands'],
  installationStore: installationStore(database),
  receiver: new HTTPReceiver({
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    stateSecret: process.env.SLACK_STATE_SECRET,
    dispatchErrorHandler: async ({ request, logger, error, response }) => {
      logger.error(`dispatch error: ${error}`);
      logger.info(JSON.stringify(request.headers));
      response.writeHead(500);
      response.end();
    },
    logger: {
      debug: (...msgs) => { log.debug(JSON.stringify(msgs)); },
      info: (...msgs) => { log.info(JSON.stringify(msgs)); },
      warn: (...msgs) => { log.warn(JSON.stringify(msgs)); },
      error: (...msgs) => { log.error(JSON.stringify(msgs)); },
      setLevel: (level) => { },
      getLevel: () => { },
      setName: (name) => { },  
    },
    customRoutes: [
      {
        path: '/health-check',
        method: ['GET'],
        handler: (req, res) => {
          res.writeHead(200);
          res.end(`Things are going just fine at ${req.headers.host}!`);
        },
      },
      {
        path: '/log-activities',
        method: ['GET'],
        handler: async (req, res) => {
          res.writeHead(200);
          //res.end(`${req.headers.host}!`);
          const logs = await handleConnection(database, provideLogs);
          res.end(JSON.stringify(logs));
        },
      }
    ],
  })
  /*socketMode: true,
  appToken: process.env.APP_TOKEN,*/
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

app.command('/time_off/attribution', async ({ ack, say })=>{
  try {
    await ack();
    await say({
     blocks: [
      {
       "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "Thanks to <https://www.vecteezy.com/?utm_source=vecteezy-download&utm_medium=license-info-pdf&utm_campaign=license-info-document | Vecteezy.com> for the clipart"
        }
      }
    ]});
  } catch(e){
    console.error(e);
  }
});


(async () => {
  const port = process.env.PORT || 3000;
  try {
    await handleConnection(database, getTable);
    await app.start(process.env.PORT || port);
    console.log(`⚡️ Time off bot is running on port ${port}!`);
    const startTime = dayjs().tz('America/Toronto');
    // 24 hr in ms
    const timeInterval = 8.64e7;
    log.info(`Started at ${startTime}`);
    runTimeOffEvents(app, startTime, timeInterval);
  } catch(e) {
    console.error(e);
  }
})();
