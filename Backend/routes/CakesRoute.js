const express = require('express');
const router = express.Router();

// 🐞 Debug logs for each import
console.log('Loading CakeController...');

console.log('Loading ImageController...');
const { uploadImage, getImage } = require('../controllers/imageController');

console.log('Loading CategoryController...');
const { categoryPost, getAllCategories, deleteCategory } = require('../cake/Category');

console.log('Loading Middleware...');
const { validateCategory } = require('../middleware/categoryMiddleware');

console.log('Loading FlavorController...');
const { flavorPost, getAllFlavors, deleteFlavor } = require('../cake/flavorController');

console.log('Loading SizeController...');
const { sizePost, getAllSizes, deleteSize } = require('../cake/sizeContoll');

console.log('Loading DietaryPreferenceController...');
const { dietaryPreferencePost, getAllDietaryPreferences, deleteDietaryPreference } = require('../cake/dietaryPreferenceController');

console.log('Loading AvailabilityController...');
const { availabilityPost, updateAvailability, getAllAvailabilities, deleteAvailability } = require('../cake/availabilityController');

console.log('Loading DeliveryOptionController...');
const { deliveryOptionPost, getAllDeliveryOptions, updateDeliveryOption, deleteDeliveryOption } = require('../cake/deliveryOptionController');

console.log('Loading TagController...');
const { tagPost, getAllTags, updateTag, deleteTag } = require('../cake/tagController');
const {getAllShapes, createSpongeType , getAllSpongeTypes, createShape} = require('../cake/spongeTypesAndShapeController')

const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');


// ======================= Image Management =======================
router.post('/images', authMiddleware, upload.single('image'), uploadImage);
router.get('/images/:id', getImage);

// ======================
router.get('/spongeTypes',authMiddleware, getAllSpongeTypes);
router.get('/shapes',authMiddleware, getAllShapes);
router.post('/sponge-types', createSpongeType);
router.post('/shapes', createShape);



// Update cake stock (for order placement)
router.put('/cakes/:id/stock', authMiddleware, async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Invalid quantity.' });
    }
    const Cake = require('../models/CakeSchema');
    const cake = await Cake.findById(req.params.id);
    if (!cake) {
      return res.status(404).json({ success: false, message: `Cake not found (ID: ${req.params.id}).` });
    }
    if (cake.stock != null && cake.stock < quantity) {
      return res.status(400).json({ message: `Only ${cake.stock} items available in stock.` });
    }
    cake.stock = cake.stock != null ? cake.stock - quantity : null;
    await cake.save();
    res.status(200).json({ message: 'Stock updated successfully!' });
  } catch (error) {
    console.error('Update stock error for ID:', req.params.id, error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ===================== Category Management ======================
router.post('/categories', authMiddleware, categoryPost);
router.get('/categories', authMiddleware, getAllCategories);
router.delete('/categories/:id', authMiddleware, deleteCategory);

// ======================= Flavor Management =======================
router.post('/flavors', authMiddleware, flavorPost);
router.get('/flavors', authMiddleware, getAllFlavors);
router.delete('/flavors/:id', authMiddleware, deleteFlavor);

// ======================== Size Management ========================
router.post('/sizes', authMiddleware, sizePost);
router.get('/sizes', authMiddleware, getAllSizes);
router.delete('/sizes/:id', authMiddleware, deleteSize);

// =============== Dietary Preference Management ===================
router.post('/dietary-preferences', authMiddleware, dietaryPreferencePost);
router.get('/dietary-preferences', authMiddleware, getAllDietaryPreferences);
router.delete('/dietary-preferences/:id', authMiddleware, deleteDietaryPreference);

// ===================== Availability Management ===================
router.post('/availabilities', authMiddleware, availabilityPost);
router.get('/availabilities', authMiddleware, getAllAvailabilities);
router.put('/availabilities/:id', authMiddleware, updateAvailability);
router.delete('/availabilities/:id', authMiddleware, deleteAvailability);

// =================== Delivery Option Management ===================
router.post('/delivery-options', authMiddleware, deliveryOptionPost);
router.get('/delivery-options', authMiddleware, getAllDeliveryOptions);
router.put('/delivery-options/:id', authMiddleware, updateDeliveryOption);
router.delete('/delivery-options/:id', authMiddleware, deleteDeliveryOption);

// ======================== Tag Management =========================
router.post('/tags', authMiddleware, tagPost);
router.get('/tags', authMiddleware, getAllTags);
router.put('/tags/:id', authMiddleware, updateTag);
router.delete('/tags/:id', authMiddleware, deleteTag);

module.exports = router;
