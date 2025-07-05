const mongoose = require('mongoose');

const flavorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    maxlength: 50,
  },
}, { timestamps: true });

module.exports = mongoose.model('Flavor', flavorSchema);