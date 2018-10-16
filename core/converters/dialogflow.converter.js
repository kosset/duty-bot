module.exports = class DialogflowConverter {

  constructor() {}

  toTextRequest(userTextInput, userData, moreOpts) {
    let that = this;

    return {
      session: moreOpts.sessionPath,
      queryInput: {
        text: {
          text: userTextInput,
          languageCode: moreOpts.language
        }
      },
      queryParams: {
        resetContexts: false,
        contexts: that.toDialogflowContexts(userData)
      }
    };
  }

  toEventRequest(name, userData, moreOpts) {
    let that = this;

    return {
      session: moreOpts.sessionPath,
      queryInput: {
        event: {
          name: name,
          languageCode: moreOpts.language
        }
      },
      queryParams: {
        resetContexts: false,
        contexts: that.toDialogflowContexts(userData)
      }
    };
  }

  toDialogflowContexts(userData) {
    let dfContexts = userData.contexts;
    dfContexts.push({
      name: 'USER',
      lifespanCount: 0, // Contexts expire automatically after 20 minutes even if there are no matching queries.
      parameters: {
        firstName: userData.name.first,
        lastName: userData.name.last,
        fullName: userData.name.full,
        otherData: userData.domainData
      }
    });
    return dfContexts;
  }

  toFacebookResponse(userData, nlpResponse) {
    const psid = userData.psid;

    return nlpResponse.fulfillmentMessages.map((msg, index) => {
      if (msg.platform === 'PLATFORM_UNSPECIFIED' || msg.platform === "FACEBOOK") {
        switch (msg.message) {
          case 'text':
            return {
              messaging_type: "RESPONSE",
              recipient: {
                id: psid
              },
              message: {
                text: msg.text.text[0] //TODO: Handle this better
              }
            };
          case 'card': // Card or Carousel
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
                        title: msg.card.title || `Card's Title`,
                        image_url: msg.card.imageUrl,
                        subtitle: msg.card.subtitle,
                        buttons: msg.card.buttons.map(btn => {
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
          case 'quickReplies': // Quick Replies
            return {
              messaging_type: "RESPONSE",
              recipient: {
                id: psid
              },
              message: {
                text: msg.title,
                quick_replies: msg.quickReplies.quickReplies.map(qr => {
                  return {
                    content_type: "text",
                    title: qr.length > 20 ? "ERROR: Wrong Length" : qr,
                    payload: qr
                  };
                })
              }
            };
          case 'image': // Image //TODO: May be I should change this
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
                        attachment_id: msg.image.imageUri
                      }
                    ]
                  }
                }
              }
            };
          default:
            throw new Error(`No response implementation for that type of DF Response: ${JSON.stringify(msg)}`);
        }
      }
    });
  }

}