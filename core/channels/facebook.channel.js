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

    this._event = {};

    logger.info(`New Facebook channel created`);
  }

  get event() {
    return this._event;
  }

  set event(value) {
    this._event = value;
  }

  get userPSID() {
    return this._event.sender.id;
  }

  get userTextInput() {
    return this.event.postback
      ? this.event.postback.title
      : this.event.message.text
        ? this.event.message.text
        : null;
  }

  get userLastMessage() {
    return this.event.postback
      ? JSON.stringify(this.event.postback)
      : this.event.message.text
      ? this.event.message.text
      : `${this.event.message.attachments[0].type.toUpperCase()} ATTACHMENT`;
  }

  async retrieveNewUserData() {
    const that = this;
    let data;

    //Request user public info
    try {
      data = await that.client.getUserProfileFields(that.userPSID);
    } catch (e) {
      logger.error(`Could not get User Profile Fields from FB: ${e}`);
      throw e;
    }

    // Request gender of the user
    try {
      if (!data.gender) {
        const genderRes = await that.genderizeClient.getGenderByName(data.first_name);
        data.gender = genderRes.gender;
      }
    } catch (e) {
      logger.error(`Could not get User gender by name from genderize: ${e}`);
      throw e;
    }

    return {
      psid: that.userPSID, // Platform Scoped ID
      name: {
        first: data.first_name,
        last: data.last_name
      },
      picture: data.profile_pic,
      channel: 'facebook',
      gender: data.gender,
      fetchedAt: new Date()
    };
  }

  async sendResponse(userData, NLP) {
    const that = this;

    try {
      const responseData = NLP.getFacebookResponse(userData);
      await misc.asyncForEach(responseData, async (res) => {
        logger.debug(`Sending response back to fb: ${JSON.stringify(res)}`);
        await that.client.sendTypingIndicator(that.userPSID);
        await misc.timeout(that.convert.toTypingDelayInMilliSec(res));
        await that.client.sendResponseMessage(res);
      });
    } catch (e) {
      throw e;
    }
  }

  markAsSeen() {
    return this.client.sendMarkAsSeen(this.event.sender.id);
  }
};