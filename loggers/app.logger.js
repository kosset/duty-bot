const
  winston = require("winston"),
  config = require('config');

require("winston-daily-rotate-file");

const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.printf(
      log => `${log.level.toUpperCase()}: ${log.message}`
    )
  ),
  level: config.get('logging.console.level'),
  handleExceptions: true,
  humanReadableUnhandledException: true,
  exitOnError: false
});

const fileTransport = new winston.transports.DailyRotateFile({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      log => `${log.timestamp} - ${log.level.toUpperCase()}: ${log.message}`
    )
  ),
  filename: "./%DATE%.log",
  datePattern: "DD-MM-YYYY",
  level: config.get('logging.file.level'),
  handleExceptions: true,
  maxFiles: `${config.get('logging.file.max_files')}d`
});

//TODO: Create a new transport for ERRORs, saving them in the DB

const loggerOptions = {
  transports: [consoleTransport, fileTransport]
};

module.exports = winston.createLogger(loggerOptions);
