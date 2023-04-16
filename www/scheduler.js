const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

function schedule(date) {
  const SCHEDULE = 10; //10AM in 24hr
  const dateAtSchedule = date.hour(SCHEDULE).minute(50);
  return dateAtSchedule.unix();
}

// validate Time is between 6-9am for web scraping
function validateWebScrapingTime(date) {
  const TIME_START = 6;
  const TIME_STOP = 9;
  
  // weekday and expected time
  const isWeekDay = date.day() >= 1 && date.day() <= 5;
  const betweenExpectedTime = date.hour() >= TIME_START && date.hour() <= TIME_STOP;
  return isWeekDay && betweenExpectedTime;
}

function calculateInterval(date) {
  const targetTime = 8; // 8AM 
  const target = date.startOf('day').hour(targetTime);
  let interval;
  const dateUnix = date.unix();
  const targetUnix = target.unix();
  if (dateUnix <= targetUnix) {
    interval =  targetUnix - dateUnix;
  } else {
    const endOfDay = date.endOf('day').unix();
    interval =  (endOfDay - dateUnix) + (targetTime * 3600);
  }
  //from s to ms
  return interval * 1000;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms)
  });
}

module.exports = { schedule, validateWebScrapingTime, calculateInterval, sleep };
