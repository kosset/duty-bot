const logger = require("../../loggers").appLogger;
const misc = require("../../utils/misc");

module.exports = class BaseNLP {

  constructor(nodes, actions) {
    //Load Nodes
    this.nodes = nodes;
    this.nodesGroupedByIntentName = this.groupNodesByIntentName(); // Map
    // logger.debug(JSON.stringify(this.nodesGroupedByIntentName));
    this.actions = actions;
  }

  groupNodesByIntentName() {
    const that = this;
    const nodeIDs = Object.keys(that.nodes);

    let obj = {};
    let intents; // List of intentNames

    for (let nodeID of nodeIDs) {
      intents = that.nodes[nodeID]['intents'];
      for (let intentName of intents) {
        if (!(intentName in obj)) obj[intentName] = [];
        obj[intentName].push({...that.nodes[nodeID], key: nodeID});
      }
    }

    return obj;
  }

  async detectIntent(input, userData) {
     throw new Error(`The used NLProcessor does not have implemented the 'detectIntent' method`);
  }

  retrieveParameters(userDomainData) {
    throw new Error(`The used NLProcessor does not have implemented the 'retrieveParameters' method`);
  }

  async process(input, userData) {
    const that = this;

    let triggeredIntentName, matchedNode;

    //Detect Intent
    try {
      triggeredIntentName = await that.detectIntent(input, userData);
      if (!triggeredIntentName) triggeredIntentName = 'Default Fallback';
      logger.debug(`Intent with name '${triggeredIntentName}' was triggered`);
    } catch (e) {
      throw e;
    }

    // Find the best matching Node
    matchedNode = that.findBestNode(triggeredIntentName, userData);
    logger.debug(`Matched Node (score: ${matchedNode.score}): '${matchedNode.key}'`);

    // Set the active contexts
    if (matchedNode.postConditions) userData.setActiveContexts(matchedNode.postConditions);

    // Load parameters inside user.domainData
    if (matchedNode.storeParameters) that.retrieveParameters(userData.domainData);

    // Invoke Actions
    try {
      await that.callActions(matchedNode, userData);
    } catch (e) {
      logger.error(`Actions failed: ${e}`);
    }

    // Return BotResponses
    return matchedNode.responses;
  }

  findBestNode(triggeredIntentName, userData) {

    const userActiveContexts  = userData.getActiveContexts();
    let bestNode, bestScore = 0;

    // Check Preconditions of Nodes
    let groupedNodes = this.nodesGroupedByIntentName[triggeredIntentName];
    if (!groupedNodes) groupedNodes = this.nodesGroupedByIntentName['Default Fallback'];
    for (let [possibleNodeKey, possibleNodeData] of groupedNodes.entries()) {

      // inter will store the intersection of the input contexts array and the currently active contexts.
      // This is used as a score to determine which node is more relevant. Other implementations may choose
      // a different method for scoring.
      let inter = [];

      if (possibleNodeData.preConditions && possibleNodeData.preConditions.length > 0) {

        // Pre-Conditions must be a subset of User's Active Contexts
        const preCondIsSubset = possibleNodeData.preConditions.every(val => userActiveContexts.includes(val));
        if (!preCondIsSubset) continue;

        inter = possibleNodeData.preConditions.filter((n) => {
          return userActiveContexts.includes(n);
        });

      }

      if (!bestNode || inter.length > bestScore) {
        bestScore = inter.length;
        bestNode = {
          ...possibleNodeData,
          score: bestScore
        };
      }

    }

    return bestNode;
  }

  async callActions(matchedNode, userData) {
    const that = this;
    if ("actions" in matchedNode) {
      try {
        await misc.asyncForEach(matchedNode.actions, async action => {
          if (typeof that.actions[action] === "function") {
            await that.actions[action](userData, matchedNode.responses);
          }
        }); //TODO: Let mongoose know that something updated
      } catch (e) {
        throw e;
      }
    }
  }
};