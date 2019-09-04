const request = require("request");

module.exports = class ViberClient {

  constructor({ authToken, name, avatar, registerToEvents }) {
    this.botAvatar = avatar;
    this.token = authToken;
    this.botName = name;
    this.event_types = registerToEvents;
  }

  setWebhook(url) {
    const that = this;

    let json = {
      url: url,
      send_name: true,
      send_photo: true
    };
    if (that.event_types !== undefined) json.event_types = that.event_types;

    const options = {
      method: "POST",
      url: "https://chatapi.viber.com/pa/set_webhook",
      headers: {
        "X-Viber-Auth-Token": that.token
      },
      json
    };

    return this.makeApiRequest(options).catch(e => {
      throw e;
    });
  }

  sendResponse(receiver, message) {
    const that = this;

    message.receiver = receiver;
    message.sender = {
      name: that.botName,
      avatar: that.botAvatar
    };

    const options = {
      method: "POST",
      url: "https://chatapi.viber.com/pa/send_message",
      headers: {
        "X-Viber-Auth-Token": that.token
      },
      json: message
    };

    return this.makeApiRequest(options).catch(e => {
      throw e;
    });
  }

  getUserDetails(psid) {
    const that = this;

    const options = {
      method: "POST",
      url: "https://chatapi.viber.com/pa/get_user_details",
      headers: {
        "X-Viber-Auth-Token": that.token
      },
      json: {"id": psid}
    };

    return this.makeApiRequest(options).catch(e => {
      throw e;
    });
  }

  makeApiRequest(options, retries = 0) {
    return new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
        if (error) {
          reject(error);
        } else if (body.status > 0) {
          reject(body);
        } else {
          resolve(body);
        }
      });
    });
  }
}
