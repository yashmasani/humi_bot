const assert = require('node:assert').strict;
const rewire = require('rewire');
const dayjs = require('dayjs');

async function slp(ms, fn) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (fn) fn();
      resolve();
    }, ms);
  })
}

describe('Logger', function() {
  it('Logger should call to db getLogTable', async () => {
    
    let getLoggedCalled = 0;
    let storeLoggedCalled = 0;
    const mockFunction = () => { 
      getLoggedCalled += 1;
      console.log('this mock is called');
    }
    const mockLog = rewire('../app/logger');
    mockLog.__set__('getLogTable', mockFunction);
    assert.equal(getLoggedCalled, 0);
    const log = new mockLog.Logger();
    await slp(100);
    assert.equal(getLoggedCalled, 1);
  });
  it('Logger should call to db storeLog when input is logged', async () => {
    let getLoggedCalled = 0;
    let storeLoggedCalled = 0;
    let storeLogArgs = [];
    const mockLog = rewire('../app/logger');
    mockLog.__set__('getLogTable', async () => (await slp(100, () => (getLoggedCalled+=1)) ));
    mockLog.__set__('storeLog', async (...args) => (await slp(100, () => {
      storeLogArgs = args;
      storeLoggedCalled+=1;
    })));
    
    assert.equal(getLoggedCalled, 0);
    assert.equal(storeLoggedCalled, 0);
    const logInstance = new mockLog.Logger();
    await slp(100);
    assert.equal(getLoggedCalled, 1);
    assert.deepEqual(storeLogArgs, []);
    await logInstance.log('Test')
    assert.equal(storeLoggedCalled, 1);
    assert.equal(storeLogArgs[0].constructor.name, 'Database');
    assert.equal(storeLogArgs[1].content, 'Test');
    const date = dayjs(storeLogArgs[0].date).format('YYYY-MM-DD');
    assert.equal(storeLogArgs[1].date, date);
  });
});
