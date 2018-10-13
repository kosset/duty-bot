const
  Client = require("../clients/facebook.client"),
  Converter = require("../converters").Facebook,
  GenderClient = require("../clients/genderize.client"),
  misc = require('../../utils/misc'),
  logger = require('../../loggers').appLogger;

module.exports = class FacebookChannel {
  constructor(token, graphVersion) {
    this.client = new Client(token, graphVersion);
    this.convert = new Converter();
    this.genderizeClient = new GenderClient();
  }

  async retrieveNewUserData(event) {
    let data;

    //Request user public info
    try {
      data = await this.client.getUserProfileFields(
        event.sender.id
      );

      if (data.gender) {
        const genderRes = await this.genderizeClient.getGenderByName(data.first_name);
        data.gender = genderRes.gender;
      }

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
