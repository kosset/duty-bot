const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const responseSchema = new Schema({},
  { discriminatorKey: 'type', _id: false, autoIndex: false });

const nodeSchema = new Schema({
    intents: {
      type: [String],
      required: true
    },
    preConditions: [String],
    postConditions: {
      type: Map,
      of: Number
    },
    storeParameters: {type: Boolean, default: false},
    actions: [String],
    responses: [responseSchema]
  }
);

const textResponseSchema = new Schema({
  options: {
    type: [String],
    required: true
  }
}, { _id: false });

const quickRepliesResponseSchema = new Schema({
  questions: {
    type: [String],
    required: true
  },
  replies:{
    type: [String],
    required: true
  }
}, { _id: false });

const cardResponseSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  imageUrl: String,
  subtitle: String,
  buttons: [{
    type: String,
    title: String,
    payload: String
  }]
}, { _id: false });

const cardsListResponseSchema = new Schema({
  type: {
    type: String,
    enum: ['horizontal', 'vertical'],
    required: true,
    lowercase: true
  },
  cards: [cardResponseSchema]
});

const locationResponseSchema = new Schema({
  options: {
    type: [String],
    required: true
  }
}, { _id: false });

// `nodeSchema.path('responses')` gets the mongoose `DocumentArray`
let responsesList = nodeSchema.path('responses');

responsesList.discriminator("text", textResponseSchema);

responsesList.discriminator("quickreplies", quickRepliesResponseSchema);

responsesList.discriminator("cards", cardResponseSchema);

responsesList.discriminator("cardslist", cardsListResponseSchema);

responsesList.discriminator("location", locationResponseSchema);

// Create the model
const NodeModel = mongoose.model("Node", nodeSchema);

// Make it available
module.exports = NodeModel;