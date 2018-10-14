const UserModel = require("./models/user.model"),
  logger = require("../loggers").appLogger;

module.exports = {
  manageWebhookEvent: async function(
    rawEvent,
    channel,
    naturalLanguageProcessor
  ) {
    let userData,
      parallelPromises = [];

    // Accept-Expect: Text, attachments, attachments and text (links), postback
    channel.event = rawEvent;

    // Let user know that the bot got her response
    channel.markAsSeen().catch(e => logger.error(e));

    // Load User Data
    try {
      userData = await this.loadUserData(channel);
      logger.debug(`User data loaded: ${JSON.stringify(userData)}`);
    } catch (e) {
      logger.error(
        `Could not load data for user with psid ${channel.userPSID}: ${e}`
      );
      throw e; // Break the cycle
    }

    try {
      // Natural Language Process
      if (channel.userTextInput) {
        await naturalLanguageProcessor.process(channel.userTextInput, userData);
        parallelPromises.push(
          channel.sendResponse(userData, naturalLanguageProcessor)
        );
      } else {
        //TODO: Handle all other incoming events and send custom Responses
      }
    } catch (e) {
      logger.error(e);
      throw e; // Break the cycle
    }

    try {
      // Store Data and send response IN PARALLEL
      // NOTE: Do not wait if it is sent, do this async.
      parallelPromises.push(this.storeUserData(userData));
      await Promise.all(parallelPromises);
    } catch (e) {
      logger.error(e);
    }
  },

  loadUserData: async function(channel) {
    let userData, retrievedData;

    //Fetch from the DB the correct stored data
    try {
      userData = await UserModel.findByPSID(channel.userPSID);
    } catch (e) {
      logger.error(`Error while finding user on DB: ${e}`);
      throw e;
    }

    // Every day fetch the user data
    const shouldFetchData =
      !userData ||
      (userData &&
        userData.fetchedAt &&
        Date.now() - userData.fetchedAt.getTime() > 24 * 60 * 60 * 1000);
    if (shouldFetchData) {
      // Build new/updated User Data
      try {
        retrievedData = await channel.retrieveNewUserData();
        userData = new UserModel(retrievedData);
      } catch (e) {
        logger.error(`Error retrieving new user data from channel: ${e}`);
      }
    }

    // Store Last Message
    userData.lastMessage = channel.userLastMessage;

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