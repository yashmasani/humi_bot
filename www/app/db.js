const sqlite3 = require('sqlite3').verbose();

function getTable() {
  try {
    const db = new sqlite3.Database(':memory:');
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY NOT NULL,
        installation TEXT NOT NULL,
        team_id TEXT NOT NULL,
        channel TEXT
      )`
    );
  } catch(e) {
    console.error('Unable to start db');
    console.error(e);
  }
  // create the table
  return db;
}

function saveInstall(db, installationItem) {
  if (installationItem && installationItem.team && installation.token && installation.id) {
    db.run(`
      INSERT INTO users(installation)
      VALUES (?)
    `, JSON.stringify(installationItem),
    function(err) {
      console.error('Unable to authenticate installation');
      console.error(err);
    });
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
        return row.installation;
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
