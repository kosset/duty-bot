const
  Client = require("../clients/facebook.client"),
  GenderClient = require("../clients/genderize.client"),
  misc = require('../../utils/misc'),
  logger = require('../../loggers').appLogger;

module.exports = class FacebookChannel {

  constructor(token, graphVersion) {
    this.client = new Client(token, graphVersion);
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

  async sendResponse(nodeResponses, userData) {
    const that = this;

    try {
      const responseData = that.toFacebookResponse(nodeResponses, userData); //TODO: Convert botResponses to responseData for facebook
      await misc.asyncForEach(responseData, async (res) => {
        logger.debug(`Sending response back to fb: ${JSON.stringify(res)}`);
        await that.client.sendTypingIndicator(that.userPSID);
        await misc.timeout(that.toTypingDelayInMilliSec(res));
        await that.client.sendResponseMessage(res);
      });
    } catch (e) {
      throw e;
    }
  }

  markAsSeen() {
    return this.client.sendMarkAsSeen(this.event.sender.id);
  }

  toTypingDelayInMilliSec(response) {
    let delayInMilliSec = 50;

    if (response.message && response.message.text) {
      delayInMilliSec += response.message.text.length * 20;
    }

    return (delayInMilliSec > 1500) ? 1500 : delayInMilliSec;
  }

  toFacebookResponse(nodeResponses, userData) {
    const psid = userData.psid;

    // Iterating in nodeResponses create the list of FacebookResponses
    return nodeResponses.map(function (response) {
      switch (response.type) {
        case 'text':
          return {
            messaging_type: "RESPONSE",
            recipient: {
              id: psid
            },
            message: {
              text: misc.chooseRandom(response.options)
            }
          };
        case 'quickReplies':
          return {
            messaging_type: "RESPONSE",
            recipient: {
              id: psid
            },
            message: {
              text: misc.chooseRandom(response.questions),
              quick_replies: response.replies.map(qr => {
                return {
                  content_type: "text",
                  title: qr.length > 20 ? "ERROR: Wrong Length" : qr,
                  payload: qr
                };
              })
            }
          };
        case 'cardslist':
        case 'card':
          return {
            messaging_type: "RESPONSE",
            recipient:{
              id: psid
            },
            message:{
              attachment:{
                type:"template",
                payload:{
                  template_type:"generic",
                  elements:[
                    {
                      title: response.title || `Card's Title`,
                      image_url: response.imageUrl,
                      subtitle: response.subtitle,
                      buttons: response.buttons.map(btn => {
                        if (btn.payload.startsWith('http')) {
                          return {
                            type: "web_url",
                            url: btn.postback,
                            title: btn.text
                          };
                        } else {
                          return {
                            type: "postback",
                            title: btn.postback,
                            payload: btn.postback
                          };
                        }
                      })
                    }
                  ]
                }
              }
            }
          };
        case 'location':
          return {
            messaging_type: "RESPONSE",
            recipient: {
              id: psid
            },
            message: {
              text: misc.chooseRandom(response.questions),
              quick_replies: [{
                content_type:"location"
              }]
            }
          };
        default:
          break;
      }
    });
  }
};
