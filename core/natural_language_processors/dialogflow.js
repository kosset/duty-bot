const dialogflow = require("dialogflow");
const Converter = require("../converters").Dialogflow;
const logger = require('../../loggers').appLogger;

module.exports = class Dialogflow {

  constructor(projectId, language, privateKey, clientEmail) {
    this.projectId = projectId;
    this.languageCode = language;
    this.convert = new Converter();
    this.sessionClient = new dialogflow.SessionsClient({
      credentials: {
        private_key: privateKey,
        client_email: clientEmail
      }
    });

    this._fulfillment = {};

    logger.info(`New NLP for Dialogflow created`);
  }

  get fulfillment() {
    return this._fulfillment;
  }

  set fulfillment(value) {
    this._fulfillment = value;
  }

  async process(userTextInput, userData) {
    const that = this;

    const sessionId = userData.id; // It's the mongo ID in string
    const reqOptions = {
      language: that.languageCode,
      sessionPath: that.sessionClient.sessionPath(that.projectId, sessionId)
    };

    const request = that.convert.toTextRequest(userTextInput, userData, reqOptions);

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
    //TODO: Store Params

    //TODO: Call actions

    //TODO: Build the jumps (conditional and unconditional)
    //TODO: Enrich/Update userData etc
  }

  getFacebookResponse(userData) {
    return this.convert.toFacebookResponse(userData, this.fulfillment);
  }
};
