const sqlite3 = require('sqlite3').verbose();

function getTable() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(':memory:', function(err) {
      if (err) {
        console.error(err);
        resolve(undefined);
      } else {
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
          }
        );
      }
    });
  });
}

function saveInstall(db, installationItem) {
  if (installationItem && installationItem.team && installationItem.bot.token && installationItem.team.id) {
    db.run(`
      INSERT INTO users(installation, team_id)
      VALUES (?, ?)
    `, JSON.stringify(installationItem),
      installationItem.team.id,  
      function(err) {
        if (err) {
          console.error('Unable to add installation');
          console.error(err);
        }
      }
    );
  }
}

function getInstall(db, teamId) {
  if (teamId) {
    db.get('SELECT installation FROM users WHERE team_id=?', teamId, function(err, row) {
      if (!err || !row) {
        console.error('Unable to get installation item');
        console.error(err);
      } else if (row && !row.installation) {
        console.error('Non valid Installation Item');
      } else {
        return JSON.parse(row.installation);
      }
    })
  }
}

function delInstall(db, teamId) {
  if (teamId) {
    db.run('DELETE FROM users WHERE team_id=?', teamId, function(err) {
      if(err) {
        console.error(e);
      }
    });
  }
}


module.exports = {
  getTable,
  saveInstall,
  getInstall,
  delInstall
}
