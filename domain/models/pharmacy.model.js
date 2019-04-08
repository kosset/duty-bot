const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pharmacySchema = new Schema(
  {
    name: String,
    nameLatin: String,
    address: String,
    phone: String,
    createdAt: Date,
    workingHours: String,
    startAt1: Date,
    endAt1: Date,
    startAt2: Date,
    endAt2: Date,
    location: {
      type: {
        type: String, // Don't do `{ location: { type: String } }`
        enum: ['Point'], // 'location.type' must be 'Point'
        required: true,
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      }
    }
  },
  {
    minimize: false
  }
);

pharmacySchema.index({createdAt: 1},{expireAfterSeconds: 259200}); // Expires after 3 days
pharmacySchema.index({ location: "2dsphere" });

pharmacySchema.statics.findOpenPharmacies = function(date) {
  return this.find({
    $or: [
      { $and: [{startAt1: {$lte: date}}, {endAt1: {$gt: date}}] },
      { $and: [{startAt2: {$lte: date}}, {endAt2: {$gt: date}}] }
    ]
  }).exec();
};

pharmacySchema.statics.findNearestOpenPharmacies = function(lat, long, date, limit) {
  return this.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [long, lat]
        },
        distanceField: "distance",
        spherical: true
      }
    },
    {
      $match: {
        $or: [
          { $and: [{startAt1: {$lte: date}}, {endAt1: {$gt: date}}] },
          { $and: [{startAt2: {$lte: date}}, {endAt2: {$gt: date}}] }
        ]
      }
    },
    { $limit : limit }
  ]).exec();
};

pharmacySchema.statics.pharmaciesForDateExist = function(date) {
  return this.findOne({createdAt: date}).exec();
};

// Create the model
const PharmacyModel = mongoose.model("Pharmacy", pharmacySchema, 'pharmacies');

// Make it available
module.exports = PharmacyModel;