const
    express = require("express"),
    config = require("config"),
    logger = require('../loggers').appLogger;

const router = express.Router();

router.get('/', function(req, res, next) {

    let api_resources = {
        "_links": {
            "self": {
                "href": "/api/"
            }
        }
    };

    // Print links
    res.status(200).json(api_resources);

});

// Adds support for GET requests to our webhook
router.get(['/facebook', '/facebook/'], function (req, res, next) {

    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = config.get('facebook.verify_token');

    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {

        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            // Responds with the challenge token from the request
            logger.info('Webhook verified. Subscription succeeded!');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            logger.warn('Webhook did not verified. Subscription failed!');
            res.sendStatus(403);
        }
    }

});

// Creates the endpoint for our webhook
router.post(['/facebook', '/facebook/'], function (req, res) {

    let body = req.body;

    // Checks this is an event from a page subscription
    if (body.object === 'page') {

        // Iterates over each entry - there may be multiple if batched
        body.entry.forEach(function(entry) {

            // Gets the message. entry.messaging is an array, but
            // will only ever contain one message, so we get index 0
            let webhook_event = entry.messaging[0];

            logger.info(`Webhook got event: ${webhook_event}`);

            // Async functionality
            //TODO: Handle the event
        });

        // Returns a '200 OK' response to all requests
        res.status(200).send('EVENT_RECEIVED');
    } else {
        // Returns a '404 Not Found' if event is not from a page subscription
        logger.warn(`Event is not from a page subscription: ${body}`);
        res.sendStatus(404);
    }

});

module.exports = router;
