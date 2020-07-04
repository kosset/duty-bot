const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    psid: { type: String, required: true, index: true }, // Platform Scoped ID
    name: {
      first: String,
      last: String
    },
    picture: String,
    lastMessage: String,
    channel: { type: String, enum: ['facebook', 'viber'] },
    domainData: { type: Schema.Types.Mixed, default: {} }, // Data stored from parameters
    contexts: [{
      name: String,
      lifespan: Number,
      activeUntil: {type: Date, default: new Date(Date.now() + 24*60*60*1000)}
    }], // Preconditions for Nodes
    fetchedAt: Date
  },
  {
    timestamps: {
      createdAt: "firstInteractionAt",
      updatedAt: "lastInteractionAt"
    },
    minimize: false
  }
);

// New property for user
userSchema
  .virtual("name.full")
  .get(function() {
      return this.name.first + " " + this.name.last;
  })
  .set(function(v) {
    this.name.first = v.substr(0, v.indexOf(" "));
    this.name.last = v.substr(v.indexOf(" ") + 1);
  });

userSchema.methods.getActiveContexts = function() {
  let activeContexts = [];

  for (let context of this.contexts)  {
    if (context.activeUntil > Date.now()) {
      activeContexts.push(context.name);
    }
  }
  return activeContexts;
};

userSchema.methods.setActiveContexts = function(newContexts) {
  let contextsReadyToBeStored = [], contextsToBeRemoved = [];

  // Decrease the lifespan of the old Contexts
  for (let context of this.contexts) {
    context.lifespan--;
    if (context.lifespan > 0) contextsReadyToBeStored.push(context);
  }

  // Store new incoming contexts or update old ones
  const nCNs = Object.keys(newContexts);
  for (let newContextName of nCNs) {
    if (newContexts[newContextName] > 0) {
      const contextIndex = contextsReadyToBeStored.findIndex(c => c.name === newContextName);
      if (contextIndex > -1) {
        contextsReadyToBeStored[contextIndex].lifespan = newContexts[newContextName]; // If exists update the lifespan
      } else {
        contextsReadyToBeStored.push({
          name: newContextName,
          lifespan: newContexts[newContextName]
        });
      }
    } else if (newContexts[newContextName] === 0) {
      contextsToBeRemoved.push(newContextName);
    }
  }

  // Remove new Contexts with LifeSpan 0
  contextsReadyToBeStored = contextsReadyToBeStored.filter(c => !contextsToBeRemoved.includes(c.name));

  this.contexts = contextsReadyToBeStored;
};

// Statics
// Do not declare statics using ES6 arrow functions (=>).
// Arrow functions explicitly prevent binding this,
// so the above examples will not work because of the value of this.
userSchema.statics.findByPSID = function (psid) {
  return this.findOne({ psid: psid }).exec();
};

// Create the model
const UserModel = mongoose.model("User", userSchema);

// Make it available
module.exports = UserModel;
