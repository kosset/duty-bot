module.exports = {

  contexts: {
    requiredData: function(data) {
      let contexts = [];

      if (!('gender' in data)) {
        contexts.push("GENDER");
      }

      if (!('weight' in data)) {
        contexts.push("WEIGHT");
      }

      if (!('height' in data)) {
        contexts.push("HEIGHT");
      }

      if (!('age' in data)) {
        contexts.push("AGE");
      }

      return contexts;
    },
  },

  actions: {
    exampleAction: async function (userData) {
      // Do something asynchronously (for consistency)
    },
  },
};