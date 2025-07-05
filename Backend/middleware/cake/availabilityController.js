const Availability = require('../models/AvailabilitySchema');
const mongoose = require('mongoose');

const availabilityPost = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Availability name is required' });
    }
    const newAvailability = new Availability({ name: name.trim() });
    const savedAvailability = await newAvailability.save();

    res.status(201).json({ message: 'Availability created successfully', data: savedAvailability });
  } catch (error) {
    console.error('Error creating availability:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Availability name already exists' });
    }
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

const getAllAvailabilities = async (req, res) => {
  try {
    const availabilities = await Availability.find();
    res.status(200).json({ message: 'Availabilities fetched successfully', data: availabilities });
  } catch (error) {
    console.error('Error fetching availabilities:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

const updateAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid availability ID format' });
    }
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Availability name is required' });
    }

    const updatedAvailability = await Availability.findByIdAndUpdate(
      id, { name: name.trim() },
      { new: true, runValidators: true }
    );

    if (!updatedAvailability) {
      return res.status(404).json({ message: 'Availability not found' });
    }

    res.status(200).json({ message: 'Availability updated successfully', data: updatedAvailability });
  } catch (error) {
    console.error('Error updating availability:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Availability name already exists' });
    }
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

const deleteAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid availability ID format' });
    }
    const deletedAvailability = await Availability.findByIdAndDelete(id);

    if (!deletedAvailability) {
      return res.status(404).json({ message: 'Availability not found' });
    }

    res.status(200).json({ message: 'Availability deleted successfully' });
  } catch (error) {
    console.error('Error deleting availability:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

module.exports = { availabilityPost, getAllAvailabilities, updateAvailability, deleteAvailability };