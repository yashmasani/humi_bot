const fetch =  require("node-fetch");
const { find_today } = require("wasm-build");

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
    } else {
      log.warn('Not token found');
    }
  } catch(e) {
    log.error('fetch did not work');
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
