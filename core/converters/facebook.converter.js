module.exports = class FacebookConverter {
  constructor() {}

  toEvent(rawEvent) {
    return rawEvent;
  }

  toTypingDelayInMilliSec(response) {
    let delayInMilliSec = 50;

    if (response.message && response.message.text) {
      delayInMilliSec += response.message.text.length * 20;
    }

    return (delayInMilliSec > 1500) ? 1500 : delayInMilliSec;
  }
};
