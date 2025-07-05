const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  cake: { type: mongoose.Schema.Types.ObjectId, ref: 'Cake', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  name: { type: String, required: true },
  image: { type: String }, // Not required, as it has a fallback
  customization: {
    spongeType: { type: mongoose.Schema.Types.ObjectId, ref: 'SpongeType' },
    shape: { type: mongoose.Schema.Types.ObjectId, ref: 'Shape' },
    size: { type: mongoose.Schema.Types.ObjectId, ref: 'Size' },
    flavor: { type: mongoose.Schema.Types.ObjectId, ref: 'Flavor' },
    inscription: { type: String },
  },
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  finalAmount: { type: Number, required: true },
  coupon: {
    code: { type: String },
    discountAmount: { type: Number },
  },
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);