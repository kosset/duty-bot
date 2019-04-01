const logger = require("../../loggers").appLogger;
const BaseNLP = require("./base.nlp");

module.exports = class LocalNLP extends BaseNLP {

  constructor(nodes, domain) {
    super(nodes, domain);
    this.queryResult = {};
    logger.info(`New Local NLP created`);
  }

  async detectIntent(input, userData) {
    return input;
  }

};