const XOClient = require("./clients/xo.client");

const xo = new XOClient();

module.exports = {
  actions: {
    exampleAction: async function (userData, botResponses) {
      // Do something asynchronously (for consistency)
    },
    showVerticalListOfNearestPharmacies: async function(userData, botResponses) {

      const pharmacies = await xo.getNearestPharmacies(userData.domainData.locationInCoordinates.latitude, userData.domainData.locationInCoordinates.longitude);

      botResponses.push({
        "type": "text",
        "options": [
          `Τα κοντινότερα φαρμακεία είναι: \n1. ${pharmacies[0].Attributes.Address}(${pharmacies[0].Distance} μέτρα), \n2. ${pharmacies[1].Attributes.Address}(${pharmacies[1].Distance} μέτρα), \n3. ${pharmacies[2].Attributes.Address}(${pharmacies[2].Distance} μέτρα)`
        ]
      });
    }
  },
};