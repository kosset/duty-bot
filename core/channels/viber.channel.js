const Client = require("../clients/viber.client"),
  BaseChannel = require("./base.channel");
(GenderClient = require("../clients/genderize.client")),
  (misc = require("../../utils/misc")),
  (logger = require("../../loggers").appLogger);

module.exports = class ViberChannel extends BaseChannel {
  constructor(webhookUrl, opts) {
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

  get userTextInput() {
    return this.event.message && this.event.event === "message"
      ? this.event.message.type === "text"
        ? this.event.message.text
        : null
      : null;
  }

  get userLastMessage() {
    return this.event.message.type === "text"
      ? this.event.message.text
      : `${this.event.message.type.toUpperCase()} ATTACHMENT`;
  }

  async retrieveNewUserData() {
    const that = this;
    let data = {};

    // //Request user public info
    // try {
    //   data = await that.client.getUserDetails(that.userPSID);
    // } catch (e) {
    //   logger.error(
    //     `Could not get User Profile Fields from Viber: ${JSON.stringify(e)}`
    //   );
    //   // throw e;
    // }

    // Get first name and last name
    const firstName = that.event.sender.name ? that.event.sender.name.split(" ")[0] : "UNKNOWN_VIBER_USER";
    const lastName = that.event.sender.name ? that.event.sender.name.replace(firstName, ""): "UNKNOWN_VIBER_USER"; // That means that we might miss some names

    // Request gender of the user
    try {
      if (!data.gender && firstName !== "UNKNOWN_VIBER_USER") {
        const genderRes = await that.genderizeClient.getGenderByName(
          firstName
        );
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
      picture: that.event.sender.avatar,
      channel: "viber",
      gender: data.gender,
      fetchedAt: new Date()
    };
  }

  markAsSeen() {
    return Promise.resolve(); // That is done by default from Viber
  }

  async sendResponse(nodeResponses, userData) {
    const that = this;

    try {
      const responseData = that.toViberResponse(nodeResponses, userData); //Convert botResponses to responseData for facebook
      await misc.asyncForEach(responseData, async res => {
        logger.debug(`Sending response back to viber: ${JSON.stringify(res)}`);
        await that.client.sendResponse(that.userPSID, res);
      });
    } catch (e) {
      throw e;
    }
  }

  toViberResponse(nodeResponses, userData) {
    const that = this;

    return nodeResponses.map(function(response) {
      switch (response.type) {
        case "text":
          return {
            type: "text",
            text: misc.chooseRandom(response.options)
          };
        case "quickReplies":
          return {
            min_api_version: 4,
            type: "text",
            text: misc.chooseRandom(response.questions),
            keyboard: {
              Buttons: response.replies.map(r => {
                return {
                  ActionType: "reply",
                  Text: r,
                  ActionBody: r
                };
              })
            }
          };
        case "card":
          return {
            type: "rich_media",
            min_api_version: 6,
            rich_media: {
              Type: "rich_media",
              Buttons: ViberChannel.convertCardToViberButtons(response)
            }
          };
        case "cardslist":
          const Buttons2DArray = response.cards.map(card => {
            return ViberChannel.convertCardToViberButtons(card);
          });
          return {
            type: "rich_media",
            min_api_version: 6,
            rich_media: {
              Type: "rich_media",
              Buttons: [].concat(...Buttons2DArray)
            }
          };
        case "location":
          return {
            type: "text",
            text: misc.chooseRandom(response.questions),
            min_api_version: 3,
            keyboard: {
              Buttons: [
                {
                  ActionType: "location-picker",
                  Text: response.buttonTitle || "📍 Share Location",
                  ActionBody: "none"
                }
              ]
            }
          };
        default:
          break;
      }
    });
  }


  toViberWelcomeMessage(nodeResponses) {
    const that = this;

    let welcomeMessage = {
      type: "text",
      text: "",
      sender: {
        name: that.client.botName,
        avatar: that.client.botAvatar
      }
    };

    nodeResponses.forEach(function(response) {
      switch (response.type) {
        case "text":
          welcomeMessage["text"] += misc.chooseRandom(response.options) + ' ';
          break;
        case "quickReplies":
          welcomeMessage["text"] += misc.chooseRandom(response.questions);
          welcomeMessage["min_api_version"] = 4;
          welcomeMessage["keyboard"] = {
            Buttons: response.replies.map(r => {
              return {
                ActionType: "reply",
                Text: r,
                ActionBody: r
              };
            })
          };
          break;
      }
    });

    return welcomeMessage;
  }

  static convertCardToViberButtons(card, MaxButtonsGroupRows = 7) {
    // Calculate the rows of each element in the card
    const rowsOfCardButtons = "buttons" in card ? card.buttons.length : 0; // Each button has 1 Row
    const rowsOfImage = card.imageUrl
      ? Math.ceil((MaxButtonsGroupRows - rowsOfCardButtons) / 2)
      : 0;
    const rowsOfSubtitle = card.subtitle
      ? Math.floor(
          (MaxButtonsGroupRows - (rowsOfCardButtons + rowsOfImage)) / 2
        )
      : 0;
    const rowsOfTitle =
      MaxButtonsGroupRows - (rowsOfImage + rowsOfCardButtons + rowsOfSubtitle);

    let result = [];

    // Convert Image
    if ("imageUrl" in card && card.imageUrl !== "") {
      result.push({
        Rows: rowsOfImage,
        ActionBody: "",
        ActionType: "none",
        Image: card.imageUrl
      });
    }

    // Convert Title
    result.push({
      Rows: rowsOfTitle,
      Text: `<b>${card.title}</b>`,
      ActionType: "none",
      ActionBody: ""
    });

    // Convert Subtitle
    if ("subtitle" in card && card.subtitle !== "") {
      result.push({
        Rows: rowsOfSubtitle,
        Text: card.subtitle,
        TextOpacity: 20,
        TextSize: "small",
        ActionType: "none",
        ActionBody: ""
      });
    }

    // Convert Card Buttons
    if ("buttons" in card && card.buttons.length > 0) {
      const cardButtons = card.buttons.map(b => {
        switch (b.type) {
          case "url":
            return {
              Rows: 1,
              Text: b.title,
              ActionType: "open-url",
              ActionBody: b.payload,
              Silent: true,
              OpenURLType: "external",
              OpenURLMediaType: "not-media"
            };
          case "postback":
            return {
              Rows: 1,
              Text: b.title,
              ActionType: "reply",
              ActionBody: b.payload
            };
          case "phone":
            return {
              Rows: 1,
              Text: b.title,
              ActionType: "none",
              ActionBody: ""
            };
        }
      });
      result.push(...cardButtons);
    }

    return result;
  }

  get actions() {
    let that = this;

    return {
      exampleAction: async function(userData, responses) {
        // Do something asynchronously (for consistency)
      },
      storeLocation: async function(userData, responses) {
        userData.domainData.locationInCoordinates = {
          latitude: that.event.message.location.lat,
          longitude: that.event.message.location.lon
        };
        userData.markModified("domainData");
      }
    };
  }
};
