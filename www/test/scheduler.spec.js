const assert = require('node:assert').strict;
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const scheduler = require('../app/scheduler');

describe('Scheduler', function() {
  dayjs.extend(utc);
  dayjs.extend(timezone);
  describe('schedule time', function() {
    it('Accurate Scheduled Time', function() {
      const date = Date.parse('2023-04-15T06:00:43-04:00');
      const actual = scheduler.schedule(dayjs(date).tz('America/Toronto'));
      // expect in seconds EPOCH
      const expect = (Date.parse('2023-04-15T10:00:43-04:00'))/1000;
      assert.equal(actual, expect, `schedule time does not match with 10am: \n
       actual: ${(new Date(actual * 1000))}\n
       expect: ${(new Date(expect * 1000))}\n`);
    });
  })
  describe('calculate interval time', function() {
    it('Testing Interval Functionality before target time', function() {
      const date = Date.parse('2023-04-15T06:00:00-04:00');
      const actual = scheduler.calculateInterval(dayjs(date).tz('America/Toronto'), 10);
      // expect in seconds EPOCH
      const expect = (Date.parse('2023-04-15T10:00:00-04:00') - date);
      assert.equal(actual, expect, 'calculate interval time does not match');
    });
    it('Testing Interval Functionality after target time', function() {
      const date = Date.parse('2023-04-15T15:00:00-04:00');
      const actual = scheduler.calculateInterval(dayjs(date).tz('America/Toronto'), 10);
      // expect in seconds EPOCH
      const expect = (Date.parse('2023-04-16T10:00:00-04:00') - date);
      assert.equal(actual, expect, 'calculate interval time does not match');
    });
  })
});
