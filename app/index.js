/**
 * NPM Module Dependencies
 */
const
  express = require("express"),
  mongoose = require("mongoose"),
  path = require("path"),
  logger = require('../loggers').appLogger,
  cookieParser = require("cookie-parser"),
  config = require('config');

/**
 * LOCAL Module Dependencies
 */
const
  indexRouter = require('../routes/index'),
  apiRouter = require('../routes/api');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Endpoints
 */
app.use('/', indexRouter);
app.use(['/api','/api/'], apiRouter);

/**
 * Database Connection
 */
mongoose.connect(config.get('mongo.url'), {useNewUrlParser: true}).then(
    () => { logger.info(`Successful connection with MongoDB`)},
    error => { logger.error(error); process.exit(1);}
);

module.exports = app;