// models/DietaryPreferenceSchema.js
const mongoose = require('mongoose');

const dietaryPreferenceSchema = new mongoose.Schema({
  name: [{
    type: String,
    required: true,
    unique: true,
    trim: true,
  },]
});

module.exports = mongoose.model('DietaryPreference', dietaryPreferenceSchema);