const
  Client = require("../clients/facebook.client"),
  BaseChannel = require("./base.channel")
  GenderClient = require("../clients/genderize.client"),
  misc = require('../../utils/misc'),
  logger = require('../../loggers').appLogger;

module.exports = class FacebookChannel extends BaseChannel{

  constructor(token, graphVersion) {
    super();
    this.client = new Client(token, graphVersion);
    this.genderizeClient = new GenderClient();

    logger.info(`New Facebook channel created`);
  }

  get userPSID() {
    return this.event.sender.id;
  }

  get userTextInput() {
    return this.event.message
      ? this.event.message.text
       ? this.event.message.text
        : null
      : null;
  }

  get userLastMessage() {
    return this.event.postback
      ? this.event.postback.payload
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
      logger.error(`Could not get User Profile Fields from FB: ${JSON.stringify(e)}`);
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
      const responseData = that.toFacebookResponse(nodeResponses, userData); //Convert botResponses to responseData for facebook
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
    const psid = this.userPSID;
    const botId = this.event.recipient.id;

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
                        switch (btn.type) {
                          case "url":
                            return {
                              type: "web_url",
                              title: btn.title,
                              url: btn.payload
                            };
                          case "phone":
                            return {
                              type: "phone_number",
                              title: btn.title,
                              payload: btn.payload
                            };
                          default:
                            return {
                              type: "postback",
                              title: btn.title,
                              payload: btn.payload
                            };
                        }
                      })
                    }
                  ]
                }
              }
            }
          };
        case 'cardslist':
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
                  elements: response.cards.map(card => {
                    return {
                      title: card.title || `Card's Title`,
                      image_url: card.imageUrl,
                      subtitle: card.subtitle,
                      buttons: card.buttons.map(btn => {
                        switch (btn.type) {
                          case "url":
                            return {
                              type: "web_url",
                              title: btn.title,
                              url: btn.payload
                            };
                          case "phone":
                            return {
                              type: "phone_number",
                              title: btn.title,
                              payload: btn.payload
                            };
                          default:
                            return {
                              type: "postback",
                              title: btn.title,
                              payload: btn.payload
                            };
                        }
                      })
                    }
                  })
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
        case 'sharecard':
          return  {
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
                      title: response.title || `Do you want to share me through messenger?`,
                      image_url: response.imageUrl,
                      subtitle: response.subtitle,
                      buttons: [
                        {
                          type: "element_share",
                          share_contents: {
                            attachment: {
                              type: "template",
                              payload: {
                                template_type: "generic",
                                elements: [
                                  {
                                    title: response.shared.title || `You must try this bot!`,
                                    subtitle: response.shared.subtitle,
                                    image_url: response.shared.imageUrl,
                                    default_action: {
                                      type: "web_url",
                                      url: `https://m.me/${botId}?ref=invited_by_${psid}`
                                    },
                                    buttons: [
                                      {
                                        type: "web_url",
                                        url: `https://m.me/${botId}?ref=invited_by_${psid}`,
                                        title: response.shared.button.title
                                      }
                                    ]
                                  }
                                ]
                              }
                            }
                          }
                        }
                      ]
                    }
                  ]
                }
              }
            }
          };
        default:
          break;
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
          latitude: that.event.message.attachments[0].payload.coordinates.lat,
          longitude: that.event.message.attachments[0].payload.coordinates.long
        };
        userData.markModified('domainData');
      }
    }
  }
};
