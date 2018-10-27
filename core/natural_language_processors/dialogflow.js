const dialogflow = require("dialogflow");
const Converter = require("../converters").Dialogflow;
const logger = require("../../loggers").appLogger;
const misc = require("../../utils/misc");

module.exports = class Dialogflow {
  get oldMessages() {
    return this._oldMessages;
  }

  set oldMessages(value) {
    this._oldMessages = value;
  }

  constructor(auth, domainModule) {
    this.projectId = auth.projectId;
    this.languageCode = auth.language;
    this.domainModule = domainModule;
    this.convert = new Converter(auth.projectId, domainModule);
    this.sessionClient = new dialogflow.SessionsClient({
      credentials: {
        private_key: auth.privateKey,
        client_email: auth.clientEmail
      }
    });

    this._fulfillment = {};
    this._oldMessages = [];

    logger.info(`New NLP for Dialogflow created`);
  }

  get fulfillment() {
    return this._fulfillment;
  }

  set fulfillment(value) {
    this._fulfillment = value;
  }

  async process(input, userData, type = "text") {
    const that = this;

    const sessionId = userData.id; // It's the mongo ID in string
    that.convert.sessionId = sessionId;
    const reqOptions = {
      language: that.languageCode,
      sessionPath: that.sessionClient.sessionPath(that.projectId, sessionId)
    };

    let request = that.convert.toTextRequest(input, userData, reqOptions);
    if (type === "event")
      request = that.convert.toEventRequest(input, userData, reqOptions);

    try {
      that.fulfillment = await that.detectIntent(request);
      await that.analyzeResult(userData);
    } catch (e) {
      throw e;
    }
  }

  async detectIntent(request) {
    const that = this;

    try {
      logger.debug(`Querying on Dialoglfow: ${JSON.stringify(request)}`);
      const responses = await that.sessionClient.detectIntent(request);
      logger.debug(
        `Result of Dialoglfow: ${JSON.stringify(responses[0].queryResult)}`
      );
      return responses[0].queryResult;
    } catch (e) {
      //TODO: Check if length of text exceeds 256
      //TODO: Retry 3 times
      throw e;
    }
  }

  async analyzeResult(userData) {
    let that = this;

    // Store/Update Params
    that.retrieveParameters(userData.domainData);

    // Store output CONTEXTS
    //TODO: Fix storing output contexts (problem when include parameters)
    userData.contexts = that.fulfillment.outputContexts;

    // Call actions
    try {
      await that.callActions(userData);
    } catch (e) {
      logger.error(e);
    }

    // Build the jumps (unconditional)
    if (
      "fields" in that.fulfillment.parameters &&
      "jumpTo" in that.fulfillment.parameters.fields
    ) {
      that.oldMessages = that.oldMessages.concat(
        that.fulfillment.fulfillmentMessages
      );
      let eventName = that.fulfillment.parameters.fields.jumpTo.stringValue;
      await that.process(eventName, userData, "event");
      that.fulfillment.fulfillmentMessages = that.oldMessages.concat(
        that.fulfillment.fulfillmentMessages
      );
      that.oldMessages = [];
    }
  }

  getFacebookResponse(userData) {
    return this.convert.toFacebookResponse(userData, this.fulfillment);
  }

  retrieveParameters(userDomainData) {
    const that = this;
    const paramNames = Object.keys(that.fulfillment.parameters.fields);
    paramNames.forEach(paramName => {
      if (paramName !== "jumpTo") {
        switch (that.fulfillment.parameters.fields[paramName]["kind"]) {
          case "stringValue":
            userDomainData[paramName] =
              that.fulfillment.parameters.fields[paramName]["stringValue"];
            break;
          default:
            throw new Error("Unknown type of parameter of Dialogflow");
        }
      }
    }); //TODO: Let mongoose know that something updated
  }

  async callActions(userData) {
    const that = this;
    if ("actions" in that.domainModule) {
      try {
        const actionsInString = that.fulfillment.action;
        const actionsInArray = actionsInString.split(",");
        await misc.asyncForEach(actionsInArray, async action => {
          if (typeof that.domainModule.actions[action] === "function") {
            await that.domainModule.actions[action](userData);
          }
        }); //TODO: Let mongoose know that something updated
      } catch (e) {
        throw e;
      }
    }
  }
};
