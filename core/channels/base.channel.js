const
  misc = require('../../utils/misc'),
  logger = require('../../loggers').appLogger;

module.exports = class BaseChannel {
  get client() {
    return this._client;
  }

  set client(value) {
    this._client = value;
  }

  get event() {
    return this._event;
  }

  set event(value) {
    this._event = value;
  }

  constructor() {
    this._client = {};
    this._event = {};
  }

  /**
   * Getter that get's the user's Platform-Scope-ID
   * @returns {String}
   */
  get userPSID() {
    throw new Error(`#userPSID() getter has not been implemented yet on channel.`)
  }

  /**
   * Getter that get's the user's Text input, if any
   * @returns {String | null}
   */
  get userTextInput() {
    throw new Error(`#userTextInput() getter has not been implemented yet on channel.`)
  }

  /**
   * Getter that get's user's Last Message.
   * Convert's non-texts to texts
   * @returns {String}
   */
  get userLastMessage() {
    throw new Error(`#userLastMessage() getter has not been implemented yet on channel.`)
  }

  /**
   * Retrieves new User's Public data
   * @returns {Promise<{gender: *, name: {last: *, first: *}, channel: string, psid: *, fetchedAt: *, picture: *}>}
   */
  async retrieveNewUserData() {
    throw new Error(`#retrieveNewUserData() has not been implemented yet on channel.`)
  }

  /**
   * Sends the response back to the Platform as the bot response.
   * Here the Channel should transform NodeResponses to PlatformResponses
   *
   * @param {Object} nodeResponses
   * @param {Object} userData
   * @returns {Promise<void>}
   */
  async sendResponse(nodeResponses, userData) {
    throw new Error(`#sendResponse() has not been implemented yet on channel.`)
  }

  /**
   * Mark the message as seen for the user
   */
  markAsSeen() {
    throw new Error(`#markAsSeen() has not been implemented yet on channel.`)
  }

  /**
   * Implement Platform Specific default actions
   * @returns {{exampleAction: exampleAction}}
   */
  get actions() {
    let that = this;

    return {
      exampleAction: async function (userData, responses) {
        // Do something asynchronously (for consistency)
      },
    }
  }
}