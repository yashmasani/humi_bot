const assert = require('node:assert').strict;
const {
  database,
  getTable,
  saveInstall,
  getInstall,
  delInstall
} = require('../app/db')
const { mockInstallObject } = require('./mocks');

describe('DB', function() {
  it('get table', async function() {
    const db = database();
    const table = await getTable(db);
    assert.notEqual(table, undefined);
    await table.get(
      'SELECT * FROM users',
      function(err, row) {
        assert.ifError(err);
      }
    );
    db.close(); 
  });
  describe('installs', function() {
    let db = database();
    it('saveInstall', async function(){
      const dbInstance = await getTable(db);
      await saveInstall(dbInstance, mockInstallObject);
      await dbInstance.get('SELECT * FROM users', function(err, row) {
        assert.equal(row.id, 1, 'row ID error');
        assert.equal(row.channel, null, 'channel should not be populated');
        assert.equal(row.installation, JSON.stringify(mockInstallObject));
      });
    });
    it('getInstall', async function(){
      const dbInstance = await getTable(db);
      await saveInstall(dbInstance, mockInstallObject);
      const parsedMockInstallationObj = JSON.parse(JSON.stringify(mockInstallObject));
      const installationObject = await getInstall(dbInstance, parsedMockInstallationObj.team.id);
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
      const dbInstance = await getTable(db);
      await saveInstall(dbInstance, mockInstallObject);
      const installationObject = await getInstall(dbInstance, mockInstallObject.team.id);
      assert.equal(installationObject.team.id, mockInstallObject.team.id);
      const res = await delInstall(dbInstance, mockInstallObject.team.id);
      assert.equal(res, true);
    });
    after(function(){
      db.run('DROP TABLE IF EXISTS users', function(err){
        if (err) {
          console.error(err);
          assert.ifError(err);
        }
      });
      db.close();
    });
  });
});
