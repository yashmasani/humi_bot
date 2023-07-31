const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);
const {
  database,
  handleConnection,
  getLogTable,
  storeLog
} = require('./db')

class Logger {
  constructor(){
    // getLogTable
    console.log('a new Log instance has been made');
    handleConnection(database, getLogTable);
  }
  async store(content) {
    //storeLog
    const date = dayjs().tz('America/Toronto').format('YYYY-MM-DD');
    await handleConnection(database, storeLog, {
      content,
      date
    });
  }
  async log(input) {
    await this.store(input);
    console.log(input);
  }
  info(input) {
    this.log('[INFO]: '+ input);
  }
  debug(input) {
    this.log('[DEBUG]: '+ input);
  }
  warn(input) {
    this.log('[WARN]: '+ input);
  }
  error(input) {
    this.log('[ERROR]: '+ input);
  }
}

const log = new Logger();

module.exports = {
  log,
  Logger
};
