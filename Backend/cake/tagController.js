const Tag = require('../models/TagSchema');
const mongoose = require('mongoose');

const tagPost = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Tag name is required' });
    }

    const newTag = new Tag({ name: name.trim() });
    const savedTag = await newTag.save();

    res.status(201).json({ message: 'Tag created successfully', data: savedTag });
  } catch (error) {
    console.error('Error creating tag:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Tag name already exists' });
    }
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

const getAllTags = async (req, res) => {
  try {
    const tags = await Tag.find();
    res.status(200).json({ message: 'Tags fetched successfully', data: tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

const updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid tag ID format' });
    }
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Tag name is required' });
    }

    const updatedTag = await Tag.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    if (!updatedTag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    res.status(200).json({ message: 'Tag updated successfully', data: updatedTag });
  } catch (error) {
    console.error('Error updating tag:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Tag name already exists' });
    }
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid tag ID format' });
    }
    const deletedTag = await Tag.findByIdAndDelete(id);

    if (!deletedTag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    res.status(200).json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

module.exports = { tagPost, getAllTags, updateTag, deleteTag };