const UserModel = require("./models/user.model"),
  logger = require("../loggers").appLogger;

module.exports = {
  manageWebhookEvent: async function(
    rawEvent,
    channel,
    naturalLanguageProcessor
  ) {
    let event,
      userData,
      nlpResponse,
      parallelPromises = [];

    // Accept-Expect: Text, attachments, attachments and text (links), postback
    event = channel.convert.toEvent(rawEvent); //TODO: [OPTIONAL] Convert Incoming Response to An Event

    // TODO: Make it channelWise not ClientWise
    channel.client.sendMarkAsSeen(event.sender.id);

    // Load User Data
    try {
      userData = await this.loadUserData(event, channel);
      logger.debug(`User data loaded: ${JSON.stringify(userData)}`);
    } catch (e) {
      logger.error(`Could not load data for user with psid ${event.sender.id}: ${e}`);
      throw e; // Break the cycle
    }

    //NLProcess
    try {
      nlpResponse = await naturalLanguageProcessor.process(event, userData);
    } catch (e) {
      logger.error(e);
      throw e; // Break the cycle
    }

    // Store Data and send response IN PARALLEL
    // NOTE: Do not wait if it is sent, do this async.
    parallelPromises.push(this.storeUserData(userData));
    parallelPromises.push(channel.sendResponse(event, userData, nlpResponse));
    await Promise.all(parallelPromises).catch(e => {
      logger.error(e);
    });
  },

  loadUserData: async function(event, channel) {
    let userData, retrievedData, newUserData;

    //Fetch from the DB the correct stored data
    try {
      userData = await UserModel.findByPSID(event.sender.id);
    } catch (e) {
      logger.error(`Error while finding user on DB: ${e}`);
      throw e;
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
          gender: retrievedData.gender
        });
        // await newUserData.save();
        userData = newUserData;
      } catch (e) {
        logger.error(`Error retrieving new user data from channel: ${e}`);
      }
    }

    // Store Last Message
    //Store the needed User Data
    userData.lastMessage = event.postback
      ? event.postback.payload
      : event.message.text
        ? event.message.text
        : event.message.attachments[0].type.toUpperCase();

    return userData;
  },

  storeUserData: async function(userData) {
    try {
      await userData.save();
    } catch (e) {
      logger.error(
        `Error occurred while storing ${userData.name.full} data: ${e}`
      );
    }
  }
};
