// models/CartSchema.js
const mongoose = require('mongoose');

const customizationSchema = new mongoose.Schema({
  spongeType: { type: mongoose.Schema.Types.ObjectId, ref: 'SpongeType', required: true },
  shape: { type: mongoose.Schema.Types.ObjectId, ref: 'Shape', required: true },
  size: { type: mongoose.Schema.Types.ObjectId, ref: 'Size', required: true },
  flavor: { type: mongoose.Schema.Types.ObjectId, ref: 'Flavor', required: true },
  inscription: { type: String, default: '' },
});

const cartItemSchema = new mongoose.Schema({
  cake: { type: mongoose.Schema.Types.ObjectId, ref: 'Cake', required: true },
  quantity: { type: Number, required: true, min: 1 },
  customization: customizationSchema,
});
const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  items: [cartItemSchema],
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);