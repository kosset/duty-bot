const XOClient = require("./clients/xo.client");

const xo = new XOClient();

module.exports = {
  actions: {
    exampleAction: async function (userData, botResponses) {
      // Do something asynchronously (for consistency)
    },
    showVerticalListOfNearestPharmacies: async function(userData, botResponses) {

      const pharmacies = await xo.getNearestPharmacies(
        userData.domainData.locationInCoordinates.latitude,
        userData.domainData.locationInCoordinates.longitude,
        10
      );

      if (pharmacies && pharmacies.length) {
        botResponses.push({
          type: 'text',
          options: [
            `Τα ${pharmacies.length} κοντινότερα φαρμακεία είναι:`
          ]
        });

        botResponses.push({
          type: "cardslist",
          representation: "horizontal",
          cards: pharmacies.map((pharmacy) => {
            return {
              type: "card",
              title: pharmacy.Attributes.Name,
              subtitle: `${pharmacy.Attributes.Address}\nΑπόσταση: ${pharmacy.Distance}μ.\n${pharmacy.Attributes.Cure}`,
              buttons: [{
                type: 'url',
                title: "📍 Google Maps",
                payload: `https://maps.google.com/?ll=${pharmacy.Geometry.WGS_F},${pharmacy.Geometry.WGS_L}`
              },{
                type: 'phone',
                title: `☎ ${pharmacy.Attributes.Tel}`,
                payload: `+30${pharmacy.Attributes.Tel}`
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

    }
  },
};