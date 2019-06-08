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
    type: {
      type: String,
      enum: ['url', 'postback', 'phone'],
      default: 'postback',
      lowercase: true
    },
    title: String,
    payload: String
  }]
}, { _id: false });

const cardsListResponseSchema = new Schema({
  representation: {
    type: String,
    enum: ['horizontal', 'vertical'],
    required: true,
    lowercase: true
  },
  cards: [cardResponseSchema]
}, { _id: false });

const locationResponseSchema = new Schema({
  questions: {
    type: [String],
    required: true
  }
}, { _id: false });

const shareCardResponseSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  imageUrl: String,
  subtitle: String,
  shared: {
    type: {
      title: {
        type: String,
        required: true
      },
      imageUrl: String,
      subtitle: String,
      button: {
        title: String
      }
    },
    required: true
  },
  botId: String,
  invitedBy: String
}, { _id: false });


// `nodeSchema.path('responses')` gets the mongoose `DocumentArray`
let responsesList = nodeSchema.path('responses');

responsesList.discriminator("text", textResponseSchema);

responsesList.discriminator("quickreplies", quickRepliesResponseSchema);

responsesList.discriminator("cards", cardResponseSchema);

responsesList.discriminator("cardslist", cardsListResponseSchema);

responsesList.discriminator("location", locationResponseSchema);

responsesList.discriminator("sharecard", shareCardResponseSchema);

// Create the model
const NodeModel = mongoose.model("Node", nodeSchema);

// Make it available
module.exports = NodeModel;