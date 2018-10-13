import request from "request";

module.exports = class FavqsClient {
  constructor(token) {
    this.token = token;
  }

  _getRandomQuotes() {
    const that = this;
    const options = {
      method: "GET",
      url: "https://favqs.com/api/quotes",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token token=${that.token}`
      }
    };

    return this.makeAPIRequest(options).catch(error => {
      throw error;
    });
  }

  _getQuotesByKeyword(keyword) {
    const that = this;
    const options = {
      method: "GET",
      url: "https://favqs.com/api/quotes",
      qs: { filter: keyword },
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token token=${that.token}`
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
      url: "https://favqs.com/api/quotes",
      qs: { filter: category, type: "tag" },
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token token=${that.token}`
      }
    };

    return this.makeAPIRequest(options).catch(error => {
      throw error;
    });
  }

  _getQuotesByAuthor(author) {
    const that = this;
    const options = {
      method: "GET",
      url: "https://favqs.com/api/quotes",
      qs: { filter: author, type: "author" },
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token token=${that.token}`
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
      url: "https://favqs.com/api/qotd",
      headers: { "Content-Type": "application/json" }
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
