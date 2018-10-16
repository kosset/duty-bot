const dialogflow = require("dialogflow");
const Converter = require("../converters").Dialogflow;
const logger = require('../../loggers').appLogger;
const misc = require("../../utils/misc");

module.exports = class Dialogflow {

  constructor(auth, domainModule) {
    this.projectId = auth.projectId;
    this.languageCode = auth.language;
    this.convert = new Converter();
    this.sessionClient = new dialogflow.SessionsClient({
      credentials: {
        private_key: auth.privateKey,
        client_email: auth.clientEmail
      }
    });

    this.domainModule = domainModule;

    this._fulfillment = {};

    logger.info(`New NLP for Dialogflow created`);
  }

  get fulfillment() {
    return this._fulfillment;
  }

  set fulfillment(value) {
    this._fulfillment = value;
  }

  async process(input, userData, type = 'text') {
    const that = this;

    const sessionId = userData.id; // It's the mongo ID in string
    const reqOptions = {
      language: that.languageCode,
      sessionPath: that.sessionClient.sessionPath(that.projectId, sessionId)
    };

    let request = that.convert.toTextRequest(input, userData, reqOptions);
    if (type === 'event') request = that.convert.toEventRequest(input, userData, reqOptions);

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
      logger.debug(`Result of Dialoglfow: ${JSON.stringify(responses[0].queryResult)}`);
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
    userData.domainData = that.fulfillment.parameters;
    const paramNames = Object.keys(that.fulfillment.parameters);
    paramNames.forEach(paramName => {
      if (paramName !== 'jumpTo') {
        userData.domainData[paramName] = that.fulfillment.parameters[paramName];
      }
    }); //TODO: Let mongoose know that something updated

    // Store output CONTEXTS
    userData.contexts = that.fulfillment.outputContexts;

    // Call actions
    const actionsInString = that.fulfillment.action;
    const actionsInArray = actionsInString.split(',');
    await misc.asyncForEach(actionsInArray, async action => {
      if (typeof that.domainModule.actions[action] === "function") {
        await that.domainModule.actions[action](userData);
      }
    });  //TODO: Let mongoose know that something updated

    // Build the jumps (conditional and unconditional)
    if ('jumpTo' in that.fulfillment.parameters) {
      let eventName = that.fulfillment.parameters.jumpTo;
      await that.process(eventName,userData,'event');
    }
  }

  getFacebookResponse(userData) {
    return this.convert.toFacebookResponse(userData, this.fulfillment);
  }
};
