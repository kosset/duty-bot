const request = require("request");

module.exports = class NominatimClient {
  constructor(baseUrl) {
    this.openStreetMapUrl = "https://nominatim.openstreetmap.org";
    this.baseUrl = baseUrl;
  }

  freeFormSearch(q) {
    const that = this;
    const options = {
      method: "GET",
      url: `${that.openStreetMapUrl}/search/${encodeURIComponent(q)}`,
      qs: {
        format: "geocodejson",
        namedetails: 1,
        countrycodes: "GR"
      },
      headers: {
        "Content-Type": "application/json",
        "Referer": that.baseUrl
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

        if (response.statusCode > 299) return reject(body);

        return resolve(body);
      });
    });
  }
};