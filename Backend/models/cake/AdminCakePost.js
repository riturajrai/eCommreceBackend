const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Import Models
const Cake = require('../models/CakeSchema');
const Category = require('../models/CategorySchema');
const Tag = require('../models/TagSchema');
const Flavor = require('../models/FlavorSchema');
const Size = require('../models/SizeSchema');
const DietaryPreference = require('../models/DietaryPreferenceSchema');
const Availability = require('../models/AvailabilitySchema');
const DeliveryOption = require('../models/DeliveryOptionSchema');
const SpongeType = require('../models/SpongeTypeSchema');
const Shape = require('../models/ShapeSchema');
const Image = require('../models/ImageSchema');
const authMiddleware = require('../middleware/authMiddleware');

// Validation Middleware for POST and PUT
const validateCake = [
    check('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required.')
        .isLength({ max: 100 })
        .withMessage('Name must be 100 characters or less.')
        .custom(async (value, { req }) => {
            const cake = await Cake.findOne({ name: value, _id: { $ne: req.params.id || null } });
            if (cake) {
                throw new Error('Cake name already exists.');
            }
            return true;
        }),
    check('description')
        .trim()
        .notEmpty()
        .withMessage('Description is required.')
        .isLength({ max: 500 })
        .withMessage('Description must be 500 characters or less.'),
    check('price')
        .isFloat({ min: 0.01, max: 100000 })
        .withMessage('Price must be a positive number not exceeding ₹1,00,000.'),
    check('category')
        .isMongoId()
        .withMessage('Valid category ID is required.')
        .custom(async (value) => {
            const category = await Category.findById(value);
            if (!category) {
                throw new Error('Category does not exist.');
            }
            return true;
        }),
    check('imageIds')
        .isArray({ min: 1 })
        .withMessage('At least one image is required.')
        .custom((value) => {
            return value.every((id) => mongoose.isValidObjectId(id));
        })
        .withMessage('All image IDs must be valid MongoDB ObjectIds.'),
    check('stock')
        .isInt({ min: 0, max: 10000 })
        .withMessage('Stock must be a non-negative integer not exceeding 10,000.'),
    check('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array.')
        .custom(async (value) => {
            if (value.length > 0) {
                const tags = await Tag.find({ _id: { $in: value } });
                if (tags.length !== value.length) {
                    throw new Error('One or more tag IDs are invalid.');
                }
            }
            return true;
        }),
    check('flavors')
        .isArray({ min: 1 })
        .withMessage('At least one flavor is required.')
        .custom(async (value) => {
            const flavors = await Flavor.find({ _id: { $in: value } });
            if (flavors.length !== value.length) {
                throw new Error('One or more flavor IDs are invalid.');
            }
            return true;
        }),
    check('sizes')
        .isArray({ min: 1 })
        .withMessage('At least one size is required.')
        .custom(async (value) => {
            const sizes = await Size.find({ _id: { $in: value } });
            if (sizes.length !== value.length) {
                throw new Error('One or more size IDs are invalid.');
            }
            return true;
        }),
    check('spongeType')
        .isArray({ min: 1 })
        .withMessage('At least one sponge type is required.')
        .custom(async (value) => {
            const spongeTypes = await SpongeType.find({ _id: { $in: value } });
            if (spongeTypes.length !== value.length) {
                throw new Error('One or more sponge type IDs are invalid.');
            }
            return true;
        }),
    check('shape')
        .isArray({ min: 1 })
        .withMessage('At least one shape is required.')
        .custom(async (value) => {
            const shapes = await Shape.find({ _id: { $in: value } });
            if (shapes.length !== value.length) {
                throw new Error('One or more shape IDs are invalid.');
            }
            return true;
        }),
    check('dietaryPreferences')
        .optional()
        .isArray()
        .withMessage('Dietary preferences must be an array.')
        .custom(async (value) => {
            if (value.length > 0) {
                const dps = await DietaryPreference.find({ _id: { $in: value } });
                if (dps.length !== value.length) {
                    throw new Error('One or more dietary preference IDs are invalid.');
                }
            }
            return true;
        }),
    check('availability')
        .isMongoId()
        .withMessage('Valid availability ID is required.')
        .custom(async (value) => {
            const availability = await Availability.findById(value);
            if (!availability) {
                throw new Error('Availability does not exist.');
            }
            return true;
        }),
    check('deliveryOptions')
        .isArray({ min: 1 })
        .withMessage('At least one delivery option is required.')
        .custom(async (value) => {
            const options = await DeliveryOption.find({ _id: { $in: value } }); // ✅ Corrected query
            if (options.length !== value.length) {
                throw new Error('One or more delivery option IDs are invalid.');
            }
            return true;
        }),

];

