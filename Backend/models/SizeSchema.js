const mongoose = require('mongoose');

const sizeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    maxlength: 20, // e.g., "1kg", "0.5kg"
    match: [/^[\d\.]+kg$|^Custom$/, 'Size must be in the format "Xkg" or "Custom"'], // Validates format like "1kg", "0.5kg", or "Custom"
  },
}, { timestamps: true });

sizeSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Size', sizeSchema);