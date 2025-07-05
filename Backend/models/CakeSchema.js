const mongoose = require('mongoose');


const CakeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  image: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image', required: true }],
  stock: { type: Number, required: true, min: 0 },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  flavors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Flavor', required: true }],
  sizes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Size', required: true }],
  spongeType: { type: mongoose.Schema.Types.ObjectId, ref: 'SpongeType', required: true },
  shape: { type: mongoose.Schema.Types.ObjectId, ref: 'Shape', required: true },
  inscription: { type: String, default: '' },
  dietaryPreferences: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DietaryPreference' }],
  availability: { type: mongoose.Schema.Types.ObjectId, ref: 'Availability', required: true },
  deliveryOptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryOption', required: true }],
}, { timestamps: true });

module.exports = mongoose.model('Cake', CakeSchema);



