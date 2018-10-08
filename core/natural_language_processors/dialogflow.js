const dialogflow = require('dialogflow');

module.exports = class Dialogflow {

  constructor(projectId, language) {
    this.projectId = projectId;
    this.languageCode = language;

    this.sessionClient = new dialogflow.SessionsClient();
  }

  preProcess() {

    //TODO: return true or false, to continue with the process
    return false;
  }

  process(event, userData) {
    const sessionId = userData.id;

    // Define session path
    const sessionPath = this.sessionClient.sessionPath(this.projectId, sessionId);


    //TODO: Check what type of event was and build the correct request

  }

  postProcess(event, userData) {

  }

  async sendTextQuery(sessionPath, text) {
    const that = this;

    // The text query request.
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: text,
          languageCode: that.languageCode,
        },
      },
    };

    try {
      const responses = await sessionClient.detectIntent(request);
      return responses[0].queryResult;
    } catch (e) {
      //TODO: Check if length of text exceeds 256
      //TODO: Retry 3 times

      throw e;
    }
  }

  async sendPostbackQuery(sessionPath, eventName, parameters = {}) {
    const that = this;

    // The event query request.
    const request = {
      session: sessionPath,
      queryInput: {
        event: {
          name: eventName,
          parameters: parameters,
          languageCode: that.languageCode,
        },
      },
    };

    try {
      const responses = await sessionClient.detectIntent(request);
      return responses[0].queryResult;
    } catch (e) {
      //TODO: Check if length of text exceeds 256
      //TODO: Retry 3 times

      throw e;
    }
  }

}