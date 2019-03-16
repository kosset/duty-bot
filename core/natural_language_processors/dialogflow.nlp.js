const dialogflowNlp = require("dialogflow");
const logger = require("../../loggers").appLogger;
const misc = require("../../utils/misc");
const BaseNLP = require("./base.nlp");

module.exports = class Dialogflow extends BaseNLP{

  constructor(auth, pathOfNodes) {
    super(pathOfNodes);
    this.projectId = auth.projectId;
    this.languageCode = auth.language;
    this.sessionClient = new dialogflowNlp.SessionsClient({
      credentials: {
        private_key: auth.privateKey,
        client_email: auth.clientEmail
      }
    });

    this.queryResult = {};
    logger.info(`New NLP for Dialogflow created`);
  }

  async detectIntent(input, userData) {
    const that = this;

    // Build Request
    const sessionId = userData.id; // It's the mongo ID in string
    const reqOptions = {
      language: that.languageCode,
      sessionPath: that.sessionClient.sessionPath(that.projectId, sessionId)
    };
    const request = that.toRequest(input, userData, reqOptions);

    // Intent Detection
    try {
      logger.debug(`Querying on Dialoglfow: ${JSON.stringify(request)}`);
      const responses = await that.sessionClient.detectIntent(request);
      logger.debug(
        `Result of Dialoglfow: ${JSON.stringify(responses[0].queryResult)}`
      );
      that.queryResult = responses[0].queryResult;
      return responses[0].queryResult.intent.displayName; // Returns the Intent Name
    } catch (e) {
      //TODO: Check if length of text exceeds 256
      //TODO: Retry 3 times
      throw e;
    }
  }

  toRequest(userTextInput, userData, moreOpts) {
    let that = this;

    return {
      session: moreOpts.sessionPath,
      queryInput: {
        text: {
          text: userTextInput,
          languageCode: moreOpts.language
        }
      },
      queryParams: {
        contexts: that.toDialogflowContexts(userData)
      }
    };
  }

  retrieveParameters(userDomainData) {
    const that = this;
    const paramNames = Object.keys(that.queryResult.parameters.fields);
    paramNames.forEach(paramName => {
      if (paramName !== "jumpTo") {
        switch (that.queryResult.parameters.fields[paramName]["kind"]) {
          case "stringValue":
            userDomainData[paramName] =
              that.queryResult.parameters.fields[paramName]["stringValue"];
            break;
          default:
            throw new Error("Unknown type of parameter of Dialogflow");
        }
      }
    }); //TODO: Let mongoose know that something updated
  }
};
