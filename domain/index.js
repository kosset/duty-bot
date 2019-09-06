const logger = require("../loggers").appLogger;
const PharmacyModel = require("./models/pharmacy.model");
const Nominatim = require("./clients/nominatim.client");
const config = require("config");
const moment = require("moment-timezone");
const { formatDate } = require("../utils/misc");
moment.tz.setDefault("Europe/Athens");

module.exports = {
  actions: {
    exampleAction: async function (userData, botResponses) {
      // Do something asynchronously (for consistency)
    },
    showVerticalListOfNearestPharmacies: async function(userData, botResponses) {

      let pharmacies = [];
      try {
        const now = moment();
        logger.debug(`Looking for pharmacies at ${now.format("LLLL")}`);
        pharmacies = await PharmacyModel.findNearestOpenPharmacies(
          userData.domainData.locationInCoordinates.latitude,
          userData.domainData.locationInCoordinates.longitude,
          now.toDate(),
          6);
      } catch(e) {
        throw e;
      }

      if (pharmacies && pharmacies.length) {
        logger.debug(`Found ${pharmacies.length} open pharmacies.`);
        moment.locale("el");

        botResponses.push({
          type: 'text',
          options: [
            `Τα ${pharmacies.length} κοντινότερα εφημερεύοντα φαρμακεία είναι:`
          ]
        });

        let warning = ``;

        botResponses.push({
          type: "cardslist",
          representation: "horizontal",
          cards: pharmacies.map((pharmacy) => {
            if (pharmacy.distance > 10000) warning = `⚠`;
            else warning = ``;
            return {
              type: "card",
              title: pharmacy.address,
              subtitle: `${pharmacy.name.substring(0,40)}\nΑπόσταση: ${Math.round(pharmacy.distance)}μ. ${warning}\n${moment(pharmacy.createdAt).format("l")} ${pharmacy.workingHours}`,
              buttons: [{
                type: 'url',
                title: "📍 Οδηγίες Χάρτη",
                payload: `https://www.google.com/maps/dir/${userData.domainData.locationInCoordinates.latitude},${userData.domainData.locationInCoordinates.longitude}/${pharmacy.location.coordinates[1]},${pharmacy.location.coordinates[0]}`
              },{
                type: 'phone',
                title: `📞 ${pharmacy.phone}`,
                payload: `+30${pharmacy.phone}`
              }]
            }
          })
        });
      } else {

        botResponses.push({
          type: 'text',
          options: [
            "Δυστυχώς δεν βρέθηκαν αποτελέσματα :(",
            "Κάτι πήγε στραβά και δεν βρέθηκαν αποτελέσματα :("
          ]
        });
      }

    },
    searchGeolocation: async function(userData, botResponses) {

      try {
        const geolocation = new Nominatim(config.get('baseUrl'));
        const results = await geolocation.freeFormSearch(userData.lastMessage);

        userData.domainData.locationInCoordinates = {
          latitude: results.features[0].geometry.coordinates[1],
          longitude: results.features[0].geometry.coordinates[0]
        };
        userData.markModified('domainData');
      } catch (e) {
        logger.error(`Could not find geolocation results`)
      }
    }
  },
};