const
    winston = require("winston");

require("winston-daily-rotate-file");

const logsFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(
        log => `${log.timestamp} - ${log.level.toUpperCase()}: ${log.message}`
    )
);

const consoleTransport = new winston.transports.Console({
    path: "../",
    level: "warn",
    handleExceptions: true,
    humanReadableUnhandledException: true,
    exitOnError: false
});

const fileTransport = new winston.transports.DailyRotateFile({
    path: "../",
    level: "error",
    handleExceptions: true,
    humanReadableUnhandledException: true,
    exitOnError: false
});

//TODO: Create a new transport for ERRORs, saving them in the DB

const loggerOptions = {
    format: logsFormat,
    transports: [consoleTransport, fileTransport]
};

module.exports = new winston.createLogger(loggerOptions);
