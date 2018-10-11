const
  Client = require("../clients/platforms/facebook.platform.client"),
  Converter = require("../converters").Facebook,
  misc = require('../../utils/misc'),
  logger = require('../../loggers').appLogger;

module.exports = class FacebookChannel {
  constructor(token, graphVersion) {
    this.client = new Client(token, graphVersion);
    this.convert = new Converter();
  }

  async retrieveNewUserData(event) {
    //Request user public info
    try {
      return await this.client.getUserProfileFields(
        event.sender.id
      );
    } catch (e) {
      throw e;
    }

    //TODO: Convert data to specific schema
    //TODO: Return as many data as possible

  }

  async sendResponse(event, userData, nlpResponse) {
    let that = this;

    try {
      let responseData = that.convert.toResponseMessage(event, userData, nlpResponse);
      await misc.asyncForEach(responseData, (res) => {
        logger.debug(`Sending response back to fb: ${JSON.stringify(res)}`);
        return that.client.sendResponseMessage(res);
      });
    } catch (e) {
      throw e;
    }
  }
};
