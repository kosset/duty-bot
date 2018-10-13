const request = require('request');

module.exports = class GenderizeClient {

  constructor() {}

  getGenderByName(name) {

    const options = {
      method: "GET",
      url: `https://api.genderize.io/`,
      qs: {
        name: name
      },
      headers: {
        "Content-Type": "application/json"
      },
      json: true
    };

    return this.makeAPIRequest(options).catch(error => {
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
}