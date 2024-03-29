// mock
const rewire = require('rewire');
const dayjs = require('dayjs');
const assert = require('node:assert').strict;
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const { Logger } = require('../app/logger');

dayjs.extend(utc);
dayjs.extend(timezone);

const mockModule = rewire("../app/helper");

async function slp(ms, fn) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (fn) fn();
      resolve();
    }, ms);
  })
}

/* ----mock log storage---- */
Logger.prototype.store = async () => { await slp(10); };
const mockLog = new Logger();
/* -----------------------  */

function mockSetInterval(fn, ms) {
  return setInterval(fn, ms);
}


describe('Run Time Off Events', function() {
  const mockFunction = () => {};
  before(() => {
      mockModule.__set__('log', mockLog);
  });
  describe('post chat message works', function() {
    it('works when validateWebScrapingTime is true', async function() {
      mockModule.__set__('navigate', () => (slp(100)));
      mockModule.__set__('validateWebScrapingTime', () => (true))
      mockModule.__set__('schedule', mockFunction);
      mockModule.__set__('find_today', () => ['']);
      mockModule.__set__('render_mkdown', () => 'test');
      mockModule.__set__('getTimeoffFromCalendar', () => 'test');
      mockModule.__set__('getInstall', () =>({
        bot: { token : 1 }
      }));
      let isCalled = false;
      const mockApp = {
        client: {
          chat: {
            scheduleMessage: () => slp(10, () => { isCalled = true; })
          }
        }
      };
      const date = {};
      return mockModule.postChatMessage(date, mockApp).then(() => {
        assert.equal(isCalled, true, 'schedule Message was not called');
      });
    });
    it('post chat message not called when validateWebScrapingTime is false', async function() {
      mockModule.__set__('navigate', () => (slp(100)));
      mockModule.__set__('validateWebScrapingTime', () => (false))
      mockModule.__set__('schedule', mockFunction);
      mockModule.__set__('find_today', () => ['']);
      mockModule.__set__('render_mkdown', () => 'test');
      mockModule.__set__('getTimeoffFromCalendar', () => 'test');
      mockModule.__set__('getInstall', () =>({
        bot: { token : 1 }
      }));
      let isCalled = false;
      const mockApp = {
        client: {
          chat: {
            scheduleMessage: () => slp(10, () => { isCalled = true; })
          }
        }
      };
      const date = {};
      return mockModule.postChatMessage(date, mockApp).then(() => {
        assert.equal(isCalled, false, 'schedule Message was called');
      });
    });
  });
    it('fails when bot installation is not found', async function() {
      mockModule.__set__('navigate', () => (slp(100)));
      mockModule.__set__('validateWebScrapingTime', () => (true))
      mockModule.__set__('schedule', mockFunction);
      mockModule.__set__('find_today', () => ['']);
      mockModule.__set__('render_mkdown', () => 'test');
      mockModule.__set__('getTimeoffFromCalendar', () => 'test');
      mockModule.__set__('getInstall', () =>({}));
      let isCalled = false;
      const mockApp = {
        client: {
          chat: {
            scheduleMessage: () => slp(10, () => { isCalled = true; })
          }
        }
      };
      const date = {};
      return mockModule.postChatMessage(date, mockApp).then(() => {
        assert.fail('chat message called even when team does not exist');
      }).catch((_) => {
        assert.equal(isCalled, false, 'schedule Message threw an error when bot token was not found');
      });
    });
  describe('runTimeOffEvents works', function() {
    mockModule.__set__('process.env', {});
    it('RunTime Off Events is called as expected when target time is before 8', async function() {
      let isCalledCount = 0;
      const mockNavInterval = 100;
      mockModule.__set__('navigate', () => (slp(mockNavInterval)));
      mockModule.__set__('calculateInterval', () => (500));
      mockModule.__set__('validateWebScrapingTime', () => (true))
      mockModule.__set__('schedule', mockFunction);
      mockModule.__set__('find_today', () => ['']);
      mockModule.__set__('render_mkdown', () => 'test');
      mockModule.__set__('getTimeoffFromCalendar', () => 'test');
      mockModule.__set__('setInterval', mockSetInterval);
      mockModule.__set__('getInstall', () =>({
        bot: { token : 1 }
      }));
      const mockApp = {
        client: {
          chat: {
            scheduleMessage: () => slp(10, () => { isCalledCount += 1; })
          }
        }
      };
      const buffer = 50;
      // less than target time
      const mockStartTime = { hour: () => (2) };
      const mockTimeInterval = 500;
      const interv = await mockModule.runTimeOffEvents(mockApp, mockStartTime, mockTimeInterval);
      assert.equal(isCalledCount, 1);
      await slp(mockTimeInterval+mockNavInterval+buffer);
      assert.equal(isCalledCount, 2);
      await slp(mockTimeInterval+mockNavInterval+buffer);
      assert.equal(isCalledCount, 3);
      clearInterval(interv);
    });
    it('RunTime Off Events is called as expected when target time is before 8 where email two exists', async function() {
      let isCalledCount = 0;
      const mockNavInterval = 50;
      mockModule.__set__('process.env', { EMAIL_TWO: 'test' });
      mockModule.__set__('navigate', () => (slp(mockNavInterval)));
      mockModule.__set__('calculateInterval', () => (500));
      mockModule.__set__('validateWebScrapingTime', () => (true))
      mockModule.__set__('schedule', mockFunction);
      mockModule.__set__('find_today', () => ['']);
      mockModule.__set__('render_mkdown', () => 'test');
      mockModule.__set__('getTimeoffFromCalendar', () => 'test');
      mockModule.__set__('setInterval', mockSetInterval);
      mockModule.__set__('getInstall', () =>({
        bot: { token : 1 }
      }));
      const mockApp = {
        client: {
          chat: {
            scheduleMessage: () => slp(10, () => { isCalledCount += 1; })
          }
        }
      };
      const buffer = 50;
      // less than target time
      const mockStartTime = { hour: () => (2) };
      const mockTimeInterval = 500;
      const interv = await mockModule.runTimeOffEvents(mockApp, mockStartTime, mockTimeInterval);
      assert.equal(isCalledCount, 1);
      await slp(mockTimeInterval+(mockNavInterval * 2)+buffer);
      assert.equal(isCalledCount, 2);
      await slp(mockTimeInterval+(mockNavInterval * 2)+buffer);
      assert.equal(isCalledCount, 3);
      clearInterval(interv);
    });
    it('RunTime Off Events is called with expected date with time before 8', async function() {
      let isCalledCount = 0;
      const mockNavInterval = 100;
      mockModule.__set__('navigate', () => (slp(mockNavInterval)));
      mockModule.__set__('calculateInterval', () => (500));
      mockModule.__set__('validateWebScrapingTime', () => (true))
      mockModule.__set__('schedule', mockFunction);
      mockModule.__set__('find_today', () => ['']);
      mockModule.__set__('render_mkdown', () => 'test');
      mockModule.__set__('setInterval', mockSetInterval);
      mockModule.__set__('getTimeoffFromCalendar', () => 'test');
      mockModule.__set__('getInstall', () =>({
        bot: { token : 1 }
      }));
      const mockApp = {
        client: {
          chat: {
            scheduleMessage: () => slp(10, () => { isCalledCount += 1; })
          }
        }
      };
      const mockStartTime = 0;
      const mockTimeInterval = 500;
      const date = Date.parse('2023-04-15T07:59:58-04:00');
      const interv = await mockModule.runTimeOffEvents(mockApp, dayjs(date).tz('America/Toronto'), mockTimeInterval);
      assert.equal(isCalledCount, 1);
      clearInterval(interv);
    });
    it('RunTime Off Events is called with expected date with time between 8-10am', async function() {
      let isCalledCount = 0;
      const mockNavInterval = 100;
      mockModule.__set__('navigate', () => (slp(mockNavInterval)));
      mockModule.__set__('calculateInterval', () => (500));
      mockModule.__set__('validateWebScrapingTime', () => (true))
      mockModule.__set__('schedule', mockFunction);
      mockModule.__set__('find_today', () => ['']);
      mockModule.__set__('render_mkdown', () => 'test');
      mockModule.__set__('getTimeoffFromCalendar', () => 'test');
      mockModule.__set__('setInterval', mockSetInterval);
      mockModule.__set__('getInstall', () =>({
        bot: { token : 1 }
      }));
      const mockApp = {
        client: {
          chat: {
            scheduleMessage: () => slp(10, () => { isCalledCount += 1; })
          }
        }
      };
      const mockStartTime = 0;
      const mockTimeInterval = 500;
      const date = Date.parse('2023-04-15T08:59:58-04:00');
      const interv = await mockModule.runTimeOffEvents(mockApp, dayjs(date).tz('America/Toronto'), mockTimeInterval);
      assert.equal(isCalledCount, 2, dayjs(date).tz('America/Toronto').toString());
      clearInterval(interv);
    });
  });
});
