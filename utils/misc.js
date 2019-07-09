module.exports = {

  asyncForEach: async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  },

  timeout: ms => new Promise(res => setTimeout(res, ms)),

  chooseRandom: myArray => myArray[Math.floor(Math.random() * myArray.length)],

  formatDate: d => ("0" + d.getDate()).slice(-2) + "/" + ("0"+(d.getMonth()+1)).slice(-2) + "/" +
    d.getFullYear(),

};