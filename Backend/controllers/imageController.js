const Image = require('../models/ImageSchema');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const upload = require('../middleware/upload');
const mongoose = require('mongoose');

const uploadImage = async (req, res) => {
  try {
    if (!req.file && !req.body.imageUrl) {
      return res.status(400).json({ message: 'Provide an image file or URL' });
    }
    let imageData;

    if (req.file) {
      imageData = {
        data: req.file.buffer,
        filename: `${uuidv4()}-${req.file.originalname}`,
        mimeType: req.file.mimetype,
        size: req.file.size,
      };
    } else {
      const { imageUrl } = req.body;
      if (!imageUrl.match(/\.(jpeg|jpg|png|gif)$/i)) {
        return res.status(400).json({ message: 'Invalid image URL format' });
      }

      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const mimeType = response.headers['content-type'];
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(mimeType)) {
        return res.status(400).json({ message: 'URL must point to a JPEG, PNG, or GIF image' });
      }

      imageData = {
        data: Buffer.from(response.data),
        filename: imageUrl.split('/').pop() || `url-image-${uuidv4()}`,
        mimeType,
        size: response.data.length,
      };
    }

    const newImage = new Image(imageData);
    const savedImage = await newImage.save();

    res.status(201).json({ message: 'Image uploaded successfully', data: { _id: savedImage._id, filename: savedImage.filename, mimeType: savedImage.mimeType, size: savedImage.size } });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

const getImage = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid image ID format' });
    }

    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    res.set('Content-Type', image.mimeType);
    res.send(image.data);
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

module.exports = { uploadImage, getImage };