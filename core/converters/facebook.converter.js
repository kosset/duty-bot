module.exports = class FacebookConverter {
  constructor() {}

  toEvent(rawEvent) {
    return rawEvent;
  }

  toResponseMessage(event, userData, nlpResponse) {
    const psid = userData.psid;

    return nlpResponse.fulfillmentMessages.map((msg, index) => {
      if (!("platform" in msg) || msg.platform === "FACEBOOK") {
        switch (msg.type) {
          case 0: //text
            return {
              messaging_type: "RESPONSE",
              recipient: {
                id: psid
              },
              message: {
                text: msg.speech //TODO: Handle this better
              }
            };
          case 1: // Card or Carousel
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
                        title: msg.title || `Card's Title`,
                        image_url: msg.imageUrl,
                        subtitle: msg.subtitle,
                        buttons: msg.buttons.map(btn => {
                          if (btn.postback.startsWith('http')) {
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
          case 2: // Quick Replies
            return {
              messaging_type: "RESPONSE",
              recipient: {
                id: psid
              },
              message: {
                text: msg.title,
                quick_replies: msg.replies.map(qr => {
                  return {
                    content_type: "text",
                    title: qr.length > 20 ? "ERROR: Wrong Length" : qr,
                    payload: qr
                  };
                })
              }
            };
          case 3: // Image //TODO: May be I should change this
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
                        attachment_id: msg.imageUrl
                      }
                    ]
                  }
                }
              }
            };
          case 4: // Custom Payload
            return msg;
          default:
            throw new Error(`No response implementation for that type of DF Response: ${JSON.stringify(msg)}`);
        }
      }
    });
  }
};
