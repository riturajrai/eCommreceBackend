const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
  data: {
    type: Buffer,
    required: [true, 'Image data is required'],
  },
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    trim: true,
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required'],
    enum: ['image/jpeg', 'image/png', 'image/gif'], 
  },
  size: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'Size must be non-negative'],
  },
}, { timestamps: true });

module.exports = mongoose.model('Image', ImageSchema);