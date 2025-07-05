const Image = require('../models/ImageSchema');

const uploadImage = async (req, res) => {
  try {
    const { data, contentType } = req.body;

    if (!data || !contentType) {
      return res.status(400).json({ message: 'Please provide image data and content type' });
    }
    if (typeof data !== 'string' || !data.startsWith('data:image/')) {
      return res.status(400).json({ message: 'Image data must be a valid base64 string' });
    }
    if (!contentType.startsWith('image/')) {
      return res.status(400).json({ message: 'Invalid content type. Must be an image type (e.g., image/jpeg)' });
    }

    const newImage = new Image({
      data,
      contentType,
    });

    const savedImage = await newImage.save();
    res.status(201).json({ message: 'Image uploaded successfully', imageId: savedImage._id });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

module.exports = { uploadImage };