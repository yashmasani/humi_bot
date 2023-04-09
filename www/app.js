const { App } = require("@slack/bolt");
const { find_today } = require("wasm-build");
require("dotenv").config();
const api = require('./api');
const navigate = require('./navigate');
const fetch = require("node-fetch");
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
  //console.log(event, content, context);
});

// commands
app.command('/asset/help', async ({ command, ack, respond})=>{
  try {
    await ack();
    await respond("Insert help info");
    console.log("works");
  } catch(e){
  }
});

app.command('/asset/start', async ({ command, ack, respond}) => {
  try {
    await ack();
    // enter channel id, channel name, team id
    /**
    db.connect( function(err) {
      if (err) {
        console.error(err);
      };
    });

    db.query('SHOW TABLES', function(err, res, fields) {
      if (err) throw err;
      console.log('the solution is', res);
    });

    db.end();
    **/
    console.log(command.channel_id, command.team_id);
    await respond('Done');
  } catch(e){
    
  }
});


(async () => {
  const port = 3000
  // Start your app
  await app.start(process.env.PORT || port);
  console.time('nav');
  const html = await navigate('https://pptr.dev/api/puppeteer.page');
  console.timeEnd('nav');
  try {
    find_today(html);
  } catch(e) {
    console.error(e);
    console.log('Cannot find today');
  } finally {
    console.log(`⚡️ Slack Bolt app is running on port ${port}!`);
  }
})();
