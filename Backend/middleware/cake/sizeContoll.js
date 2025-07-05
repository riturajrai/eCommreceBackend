const Size = require('../models/SizeSchema');
const mongoose = require('mongoose');

const sizePost = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Size name is required' });
    }

    const newSize = new Size({ name: name.trim() });
    const savedSize = await newSize.save();

    res.status(201).json({ message: 'Size created successfully', data: savedSize });
  } catch (error) {
    console.error('Error creating size:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Size name already exists' });
    }
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

const getAllSizes = async (req, res) => {
  try {
    const sizes = await Size.find();
    res.status(200).json({ message: 'Sizes fetched successfully', data: sizes });
  } catch (error) {
    console.error('Error fetching sizes:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

const deleteSize = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid size ID format' });
    }
    const deletedSize = await Size.findByIdAndDelete(id);

    if (!deletedSize) {
      return res.status(404).json({ message: 'Size not found' });
    }

    res.status(200).json({ message: 'Size deleted successfully' });
  } catch (error) {
    console.error('Error deleting size:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

module.exports = { sizePost, getAllSizes, deleteSize };