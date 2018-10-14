module.exports = {

  asyncForEach: async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  },

  timeout: ms => new Promise(res => setTimeout(res, ms)),


};