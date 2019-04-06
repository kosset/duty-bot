const express = require("express"),
  config = require("config"),
  logger = require("../loggers").appLogger,
  core = require("../core"),
  channels = require("../core/channels"),
  nlp = require("../core/natural_language_processors"),
  domain = require("../domain"),
  fs = require("fs"),
  path = require("path");

const router = express.Router();

router.get("/", function(req, res) {
  let api_resources = {
    _links: {
      self: {
        href: "/api/"
      }
    }
  };

  // Print links
  res.status(200).json(api_resources);
});

// Adds support for GET requests to our webhook
router.get(["/facebook", "/facebook/"], function(req, res) {
  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = config.get("facebook.verify_token");

  // Parse the query params
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      logger.info("Webhook verified. Subscription succeeded!");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      logger.warn("Webhook did not verified. Subscription failed!");
      res.sendStatus(403);
    }
  }
});

// Creates the endpoint for our webhook
router.post(["/facebook", "/facebook/"], function(req, res) {
  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === "page") {

    // Create Channels and NLPs for the specific incoming event
    const nodes = loadConvNodes('conversational_nodes');
    const fbChannel = new channels.Facebook( config.get("facebook.page_access_token"), config.get("facebook.graph_version"));
    const actions = {  ...domain.actions,  ...fbChannel.actions };
    const localNLP = new nlp.Local(nodes, actions);
    const wit = new nlp.Wit({ token: config.get("wit.token") }, nodes, actions);
    // const dialogflow = new nlp.Dialogflow({ projectId: config.get("dialogflow.project_id"), language: config.get("dialogflow.lang"), privateKey: config.get("dialogflow.private_key"), clientEmail: config.get("dialogflow.client_email") }, nodes, actions);

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {
      // Gets the message. entry.messaging is an array, but
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
      webhook_event.channel = "facebook";

      logger.debug(`Webhook got event: ${JSON.stringify(webhook_event)}`);

      //NOTE: Async functionality
      // Handle the event
      core.manageWebhookEvent(webhook_event, fbChannel, localNLP, wit);
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send("EVENT_RECEIVED");
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    logger.warn(`Event is not from a page subscription: ${body}`);
    res.sendStatus(404);
  }
});

function  loadConvNodes(nodesDirectory) {
  logger.info(`Reading all nodes from ${nodesDirectory}`);
  const convNodes = [];
  nodesDirectory = path.resolve(process.cwd(), nodesDirectory);
  //TODO: Make it async
  fs.readdirSync(nodesDirectory).forEach((filename) => {
    const ext = path.extname(filename);
    if (ext === ".json") {
      const content = fs.readFileSync(path.join(nodesDirectory, filename), "utf8");
      try {
        convNodes.push(JSON.parse(content));
      } catch (e) {
        logger.error("Invalid file in response folder.");
      }
    }
  });
  /// Merge all together.
  const result = {};
  convNodes.forEach((x) => {
    Object.assign(result, x);
  });
  return result;
}

module.exports = router;
