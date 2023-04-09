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

const html = '<div _ngcontent-vvg-c630="" id="home-upcoming-events-viewer" class=""><div _ngcontent-vvg-c630="" class="ng-star-inserted"><div _ngcontent-vvg-c630="" class="day-container ng-star-inserted"><div _ngcontent-vvg-c630="">Today</div><!----><!----><!----><div _ngcontent-vvg-c630="" class="upcoming-event ng-star-inserted"><div _ngcontent-vvg-c630="" class="avatar-container"><app-avatar _ngcontent-vvg-c630="" size="medium" _nghost-vvg-c76=""><div _ngcontent-vvg-c76="" class="circular image medium ui ng-star-inserted" title="Colin Moore"><img _ngcontent-vvg-c76="" alt="image" src="blob:https://hr.humi.ca/2f6d8bc0-b250-4ca8-b7d8-e4fee3e07a9c" class="ng-star-inserted" style="width: 100%; height: 100%; opacity: 1;"><!----><!----></div><!----><!----></app-avatar></div><div _ngcontent-vvg-c630="" class="upcoming-event-text-container"><div _ngcontent-vvg-c630="" class="upcoming-event-title">Colin Moore is away</div><div _ngcontent-vvg-c630="" class="upcoming-event-description">Away for 1.00 day</div></div></div><div _ngcontent-vvg-c630="" class="upcoming-event ng-star-inserted"><div _ngcontent-vvg-c630="" class="avatar-container"><app-avatar _ngcontent-vvg-c630="" size="medium" _nghost-vvg-c76=""><div _ngcontent-vvg-c76="" class="circular image medium ui ng-star-inserted" title="Colin Moore"><img _ngcontent-vvg-c76="" alt="image" src="blob:https://hr.humi.ca/2f6d8bc0-b250-4ca8-b7d8-e4fee3e07a9c" class="ng-star-inserted" style="width: 100%; height: 100%; opacity: 1;"><!----><!----></div><!----><!----></app-avatar></div><div _ngcontent-vvg-c630="" class="upcoming-event-text-container"><div _ngcontent-vvg-c630="" class="upcoming-event-title">Tset Dome is away</div><div _ngcontent-vvg-c630="" class="upcoming-event-description">Away for 1.00 day</div></div></div><div _ngcontent-vvg-c630="" class="no-events ng-star-inserted"> No events on Friday, Apr 7 </div><!----></div><div _ngcontent-vvg-c630="" class="day-container ng-star-inserted"><div _ngcontent-vvg-c630="">Saturday, Apr 8</div><!----><!----><!----><div _ngcontent-vvg-c630="" class="no-events ng-star-inserted"> No events on Saturday, Apr 8 </div><!----></div><div _ngcontent-vvg-c630="" class="day-container ng-star-inserted"><div _ngcontent-vvg-c630="">Sunday, Apr 9</div><!----><!----><!----><div _ngcontent-vvg-c630="" class="no-events ng-star-inserted"> No events on Sunday, Apr 9 </div><!----></div><div _ngcontent-vvg-c630="" class="day-container ng-star-inserted"><div _ngcontent-vvg-c630="">Monday, Apr 10</div><div _ngcontent-vvg-c630="" class="upcoming-event ng-star-inserted"><div _ngcontent-vvg-c630="" class="avatar-container"><app-avatar _ngcontent-vvg-c630="" size="medium" _nghost-vvg-c76=""><div _ngcontent-vvg-c76="" class="circular image medium ui ng-star-inserted" title="Colin Moore"><img _ngcontent-vvg-c76="" alt="image" src="blob:https://hr.humi.ca/2f6d8bc0-b250-4ca8-b7d8-e4fee3e07a9c" class="ng-star-inserted" style="width: 100%; height: 100%; opacity: 1;"><!----><!----></div><!----><!----></app-avatar></div><div _ngcontent-vvg-c630="" class="upcoming-event-text-container"><div _ngcontent-vvg-c630="" class="upcoming-event-title">Colin Moore is away</div><div _ngcontent-vvg-c630="" class="upcoming-event-description">Away for 1.00 day</div></div></div><!----><!----><!----><!----></div><div _ngcontent-vvg-c630="" class="day-container ng-star-inserted"><div _ngcontent-vvg-c630="">Tuesday, Apr 11</div><div _ngcontent-vvg-c630="" class="upcoming-event ng-star-inserted"><div _ngcontent-vvg-c630="" class="avatar-container"><app-avatar _ngcontent-vvg-c630="" size="medium" _nghost-vvg-c76=""><div _ngcontent-vvg-c76="" class="circular image medium ui ng-star-inserted" title="Colin Moore"><img _ngcontent-vvg-c76="" alt="image" src="blob:https://hr.humi.ca/2f6d8bc0-b250-4ca8-b7d8-e4fee3e07a9c" class="ng-star-inserted" style="width: 100%; height: 100%; opacity: 1;"><!----><!----></div><!----><!----></app-avatar></div><div _ngcontent-vvg-c630="" class="upcoming-event-text-container"><div _ngcontent-vvg-c630="" class="upcoming-event-title">Colin Moore is away</div><div _ngcontent-vvg-c630="" class="upcoming-event-description">Away for 1.00 day</div></div></div><!----><!----><!----><!----></div><div _ngcontent-vvg-c630="" class="day-container ng-star-inserted"><div _ngcontent-vvg-c630="">Wednesday, Apr 12</div><!----><!----><!----><div _ngcontent-vvg-c630="" class="no-events ng-star-inserted"> No events on Wednesday, Apr 12 </div><!----></div><div _ngcontent-vvg-c630="" class="day-container ng-star-inserted"><div _ngcontent-vvg-c630="">Thursday, Apr 13</div><!----><!----><!----><div _ngcontent-vvg-c630="" class="no-events ng-star-inserted"> No events on Thursday, Apr 13 </div><!----></div><!----></div><!----></div>';

(async () => {
  const port = 3000
  // Start your app
  await app.start(process.env.PORT || port);
  console.time('nav');
  const html = await navigate('https://pptr.dev/api/puppeteer.page');
  console.timeEnd('nav');
  try {
    find_today(html.slice(283, html.length));
  } catch(e) {
    console.error(e);
    console.log('Cannot find today');
  } finally {
    console.log(`⚡️ Slack Bolt app is running on port ${port}!`);
  }
})();
