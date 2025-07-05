const Flavor = require('../models/FlavorSchema');
const mongoose = require('mongoose');

const flavorPost = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Flavor name is required' });
    }

    const newFlavor = new Flavor({ name: name.trim() });
    const savedFlavor = await newFlavor.save();

    res.status(201).json({ message: 'Flavor created successfully', data: savedFlavor });
  } catch (error) {
    console.error('Error creating flavor:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Flavor name already exists' });
    }
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

const getAllFlavors = async (req, res) => {
  try {
    const flavors = await Flavor.find();
    res.status(200).json({ message: 'Flavors fetched successfully', data: flavors });
  } catch (error) {
    console.error('Error fetching flavors:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

const deleteFlavor = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid flavor ID format' });
    }
    const deletedFlavor = await Flavor.findByIdAndDelete(id);

    if (!deletedFlavor) {
      return res.status(404).json({ message: 'Flavor not found' });
    }
    res.status(200).json({ message: 'Flavor deleted successfully' });
  } catch (error) {
    console.error('Error deleting flavor:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

module.exports = { flavorPost, getAllFlavors, deleteFlavor};
