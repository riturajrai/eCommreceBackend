const mongoose = require('mongoose');
const Category = require('../models/CategorySchema');

const validateCategory = async (req, res, next) => {
  try {
    const { category } = req.body;
    if (!category) {
      return res.status(400).json({ message: 'Category is required.' });
    };
    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ message: 'Invalid category ID format.' });
    };
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: 'Category does not exist.' });
    }
    next();
  } catch (error) {
    console.error('Error validating category:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  };
};
// {--------------------------- end -------------------------------}
module.exports = { validateCategory };