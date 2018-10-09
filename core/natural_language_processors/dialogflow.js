const dialogflow = require('dialogflow');
const Converter = require('../converters').Dialogflow;

module.exports = class Dialogflow {

  constructor(projectId, language) {
    this.projectId = projectId;
    this.languageCode = language;
    this.convert = new Converter();
    this.sessionClient = new dialogflow.SessionsClient();
  }

  async process(event, userData) {
    const that = this;

    const sessionId = userData.id;
    const reqOptions = {
      language: that.languageCode,
      sessionPath: that.sessionClient.sessionPath(that.projectId, sessionId)
    };

    const request = that.convert.toRequest(event, userData, reqOptions);

    try {

      if (request) {
        const result = await that.detectIntent(request);
        await that.analyzeResult(event, userData, result);
        return result;
      }

    } catch (e) {
      throw e;
    }
  }

  async detectIntent(request) {
    const that = this;

    try {
      const responses = await that.sessionClient.detectIntent(request);
      return responses[0].queryResult;
    } catch (e) {
      //TODO: Check if length of text exceeds 256
      //TODO: Retry 3 times
      throw e;
    }
  }

  async analyzeResult(event, userData, result) {
    //TODO: Build the jumps (conditional and unconditional)

    //TODO: Enrich/Update userData etc
  }

};