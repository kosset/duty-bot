const request = require("request");
const geolib = require("geolib");
const logger = require("../../loggers").appLogger;

module.exports = class XOClient {

  constructor() {
    this.domainURL = "https://www.xo.gr/maps/api/el/maps";
    this.updatePharmacies().catch(function(reason) {
      throw reason;
    });
  }

  async getNearestPharmacies(lat, long, numOfResults = 10) {
    const that = this;

    try {
      // Check when was last updated. If it's been more than one hour update them.
      await that.updatePharmacies();

      let i, onlyCoords = [], inWorkingHours, Start1, End1, Start2, End2;
      const iMax = that.allPharmacies.length, now = new Date();
      if (iMax > 0) {
        for(i=0; i < iMax; i++) {
          Start1 = new Date(that.allPharmacies[i].Attributes.Start1);
          End1 = new Date(that.allPharmacies[i].Attributes.End1);
          Start2 = new Date(that.allPharmacies[i].Attributes.Start2);
          End2 = new Date(that.allPharmacies[i].Attributes.End2);
          inWorkingHours =
            (Start1 <= now && now < End1) ||
            (Start2 <= now && now < End2);
          if (inWorkingHours) {
            onlyCoords[i] = {
              latitude: that.allPharmacies[i].Geometry.WGS_F,
              longitude: that.allPharmacies[i].Geometry.WGS_L
            }
          }
        }

        const ordered = geolib.orderByDistance({
          latitude: lat,
          longitude: long
        }, onlyCoords);

        let j, results = [];
        if (ordered.length < numOfResults) numOfResults = ordered.length;
        for (j = 0; j < numOfResults; j++) {
          results[j] = that.allPharmacies[ordered[j].key];
          results[j].Distance = ordered[j].distance;
        }
        return results;

      } else {
        return that.allPharmacies;
      }
    } catch(e) {
      throw e;
    }

  }

  async updatePharmacies() {
    const that = this;
    const now = new Date(Date.now());
    const shouldUpdate =
      !that.updatedAt || // Has never been updated
      (that.updatedAt.getHours() !== now.getHours()) || // Has not been updated more than a hour
      (that.updatedAt.getDate() !== now.getDate()) || // Has not been updated more than a day
      (that.updatedAt.getMonth() !== now.getMonth()); // Has not been updated more than a month

    if (shouldUpdate) {
      try {
        logger.debug("Updating the list of pharmacies...");
        const response = await that.getAllPharmacies();
        that.allPharmacies = response.Pharmacies;
        that.updatedAt = now;
        logger.verbose("List of pharmacies has been updated.");
      } catch (e) {
        throw e;
      }
    }
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