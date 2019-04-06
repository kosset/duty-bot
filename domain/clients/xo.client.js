const request = require("request");
const geolib = require("geolib");

module.exports = class XOClient {

  constructor() {
    this.domainURL = "https://www.xo.gr/maps/api/el/maps";
  }

  getNearestPharmacies(lat, long, numOfResults = 10) {
    const that = this;

    return that.getAllPharmacies().then(response => {
      const pharmacies = response.Pharmacies;
      let i, onlyCoords = [];
      const iMax = pharmacies.length;
      if (iMax > 0) {
        for(i=0; i < iMax; i++) {
          onlyCoords[i] = {
            latitude: pharmacies[i].Geometry.WGS_F,
            longitude: pharmacies[i].Geometry.WGS_L
          }
        }

        const ordered = geolib.orderByDistance({
          latitude: lat,
          longitude: long
        }, onlyCoords);

        let j, results = [];
        for (j = 0; j < numOfResults; j++) {
          pharmacies[ordered[j].key].Distance = ordered[j].distance;
          results[j] = pharmacies[ordered[j].key];
        }

        return results;
      } else {
        return pharmacies;
      }
    }).catch(e => {
      throw e;
    });

  }

  getAllPharmacies() {
    const that = this;

    const options = {
      method: "GET",
      url: `${that.domainURL}/pharmacies`,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        'Accept': 'application/json'
      },
      json: true
    };

    return this.makeAPIRequest(options).catch(error => {
      throw error;
    });
  }

  makeAPIRequest(options) {
    return new Promise((resolve, reject) => {
      request(options, function(error, response, body) {
        if (typeof body === "string") body = JSON.parse(body.trim());

        if (error) return reject(error); // This might be an exception

        if (response.statusCode > 399) return reject(body);

        return resolve(body);
      });
    });
  }

};