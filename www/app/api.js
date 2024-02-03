const fetch =  require("node-fetch");
const { find_today } = require("wasm-build");
const { log } = require('./logger');

async function getCalendar() {
  let body = '';
  try {
    const token = process.env.CALENDAR_TOKEN || '';
    if (token) {
      const url = new URL('https://api.humi.ca/v2/timeOffV3/calendarFeeds/737459/subscribe');
      url.searchParams.set('token', token);
      url.search = decodeURIComponent(url.search);
      const response = await fetch(url.toString());
      body = await response.text();
      log.debug("Found length of: ", body.length);
    } else {
      log.warn('Not token found');
    }
  } catch(e) {
    log.error(`calendar feed fetch did not work: ${e.message}`);
  }
  return body;
}

async function getTimeoffFromCalendar() {
  const response = await getCalendar();
  let timeoff = '';
  if (response) {
    timeoff = find_today(response);
  }
  return timeoff; 
}

module.exports = {
  getTimeoffFromCalendar
}
