const UserModel = require("./models/user.model"),
logger = require('../loggers').appLogger;

module.exports = {
  manageWebhookEvent: async function(rawEvent, channel) {
    //TODO: [OPTIONAL] Convert Incoming Response to An Event
    // Accept-Expect: Text, attachments, attachments and text (links), postback
    let event = channel.convert.toEvent(rawEvent);

    // Fetch from the DB the correct stored data Or Store now some
    let userData = await this.loadUserData(event, channel);

    logger.debug(`User data loaded: ${JSON.stringify(userData)}`);

    //TODO: Pre NLProcess (Some times we may skip it, e.g. on most Postbacks)

    //TODO: NLProcess
    const nlpResponse = { fulfillmentText: event.postback
        ? event.postback.payload
        : event.message.text
          ? event.message.text
          : event.message.attachments[0].type.toUpperCase()};

    //TODO: Post NLProcess

    //Convert Response to PlatformResponse and Send the Response
    channel.sendResponse(event, userData, nlpResponse);

    //Store the needed User Data
    userData.lastMessage = event.postback
      ? event.postback.payload
      : event.message.text
        ? event.message.text
        : event.message.attachments[0].type.toUpperCase();
    this.storeUserData(userData);
  },

  loadUserData: async function(event, channel) {
    //Fetch from the DB the correct stored data
    let userData, retrievedData, newUserData;
    try {
      userData = await UserModel.findByPSID(event.sender.id);
    } catch (e) {
      logger.error(e);
    }

    //TODO: Every day fetch the user data
    if (!userData) {
      // Build new User Data
      try {
        retrievedData = await channel.retrieveNewUserData(event);
        // Store those new Data
        newUserData = new UserModel({
          psid: event.sender.id, // Platform Scoped ID
          name: {
            first: retrievedData.first_name,
            last: retrievedData.last_name
          },
          channel: event.channel,
          gender: retrievedData.gender,
          lastMessage: event.postback
            ? event.postback.payload
            : event.message.text
              ? event.message.text
              : event.message.attachments[0].type.toUpperCase()
        });
        await newUserData.save();
        userData = newUserData;
      } catch (e) {
        logger.error(e);
      }
    }

    return userData;
  },

  storeUserData: async function(userData) {

    try {
      await userData.save();
    } catch (e) {
      logger.error(`Error occurred while storing ${userData.name.full} data: ${e}`);
    }

  }
};
