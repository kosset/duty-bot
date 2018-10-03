import request from "request";
import QuoteClient from "quote.client";

module.exports = class PaperQuoteClient extends QuoteClient {
  constructor(token) {
    super();
    this.token = token;
  }

  _getRandomQuotes() {
    const that = this;
    const options = {
      method: "GET",
      url: "https://api.paperquotes.com/apiv1/quotes/",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${that.token}`
      }
    };

    return this.makeAPIRequest(options).catch(error => {
      throw error;
    });
  }

  _getQuotesByCategory(category) {
    const that = this;
    const options = {
      method: "GET",
      url: "https://api.paperquotes.com/apiv1/quotes/",
      qs: { tags: category },
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${that.token}`
      }
    };

    return this.makeAPIRequest(options).catch(error => {
      throw error;
    });
  }

  _getQuoteOfTheDay() {
    const that = this;
    const options = {
      method: "GET",
      url: "https://api.paperquotes.com/apiv1/qod/",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${that.token}`
      }
    };

    return this.makeAPIRequest(options).catch(error => {
      throw error;
    });
  }

  makeAPIRequest(options) {
    return new Promise((resolve, reject) => {
      request(options, function(error, response, body) {
        if (error) return reject(error); // This might be an exception

        if ("error_code" in body) return reject(body);

        return resolve(body);
      });
    });
  }
};
