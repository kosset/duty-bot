/**
 * NPM Module Dependencies
 */
const
  express = require("express"),
  mongoose = require("mongoose"),
  path = require("path"),
  logger = require('./loggers').appLogger,
  cookieParser = require("cookie-parser"),
  config = require('config');

/**
 * LOCAL Module Dependencies
 */
const
  indexRouter = require('./web'),
  apiRouter = require('./web/rest/api');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname + '/web/public')));

/**
 * Endpoints
 */
app.use('/', indexRouter);
app.use(['/api','/api/'], apiRouter);

/**
 * Database Connection
 */
mongoose.connect(config.get('mongo.url'), {useCreateIndex: true, useNewUrlParser: true, useUnifiedTopology: true}).then(
  () => { logger.info(`Successful connection with MongoDB`);},
  error => { logger.error(error); process.exit(1);}
);

module.exports = app;
