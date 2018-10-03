/**
 * NPM Module Dependencies
 */
const express = require("express") ;
const mongoose = require("mongoose") ;
const path = require("path");
const logger = require('../loggers').appLogger;
const cookieParser = require("cookie-parser");

/**
 * LOCAL Module Dependencies
 */
const indexRouter = require('../routes/index');
const apiRouter = require('../routes/api');

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
mongoose.connect('mongodb://localhost:27017/test', {useNewUrlParser: true}).then(
    () => { logger.info(`Successful connection with MongoDB!`)},
    error => { logger.error(error)}
);

module.exports = app;