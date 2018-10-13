const
  winston = require("winston"),
  config = require('config');

require("winston-daily-rotate-file");

/**
 * @type {module:inspector.Console | winston.ConsoleTransportInstance | Console}
 */
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
winston.add(consoleTransport);

/**
 * @type {DailyRotateFileTransportInstance}
 */
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
winston.add(fileTransport);

//TODO: Create a new transport for Loggly

// Export Logger
module.exports = winston;
