const DeliveryOption = require('../models/DeliveryOptionSchema');
const mongoose = require('mongoose');

const deliveryOptionPost = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Delivery option name is required' });
    }

    const newDeliveryOption = new DeliveryOption({ name: name.trim() });
    const savedDeliveryOption = await newDeliveryOption.save();

    res.status(201).json({ message: 'Delivery option created successfully', data: savedDeliveryOption });
  } catch (error) {
    console.error('Error creating delivery option:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Delivery option name already exists' });
    }
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

const getAllDeliveryOptions = async (req, res) => {
  try {
    const deliveryOptions = await DeliveryOption.find();
    res.status(200).json({ message: 'Delivery options fetched successfully', data: deliveryOptions });
  } catch (error) {
    console.error('Error fetching delivery options:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

const updateDeliveryOption = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid delivery option ID format' });
    }
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Delivery option name is required' });
    }

    const updatedDeliveryOption = await DeliveryOption.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    if (!updatedDeliveryOption) {
      return res.status(404).json({ message: 'Delivery option not found' });
    }

    res.status(200).json({ message: 'Delivery option updated successfully', data: updatedDeliveryOption });
  } catch (error) {
    console.error('Error updating delivery option:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Delivery option name already exists' });
    }
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

const deleteDeliveryOption = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid delivery option ID format' });
    }
    const deletedDeliveryOption = await DeliveryOption.findByIdAndDelete(id);

    if (!deletedDeliveryOption) {
      return res.status(404).json({ message: 'Delivery option not found' });
    }

    res.status(200).json({ message: 'Delivery option deleted successfully' });
  } catch (error) {
    console.error('Error deleting delivery option:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

module.exports = { deliveryOptionPost, getAllDeliveryOptions, updateDeliveryOption, deleteDeliveryOption };