const mongoose = require('mongoose');
const SpongeType = require('../models/SpongeTypeSchema');
const Shape = require('../models/ShapeSchema');

// Default seed data
const defaultSpongeTypes = [
  { name: 'Vanilla', description: 'Classic vanilla sponge' },
  { name: 'Chocolate', description: 'Rich chocolate sponge' },
  { name: 'Red Velvet', description: 'Soft red velvet sponge' },
  { name: 'Black Forest', description: 'Black forest sponge' },
  { name: 'Butterscotch', description: 'Buttery sponge with caramel flavor' },
];

const defaultShapes = [
  { name: 'Round', description: 'Traditional round shape' },
  { name: 'Square', description: 'Square shape' },
  { name: 'Heart', description: 'Heart shape for special occasions' },
  { name: 'Rectangle', description: 'Rectangle shape cake' },
  { name: 'Oval', description: 'Oval shape cake' },
];

// GET All Sponge Types (with auto insert if empty)
const getAllSpongeTypes = async (req, res) => {
  try {
    let spongeTypes = await SpongeType.find();

    if (spongeTypes.length === 0) {
      await SpongeType.insertMany(defaultSpongeTypes);
      spongeTypes = await SpongeType.find();
    }

    return res.status(200).json({ message: 'Sponge types fetched successfully', data: spongeTypes });
  } catch (error) {
    console.error('Error fetching sponge types:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// GET All Shapes (with auto insert if empty)
const getAllShapes = async (req, res) => {
  try {
    let shapes = await Shape.find();

    if (shapes.length === 0) {
      await Shape.insertMany(defaultShapes);
      shapes = await Shape.find();
    }

    return res.status(200).json({ message: 'Shapes fetched successfully', data: shapes });
  } catch (error) {
    console.error('Error fetching shapes:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// CREATE SpongeType
const createSpongeType = async (req, res) => {
  try {
    const { name, description } = req.body;
    const sponge = await SpongeType.create({ name, description });
    res.status(201).json({ message: "Sponge type created", data: sponge });
  } catch (err) {
    res.status(400).json({ message: "Error", error: err.message });
  }
};

// ✅ CREATE Shape
const createShape = async (req, res) => {
  try {
    const { name, description } = req.body;
    const shape = await Shape.create({ name, description });
    res.status(201).json({ message: "Shape created", data: shape });
  } catch (err) {
    res.status(400).json({ message: "Error", error: err.message });
  }
};

module.exports = {
  getAllSpongeTypes,
  getAllShapes,
  createSpongeType,
  createShape,
};
