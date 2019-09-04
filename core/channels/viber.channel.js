const
  Client = require("../clients/viber.client"),
  BaseChannel = require("./base.channel")
  GenderClient = require("../clients/genderize.client"),
  misc = require('../../utils/misc'),
  logger = require('../../loggers').appLogger;

module.exports = class ViberChannel extends BaseChannel {

  constructor(webhookUrl, opts){
    super();
    this.webhookUrl = webhookUrl;
    this.client = new Client(opts);
    this.genderizeClient = new GenderClient();
  }

  async init() {
    const that = this;
    try {
      await that.client.setWebhook(this.webhookUrl);
    } catch (e) {
      logger.error(`Viber failed to set the webhook: ${JSON.stringify(e)}`);
      throw e;
    }
  }

  get userPSID() {
    return this.event.sender.id;
  }

  async retrieveNewUserData() {
    const that = this;
    let data;

    //Request user public info
    try {
      data = await that.client.getUserDetails(that.userPSID);
    } catch (e) {
      logger.error(`Could not get User Profile Fields from Viber: ${JSON.stringify(e)}`);
      throw e;
    }

    // Get first name and last name
    const firstName = data.name.split(" ")[0];
    const lastName = data.name.replace(firstName,""); // That means that we might miss some names

    // Request gender of the user
    try {
      if (!data.gender) {
        const genderRes = await that.genderizeClient.getGenderByName(data.name.split(" ")[0]);
        data.gender = genderRes.gender;
      }
    } catch (e) {
      logger.error(`Could not get User gender by name from genderize: ${e}`);
      throw e;
    }

    return {
      psid: that.userPSID, // Platform Scoped ID
      name: {
        first: firstName,
        last: lastName
      },
      picture: data.avatar ? data.avatar : null,
      channel: 'viber',
      gender: data.gender,
      fetchedAt: new Date()
    };
  }

  markAsSeen() {
    return null; // That is done by default from Viber
  }

  toViberResponse(nodeResponses, userData) {
    const psid = this.userPSID;

    return nodeResponses.map(function(response) {
      switch (response.type) {
        case 'text':
          return {
            receiver: psid,
            type: "text",
            text: misc.chooseRandom(response.options),
            sender:{
              name: "",
              avatar:""
            }
          };
      }
    });
  }

  get actions() {
    let that = this;

    return {
      exampleAction: async function (userData, responses) {
        // Do something asynchronously (for consistency)
      },
      storeLocation: async function (userData, responses) {
        userData.domainData.locationInCoordinates = {
          latitude: that.event.message.location.lat,
          longitude: that.event.message.location.lon
        };
        userData.markModified('domainData');
      }
    }
  }

}