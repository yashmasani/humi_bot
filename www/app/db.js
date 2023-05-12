const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

function getTable() {
  // create the table
  return db;
}

function saveInstall() {
  //pass
}

function getInstall() {
  //pass
}

function delInstall() {
  //pass
}


module.exports = {
  getTable,
  saveInstall,
  getInstall,
  delInstall
}
