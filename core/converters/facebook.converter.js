module.exports = class FacebookConverter {
  constructor() {}

  toEvent(rawEvent) {
    return rawEvent;
  }

  toResponseMessage(event, userData, nlpResponse) {
    const
      that = this,
      psid = userData.psid;

    return nlpResponse.fulfillmentMessages.map((msg, index) => {
      if (!("platform" in msg) || msg.platform === "FACEBOOK") {
        if ("text" in msg) {
          // Text
          return {
            messaging_type: "RESPONSE",
            recipient: {
              id: psid
            },
            message: {
              text: msg.text.text[0] //TODO: Handle this better
            }
          };
        } else if ("image" in msg) {
          // Image TODO: May be I should change this
          return {
            messaging_type: "RESPONSE",
            recipient: {
              id: psid
            },
            message: {
              attachment: {
                type: "template",
                payload: {
                  template_type: "media",
                  elements: [
                    {
                      media_type: "image",
                      attachment_id: msg.image.imageUrl
                    }
                  ]
                }
              }
            }
          };
        } else if ("quickReplies" in msg) {
          // QuickReplies
          return {
            messaging_type: "RESPONSE",
            recipient: {
              id: psid
            },
            message: {
              text: msg.quickReplies.title,
              quick_replies: msg.quickReplies.quickReplies.map(qr => {
                return {
                  content_type: "text",
                  title: qr.length > 20 ? "ERROR: Wrong Length" : qr,
                  payload: qr
                };
              })
            }
          };
        } else if ("card" in msg) {
          // Card or Carousel
          //TODO: Create a check here for that responses
        } else {
          throw new Error(
            `That type of message has not been implemented for facebook yet: ${JSON.stringify(
              msg
            )}`
          );
        }
      }
    });
  }
};
