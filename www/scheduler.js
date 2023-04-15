const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

// TIME IS 24HR
// dayjs HOUR BETWEEN 0-23
function convertToDayJS (x) {
  return x - 1;
}

function schedule(date) {
  const SCHEDULE = 10; //10AM in 23hr DAYJS
  const dateAtSchedule = date.hour(convertToDayJS(SCHEDULE));
  return dateAtSchedule.unix();
}

// validate Time is between 6-9am for web scraping
function validateWebScrapingTime(date) {
  const TIME_START = 6;
  const TIME_STOP = 9;
  
  // weekday and expected time
  const isWeekDay = date.day() >= 1 && date.day() <= 5;
  const betweenExpectedTime = date.hour() >= convertToDayJS(TIME_START) && date.hour() <= convertToDayJS(TIME_STOP);
  return isWeekDay && betweenExpectedTime;
}

module.exports = { schedule, validateWebScrapingTime };
