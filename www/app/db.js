const sqlite3 = require('sqlite3').verbose();
const dbFile = process.env.NODE_ENV === 'production' ? process.env.DB : ':memory:';
const database = () => new sqlite3.Database(dbFile || ':memory:');

function getTable(db) {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY NOT NULL,
        installation TEXT NOT NULL,
        team_id TEXT NOT NULL,
        channel TEXT
      )`, function(err) {
        if (err) {
          console.error(err);
          reject('Unable to create table');
        } else {
          resolve(db);
        };
    });
  });
}

function saveInstall(db, installationItem) {
  return new Promise((resolve, reject) => {
    if (installationItem && installationItem.team && installationItem.bot.token && installationItem.team.id) {
      db.run(`
        INSERT INTO users(installation, team_id)
        VALUES (?, ?)
      `, JSON.stringify(installationItem),
        installationItem.team.id,  
        function(err) {
          if (err) {
            reject('Unable to add installation');
          } else {
            resolve();
          }
        }
      );
    } else {
      reject('Installation item did not contain core items');
    }
  });
}

function getInstall(db, teamId) {
  return new Promise((resolve, reject) => {
    if (teamId) {
      db.get('SELECT installation FROM users WHERE team_id=?', teamId, function(err, row) {
        if (err || !row) {
          console.error('Unable to get installation item');
          reject(err);
        } else {
          const installation = JSON.parse(row.installation);
          resolve(installation);
        }
      });
    };
  });
}

function delInstall(db, teamId) {
  return new Promise((resolve, reject) => {
    if (teamId) {
      db.run('DELETE FROM users WHERE team_id=?', teamId, function(err) {
        if(err) {
          console.error('Unable to delete install');
          reject(err);
        } else {
          resolve(true);
        }
      });
    } else {
      reject('Team id undefined');
    }
  });
}

async function handleConnection(database, fn, ...restArgs) {
  try {
    const db = database();
    const ret = await fn(db, ...restArgs);
    db.close();
    return ret;
  } catch(e) {
    console.error(e);
  }
}

function getLogTable(db) {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS Logs(
        id INTEGER PRIMARY KEY,
        content TEXT,
        log_date TEXT DEFAULT date('now','localtime')
        createdAt INTEGER DEFAULT unixepoch()
      )
    `, function(err) {
        if (err) {
          console.error(err);
          reject('Unable to create Logs table');
        } else {
          resolve(db);
        };
    })
  });
}

function storeLog(db, { content, date }) {
  return new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO(content, log_date) VALUES(?, ?)
    `, content, date, function(err) {
        if (err) {
          console.error(err);
          reject(`Unable to insert content: ${content} and date: ${date}`);
        } else {
          resolve(db);
        };
    })
  });
}

module.exports = {
  database,
  getTable,
  saveInstall,
  getInstall,
  delInstall,
  handleConnection,
  getLogTable,
  storeLog
}
