const request = require("request");

module.exports = class FacebookClient {
  constructor() {
    this.baseUrl = "https://nominatim.openstreetmap.org";
    this.graphVersion = graphVersion;
  }

  freeFormSearch(q) {
    const that = this;
    const options = {
      method: "GET",
      url: `${that.baseUrl}/search/${q}`,
      qs: {
        format: "geocodejson",
        namedetails: 1,
        countrycodes: "GR"
      },
      headers: {
        "Content-Type": "application/json"
      },
      json: true
    };

    return that.makeAPIRequest(options).catch(error => {
      throw error;
    });
  }

  makeAPIRequest(options) {
    return new Promise((resolve, reject) => {
      request(options, (error, response, body) => {
        if (error) return reject(error); // This might be an exception

        if ("error" in body) return reject(body.error);

        return resolve(body);
      });
    });
  }
};