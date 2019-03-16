module.exports = class BaseNLP {

  constructor(pathOfNodes) {
    //Load Nodes
    this.nodes = require(pathOfNodes);
    this.nodesGroupedByIntentName = this.groupNodesByIntentName(); // Map
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
        obj[intentName].push(that.nodes[nodeID]);
      }
    }

    return obj;
  }

  async detectIntent(input, userData) {
     throw new Error(`The used NLProcessor does not have implemented the 'detectIntent' method`);
  }

  async process(input, userData) {
    const that = this;

    let triggeredIntentName, matchedNode;

    //Detect Intent
    try {
      triggeredIntentName = await that.detectIntent(input, userData);
      if (triggeredIntentName) triggeredIntentName = 'Default Fallback';
    } catch (e) {
      throw e;
    }

    // Find the best matching Node
    matchedNode = that.findBestNode(triggeredIntentName, userData);

    //TODO: Invoke Actions

    // Return BotResponses
    return matchedNode.responses;

  }

  findBestNode(triggeredIntentName, userData) {

    const userActiveContexts  = userData.getActiveContexts();
    let bestNode, bestScore = 0;

    // Check Preconditions of Nodes
    const groupedNodes = this.nodesGroupedByIntentName[triggeredIntentName];
    for (let possibleNode of groupedNodes) {

      // inter will store the intersection of the input contexts array and the currently active contexts.
      // This is used as a score to determine which node is more relevant. Other implementations may choose
      // a different method for scoring.
      let inter = [];

      if (possibleNode.preConditions && possibleNode.preConditions.length > 0) {

        // Pre-Conditions must be a subset of User's Active Contexts
        const preCondIsSubset = possibleNode.preConditions.every(val => userActiveContexts.includes(val));
        if (!preCondIsSubset) continue;

        inter = possibleNode.preConditions.filter((n) => {
          return userActiveContexts.contains(n);
        });

      }

      if (!bestNode || inter.length > bestScore) {
        bestNode = possibleNode;
        bestScore = inter.length;
      }

    }

    return bestNode;
  }
};