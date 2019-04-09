const request = require("request");

module.exports = class ScraperClient {

  constructor(key) {
    this.apikey = key;
  }

  makeGetRequest(url) {
    const that = this;

    const options = {
      method: "GET",
      url: `http://api.scraperapi.com?api_key=${that.apikey}&url=${url}`
    };

    return this.makeAPIRequest(options).catch(error => {
      throw error;
    });
  }

  makeAPIRequest(options) {
    return new Promise((resolve, reject) => {
      request(options, function(error, response, body) {

        if (error) return reject(error); // This might be an exception

        if (response.statusCode > 399) return reject(body);

        return resolve(body);
      });
    });
  }

};