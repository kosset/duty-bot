const request = require("request");

module.exports = class FacebookClient {
  constructor(token, graphVersion) {
    this.token = token;
    this.graphVersion = graphVersion;
  }

  /******* ********/
  /*** SEND API ***/
  /******* ********/

  sendTextResponse(psid, text) {
    //TODO: Split Text if exceeds the length
    const responseData = {
      messaging_type: "RESPONSE",
      recipient: {
        id: psid
      },
      message: {
        text: text
      }
    };

    return this.sendResponseMessage(responseData);
  }

  sendImageResponse() {}

  sendVideoResponse() {}

  sendCardResponse() {}

  sendListResponse() {}

  sendCarouselResponse() {}

  sendQuickRepliesResponse() {}

  sendMarkAsSeen(psid) {
    return this.sendSenderAction(psid, "mark_seen");
  }

  sendTypingIndicator(psid) {
    return this.sendSenderAction(psid, "typing_on");
  }

  sendSenderAction(psid, senderAction) {
    const responseData = {
      recipient: {
        id: psid
      },
      sender_action: senderAction
    };

    return this.sendResponseMessage(responseData);
  }

  /**
   * @description The sender actions message property allows you to control indicators
   * for typing and read receipts in the conversation via the Send API.
   * This is helpful for letting message recipients known you have seen and
   * are processing their message.
   * @param data
   * @returns {Promise<T | never>}
   */
  sendResponseMessage(data) {
    const that = this;
    const options = {
      method: "POST",
      url: `https://graph.facebook.com/v${that.graphVersion}/me/messages`,
      qs: { access_token: that.token },
      headers: {
        "Content-Type": "application/json"
      },
      body: data,
      json: true
    };

    return that.makeAPIRequest(options).catch(error => {
      throw error;
    });
  }

  /************ ***********/
  /*** USER PROFILE API ***/
  /************ ***********/

  getUserProfileFields(psid) {
    const that = this;
    const options = {
      method: "GET",
      url: `https://graph.facebook.com/${psid}`,
      qs: {
        access_token: that.token,
        fields: "first_name,last_name,profile_pic"
      },
      headers: {
        "Content-Type": "application/json"
      },
      json: true
    };

    return that.makeAPIRequest(options).catch(error => {
      throw error;
    });
  }

  sendProcativeMessage() {}

  makeAPIRequest(options) {
    return new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
        if (error) return reject(error); // This might be an exception

        if ("error" in body) return reject(body.error);

        return resolve(body);
      });
    });
  }
};