// POST: Create a new cake
router.post('/admin/cakes', authMiddleware, validateCake, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const {
            name,
            description,
            price,
            category,
            imageIds,
            stock,
            tags,
            flavors,
            sizes,
            spongeType,
            shape,
            dietaryPreferences,
            availability,
            deliveryOptions,
        } = req.body;

        // Verify imageIds exist
        const images = await Image.find({ _id: { $in: imageIds } });
        if (images.length !== imageIds.length) {
            return res.status(400).json({ message: 'One or more image IDs are invalid.' });
        }

        const newCake = new Cake({
            name,
            description,
            price,
            category,
            image: imageIds,
            stock,
            tags,
            flavors,
            sizes,
            spongeType,
            shape,
            dietaryPreferences,
            availability,
            deliveryOptions,
            createdBy: req.user.id,
        });

        await newCake.save();

        // Populate related fields for response
        const populatedCake = await Cake.findById(newCake._id)
            .populate('category', 'name')
            .populate('tags', 'name')
            .populate('flavors', 'name')
            .populate('sizes', 'name')
            .populate('spongeType', 'name')
            .populate('shape', 'name')
            .populate('dietaryPreferences', 'name')
            .populate('availability', 'name')
            .populate('deliveryOptions', 'name')
            .populate('image', '_id filename mimeType');

        res.status(201).json({
            message: 'Cake created successfully.',
            data: populatedCake,
        });
    } catch (error) {
        console.error('Error creating cake:', error);
        res.status(500).json({ message: 'Server error while creating cake.' });
    }
});

// GET: Retrieve all cakes
router.get('/cakes', authMiddleware, async (req, res) => {
    try {
        const cakes = await Cake.find()
            .populate('category', 'name')
            .populate('tags', 'name')
            .populate('flavors', 'name')
            .populate('sizes', 'name')
            .populate('spongeType', 'name')
            .populate('shape', 'name')
            .populate('dietaryPreferences', 'name')
            .populate('availability', 'name')
            .populate('deliveryOptions', 'name')
            .populate('image', '_id filename mimeType');

        res.status(200).json({
            message: 'Cakes retrieved successfully.',
            data: cakes,
        });
    } catch (error) {
        console.error('Error retrieving cakes:', error);
        res.status(500).json({ message: 'Server error while retrieving cakes.' });
    }
});

// GET: Retrieve a single cake by ID
router.get('/cakes/:id', authMiddleware, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid cake ID.' });
        }

        const cake = await Cake.findById(req.params.id)
            .populate('category', 'name')
            .populate('tags', 'name')
            .populate('flavors', 'name')
            .populate('sizes', 'name')
            .populate('spongeType', 'name')
            .populate('shape', 'name')
            .populate('dietaryPreferences', 'name')
            .populate('availability', 'name')
            .populate('deliveryOptions', 'name')
            .populate('image', '_id filename mimeType');

        if (!cake) {
            return res.status(404).json({ message: 'Cake not found.' });
        }

        res.status(200).json({
            message: 'Cake retrieved successfully.',
            data: cake,
        });
    } catch (error) {
        console.error('Error retrieving cake:', error);
        res.status(500).json({ message: 'Server error while retrieving cake.' });
    }
});

// PUT: Update a cake
router.put('/cakes/:id', authMiddleware, validateCake, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid cake ID.' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: errors.array()[0].msg });
        }

        const {
            name,
            description,
            price,
            category,
            imageIds,
            stock,
            tags,
            flavors,
            sizes,
            spongeType,
            shape,
            dietaryPreferences,
            availability,
            deliveryOptions,
        } = req.body;

        // Verify imageIds exist
        const images = await Image.find({ _id: { $in: imageIds } });
        if (images.length !== imageIds.length) {
            return res.status(400).json({ message: 'One or more image IDs are invalid.' });
        }

        const updatedCake = await Cake.findByIdAndUpdate(
            req.params.id,
            {
                name,
                description,
                price,
                category,
                image: imageIds,
                stock,
                tags,
                flavors,
                sizes,
                spongeType,
                shape,
                dietaryPreferences,
                availability,
                deliveryOptions,
                updatedAt: Date.now(),
            },
            { new: true, runValidators: true }
        )
            .populate('category', 'name')
            .populate('tags', 'name')
            .populate('flavors', 'name')
            .populate('sizes', 'name')
            .populate('spongeType', 'name')
            .populate('shape', 'name')
            .populate('dietaryPreferences', 'name')
            .populate('availability', 'name')
            .populate('deliveryOptions', 'name')
            .populate('image', '_id filename mimeType');

        if (!updatedCake) {
            return res.status(404).json({ message: 'Cake not found.' });
        }

        res.status(200).json({
            message: 'Cake updated successfully.',
            data: updatedCake,
        });
    } catch (error) {
        console.error('Error updating cake:', error);
        res.status(500).json({ message: 'Server error while updating cake.' });
    }
});

// DELETE: Delete a cake
router.delete('/cakes/:id', authMiddleware, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid cake ID.' });
        }

        const cake = await Cake.findByIdAndDelete(req.params.id);
        if (!cake) {
            return res.status(404).json({ message: 'Cake not found.' });
        }

        res.status(200).json({ message: 'Cake deleted successfully.' });
    } catch (error) {
        console.error('Error deleting cake:', error);
        res.status(500).json({ message: 'Server error while deleting cake.' });
    }
});

module.exports = router;