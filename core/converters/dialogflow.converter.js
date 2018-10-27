module.exports = class DialogflowConverter {
  get sessionId() {
    return this._sessionId;
  }

  set sessionId(value) {
    this._sessionId = value;
  }

  constructor(projectId, domainModule) {
    this.domainModule = domainModule;
    this.projectId = projectId;
    this._sessionId = '';
  }

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
        contexts: that.toDialogflowContexts(userData)
      }
    };
  }

  toDialogflowContexts(userData) {
    const that = this;
    const domainModule = this.domainModule;
    let dfContexts = userData.contexts;

    // Create Contexts for Required and Undefined domainData [e.g. age, weight, height, etc]
    // Thus, the user cannot continue without answering
    if ('contexts' in domainModule && 'requiredData' in domainModule.contexts && userData.domainData) {
      const mustHavePropsContexts = domainModule.contexts.requiredData(userData.domainData);
      mustHavePropsContexts.forEach(domainContextName => {
        dfContexts.push({
          name: that.getContextPath(domainContextName),
          lifespanCount: 0, // Contexts expire automatically after 20 minutes even if there are no matching queries.
        })
      });
    }

    dfContexts.push({
      name: that.getContextPath('user'),
      lifespanCount: 1, // Contexts expire automatically after 20 minutes even if there are no matching queries.
      parameters: {
        fields: {
          firstName: {
            stringValue: userData.name.first,
            kind: 'stringValue'
          },
          lastName: {
            stringValue: userData.name.last,
            kind: 'stringValue'
          },
          fullName: {
            stringValue: userData.name.full,
            kind: 'stringValue'
          }
        },
      }
    });
    return dfContexts;
  }

  getContextPath(contextName) {
    return `projects/${this.projectId}/agent/sessions/${this.sessionId}/contexts/${contextName}`;
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