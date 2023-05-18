const assert = require('node:assert').strict;
const {
  db,
  getTable,
  saveInstall,
  getInstall,
  delInstall
} = require('../app/db')

describe('DB', function() {
  it('get table', async function() {
    const database = await getTable(db);
    assert.notEqual(database, undefined);
    await database.get(
      'SELECT * FROM users',
      function(err, row) {
        assert.ifError(err);
      }
    );
  });
  describe('installs', function() {
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
    it('saveInstall', async function(){
      const database = await getTable(db);
      await saveInstall(database, mockInstallObject);
      await database.get('SELECT * FROM users', function(err, row) {
        assert.equal(row.id, 1, 'row ID error');
        assert.equal(row.channel, null, 'channel should not be populated');
        assert.equal(row.installation, JSON.stringify(mockInstallObject));
      });
    });
    it('getInstall', async function(){
      const database = await getTable(db);
      await saveInstall(database, mockInstallObject);
      const parsedMockInstallationObj = JSON.parse(JSON.stringify(mockInstallObject));
      const installationObject = await getInstall(database, parsedMockInstallationObj.team.id);
      assert.equal(Object.keys(parsedMockInstallationObj).length, Object.keys(installationObject).length);
      for (const key of Object.keys(parsedMockInstallationObj)) {
        if (typeof parsedMockInstallationObj[key] === 'object') {
          assert.equal(JSON.stringify(parsedMockInstallationObj[key]), JSON.stringify(installationObject[key]));
        } else {
          assert.equal(parsedMockInstallationObj[key], installationObject[key]);
        }
      }
    });
    it('delInstall', async function(){
      const database = await getTable(db);
      await saveInstall(database, mockInstallObject);
      const installationObject = await getInstall(database, mockInstallObject.team.id);
      assert.equal(installationObject.team.id, mockInstallObject.team.id);
      console.log(mockInstallObject.team.id);
      const res = await delInstall(database, mockInstallObject.team.id);
      assert.equal(res, true);
    });
    after(function(){
      db.run('DROP TABLE IF EXISTS users', function(err){
        if (err) {
          console.error(err);
          assert.ifError(err);
        }
      });
    });
  });
  after(function(){
    db.run('DROP TABLE IF EXISTS users', function(err){
      if (err) {
        console.error(err);
        assert.ifError(err);
      }
    });
  });
});
