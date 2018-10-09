module.exports = class DialogflowConverter {

  constructor() {}

  toRequest(event, userData, moreOpts) {

    if ('message' in event && 'text' in event.message) {
      return {
        session: moreOpts.sessionPath,
        queryInput: {
          text: {
            text: event.message.text,
            languageCode: moreOpts.language
          }
        }
      };
    } else if ('postback' in event && 'title' in event.postback) {
      return {
        session: moreOpts.sessionPath,
        queryInput: {
          text: {
            text: event.postback.title,
            languageCode: moreOpts.language
          }
        }
      };
    } else {
      return null;
    }

  }

}