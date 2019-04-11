const request = require("request");
const CronJob = require('cron').CronJob;
const logger = require("../../loggers").appLogger,
  PharmacyModel = require("../models/pharmacy.model");

module.exports = class XOClient {

  constructor() {
    this.domainURL = "https://www.xo.gr/maps/api/el/maps";
    const that = this;
    new CronJob('0 0 3 * * *', function() {
      return that.updatePharmacies().catch(e => {
        throw e;
      });
    }, null, true, 'Europe/Athens', null, true);
  }

  async getNearestPharmacies(lat, long, numOfResults = 10) {
    const that = this;

    try {
      // Check when was last updated. If it's been more than one hour update them.
      await that.updatePharmacies(); //TODO: Cron timer for updating

      const now = new Date();
      logger.debug(`Looking for pharmacies at ${now.toISOString()}`);
      return await PharmacyModel.findNearestOpenPharmacies(lat, long, now, numOfResults);
    } catch(e) {
      throw e;
    }

  }

  async updatePharmacies() {
    const that = this;

    let today = new Date();
    today = new Date(today.getFullYear(), today.getMonth(), today.getUTCDate() );

    const pharmaciesHaveBeenUpdated = await PharmacyModel.pharmaciesForDateExist(today);
    const shouldUpdate = !pharmaciesHaveBeenUpdated;
    if (shouldUpdate) {
      try {
        logger.debug("Updating the list of pharmacies...");
        const response = await that.getAllPharmacies();
        const numOfPharmacies = 'Pharmacies' in response ? response.Pharmacies.length : 0;
        let i, pharmacy;
        for (i = 0; i < numOfPharmacies; i++) {
          pharmacy = new PharmacyModel({
            name: response.Pharmacies[i].Attributes.Name,
            nameLatin: response.Pharmacies[i].Attributes.NameUrl,
            address: response.Pharmacies[i].Attributes.Address,
            phone: response.Pharmacies[i].Attributes.Tel,
            createdAt: new Date(response.Pharmacies[i].Attributes.Date),
            workingHours: response.Pharmacies[i].Attributes.Cure,
            startAt1: new Date(response.Pharmacies[i].Attributes.Start1),
            endAt1: new Date(response.Pharmacies[i].Attributes.End1),
            startAt2: new Date(response.Pharmacies[i].Attributes.Start2),
            endAt2: new Date(response.Pharmacies[i].Attributes.End2),
            location: {
              type: 'Point',
              coordinates: [
                response.Pharmacies[i].Geometry.WGS_L, // Longitude
                response.Pharmacies[i].Geometry.WGS_F // Latitude
              ]
            }
          });
          await pharmacy.save();
        }
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

        if (error) return reject(error); // This might be an exception

        if (response.statusCode > 399) return reject(body);

        if (typeof body === "string") body = JSON.parse(body.trim());
        return resolve(body);
      });
    });
  }

};