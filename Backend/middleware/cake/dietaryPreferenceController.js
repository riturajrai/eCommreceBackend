const DietaryPreference = require('../models/DietaryPreferenceSchema');
const mongoose = require('mongoose');

const dietaryPreferencePost = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Dietary preference name is required' });
    }

    const newDietaryPreference = new DietaryPreference({ name: name.trim() });
    const savedDietaryPreference = await newDietaryPreference.save();

    res.status(201).json({ message: 'Dietary preference created successfully', data: savedDietaryPreference });
  } catch (error) {
    console.error('Error creating dietary preference:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Dietary preference name already exists' });
    }
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

const getAllDietaryPreferences = async (req, res) => {
  try {
    const dietaryPreferences = await DietaryPreference.find();
    res.status(200).json({ message: 'Dietary preferences fetched successfully', data: dietaryPreferences });
  } catch (error) {
    console.error('Error fetching dietary preferences:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

const deleteDietaryPreference = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid dietary preference ID format' });
    }
    const deletedDietaryPreference = await DietaryPreference.findByIdAndDelete(id);

    if (!deletedDietaryPreference) {
      return res.status(404).json({ message: 'Dietary preference not found' });
    }

    res.status(200).json({ message: 'Dietary preference deleted successfully' });
  } catch (error) {
    console.error('Error deleting dietary preference:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

module.exports = { dietaryPreferencePost, getAllDietaryPreferences, deleteDietaryPreference };