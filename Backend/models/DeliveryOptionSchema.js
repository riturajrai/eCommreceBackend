const mongoose = require('mongoose');

const deliveryOptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
});

module.exports = mongoose.model('DeliveryOption', deliveryOptionSchema);