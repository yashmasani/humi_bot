const assert = require('node:assert').strict;
const {
  getTable,
  saveInstall,
  getInstall,
  delInstall
} = require('../app/db')

describe('DB', function() {
  let db;
  it('get table', async function() {
    db = await getTable();
    assert.notEqual(db, undefined);
    await db.get(
      'SELECT * FROM users',
      function(err, row) {
        assert.ifError(err);
        console.log(row);
      }
    );
  });
  /*describe('installs', function() {
    const db = getTable();
    describe('saveInstall', function(){
      const mockInstallObject = {
        team: { id: 'T012345678', name: 'example-team-name' },
        enterprise: undefined,
        user: { token: undefined, scopes: undefined, id: 'U01234567' },
        tokenType: 'bot',
        isEnterpriseInstall: false,
        appId: 'A01234567',
        authVersion: 'v2',
        bot: {
          scopes: [
            'chat:write',
          ],
          token: 'xoxb-244493-28244493123-as123etsetts',
          userId: 'U012345678',
          id: 'B01234567'
        }
      };
      const res = saveInstall(db, mockInstallObject);
      console.log(res);
      assert.equal(res, true, 'Save Install Error');
    });
  });*/
  after(function(){
    db.run('DROP TABLE IF EXISTS users', function(err){
      if (err) {
        console.error(err, 123);
        assert.ifError(err);
      }
    });
  });
});
