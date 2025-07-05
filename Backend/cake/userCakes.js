const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
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
const Cart = require('../models/CartSchema');
const Coupon = require('../models/CouponSchema');
const Order = require('../models/OrderSchema');
const Profile = require('../models/ProfileSchema');
const authUserMiddleware = require('../middleware/authMiddleware');

// GET: Retrieve all cakes with pagination
router.get(
  '/cakes',
  authUserMiddleware,
  [
    check('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    check('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { page = 1, limit = 6 } = req.query;
      const cakes = await Cake.find()
        .populate('image', 'filename mimeType')
        .populate('category', 'name')
        .populate('tags', 'name')
        .populate('flavors', 'name')
        .populate('sizes', 'name')
        .populate('spongeType', 'name')
        .populate('shape', 'name')
        .populate('dietaryPreferences', 'name')
        .populate('availability', 'name')
        .populate('deliveryOptions', 'name')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean();

      const total = await Cake.countDocuments();
      return res.status(200).json({ message: 'Cakes fetched successfully', data: cakes, total });
    } catch (error) {
      console.error('Error fetching cakes:', { message: error.message, stack: error.stack });
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  }
);

// GET: Retrieve a single cake by ID
router.get(
  '/cakes/:id',
  authUserMiddleware,
  [check('id').isMongoId().withMessage('Invalid cake ID format')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { id } = req.params;
      const cake = await Cake.findById(id)
        .populate('image', 'filename mimeType')
        .populate('category', 'name')
        .populate('tags', 'name')
        .populate('flavors', 'name')
        .populate('sizes', 'name')
        .populate('spongeType', 'name')
        .populate('shape', 'name')
        .populate('dietaryPreferences', 'name')
        .populate('availability', 'name')
        .populate('deliveryOptions', 'name')
        .lean();

      if (!cake) {
        return res.status(404).json({ message: 'Cake not found' });
      }

      return res.status(200).json({ message: 'Cake fetched successfully', data: cake });
    } catch (error) {
      console.error('Error fetching cake by ID:', { message: error.message, stack: error.stack, id: req.params.id });
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  }
);

// GET: Retrieve customization options
router.get('/spongeTypes', authUserMiddleware, async (req, res) => {
  try {
    const spongeTypes = await SpongeType.find().select('name description').lean();
    return res.status(200).json({ message: 'Sponge types fetched successfully', data: spongeTypes });
  } catch (error) {
    console.error('Error fetching sponge types:', { message: error.message, stack: error.stack });
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

router.get('/shapes', authUserMiddleware, async (req, res) => {
  try {
    const shapes = await Shape.find().select('name description').lean();
    return res.status(200).json({ message: 'Shapes fetched successfully', data: shapes });
  } catch (error) {
    console.error('Error fetching shapes:', { message: error.message, stack: error.stack });
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

router.get('/sizes', authUserMiddleware, async (req, res) => {
  try {
    const sizes = await Size.find().select('name description').lean();
    return res.status(200).json({ message: 'Sizes fetched successfully', data: sizes });
  } catch (error) {
    console.error('Error fetching sizes:', { message: error.message, stack: error.stack });
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

router.get('/flavors', authUserMiddleware, async (req, res) => {
  try {
    const flavors = await Flavor.find().select('name description').lean();
    return res.status(200).json({ message: 'Flavors fetched successfully', data: flavors });
  } catch (error) {
    console.error('Error fetching flavors:', { message: error.message, stack: error.stack });
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// POST: Add to cart
router.post(
  '/cart',
  authUserMiddleware,
  [
    check('cakeId').isMongoId().withMessage('Invalid cake ID format'),
    check('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    check('customization.spongeType').isMongoId().withMessage('Invalid sponge type ID'),
    check('customization.shape').isMongoId().withMessage('Invalid shape ID'),
    check('customization.size').isMongoId().withMessage('Invalid size ID'),
    check('customization.flavor').isMongoId().withMessage('Invalid flavor ID'),
    check('customization.inscription').trim().isLength({ max: 100 }).withMessage('Inscription must be 100 characters or less'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      if (!req.user?.id) {
        console.error('User ID missing in auth middleware');
        return res.status(401).json({ message: 'User authentication failed' });
      }

      const { cakeId, quantity, customization } = req.body;

      const [cake, spongeType, shape, size, flavor] = await Promise.all([
        Cake.findById(cakeId).lean(),
        SpongeType.findById(customization.spongeType).lean(),
        Shape.findById(customization.shape).lean(),
        Size.findById(customization.size).lean(),
        Flavor.findById(customization.flavor).lean(),
      ]);

      if (!cake) {
        return res.status(404).json({ message: `Cake not found (ID: ${cakeId})` });
      }
      if (!spongeType) {
        return res.status(400).json({ message: `Invalid sponge type ID: ${customization.spongeType}` });
      }
      if (!shape) {
        return res.status(400).json({ message: `Invalid shape ID: ${customization.shape}` });
      }
      if (!size) {
        return res.status(400).json({ message: `Invalid size ID: ${customization.size}` });
      }
      if (!flavor) {
        return res.status(400).json({ message: `Invalid flavor ID: ${customization.flavor}` });
      }
      if (cake.stock != null && quantity > cake.stock) {
        return res.status(400).json({ message: `Only ${cake.stock} items available in stock for ${cake.name}` });
      }

      let cart = await Cart.findOne({ user: req.user.id });
      if (!cart) {
        cart = new Cart({ user: req.user.id, items: [] });
      }

      const existingItemIndex = cart.items.findIndex(
        (item) =>
          item.cake.toString() === cakeId &&
          item.customization.spongeType.toString() === customization.spongeType &&
          item.customization.shape.toString() === customization.shape &&
          item.customization.size.toString() === customization.size &&
          item.customization.flavor.toString() === customization.flavor &&
          item.customization.inscription === customization.inscription
      );

      if (existingItemIndex >= 0) {
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        cart.items.push({
          cake: cakeId,
          quantity,
          customization: {
            spongeType: customization.spongeType,
            shape: customization.shape,
            size: customization.size,
            flavor: customization.flavor,
            inscription: customization.inscription || '',
          },
        });
      }

      await cart.save();

      const populatedCart = await Cart.findById(cart._id)
        .populate({
          path: 'items.cake',
          select: 'name price image stock',
          populate: { path: 'image', select: 'filename mimeType' },
        })
        .populate('items.customization.spongeType', 'name')
        .populate('items.customization.shape', 'name')
        .populate('items.customization.size', 'name')
        .populate('items.customization.flavor', 'name')
        .lean();

      const transformedCart = {
        items: populatedCart.items.map((item) => ({
          cakeId: item.cake._id.toString(),
          name: item.cake.name || 'Unknown Cake',
          price: item.cake.price || 0,
          image: item.cake.image?.[0]?.filename
            ? `https://cakewebsite-r7is.onrender.com/api/images/${item.cake.image[0]._id}`
            : 'https://via.placeholder.com/150',
          stock: item.cake.stock ?? null,
          quantity: item.quantity,
          customization: {
            spongeType: item.customization.spongeType?.name || 'Unknown',
            shape: item.customization.shape?.name || 'Unknown',
            size: item.customization.size?.name || 'Unknown',
            flavor: item.customization.flavor?.name || 'Unknown',
            inscription: item.customization.inscription || '',
          },
        })),
      };

      console.log('Cart after add:', transformedCart);
      return res.status(200).json({ message: 'Added to cart successfully', cart: transformedCart });
    } catch (error) {
      console.error('Error adding to cart:', {
        message: error.message,
        stack: error.stack,
        userId: req.user?.id,
        body: req.body,
      });
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  }
);

// GET: Retrieve cart
router.get('/cart', authUserMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id })
      .populate({
        path: 'items.cake',
        select: 'name price image stock',
        populate: { path: 'image', select: 'filename mimeType' },
      })
      .populate('items.customization.spongeType', 'name')
      .populate('items.customization.shape', 'name')
      .populate('items.customization.size', 'name')
      .populate('items.customization.flavor', 'name')
      .lean();

    if (!cart || !cart.items.length) {
      return res.status(200).json({ message: 'Cart is empty', cart: { items: [] } });
    }

    const transformedCart = {
      items: cart.items.map((item) => ({
        cakeId: item.cake._id.toString(),
        name: item.cake.name || 'Unknown Cake',
        price: item.cake.price || 0,
        image: item.cake.image?.[0]?.filename
          ? `https://cakewebsite-r7is.onrender.com/api/images/${item.cake.image[0]._id}`
          : 'https://via.placeholder.com/150',
        stock: item.cake.stock ?? null,
        quantity: item.quantity,
        customization: {
          spongeType: item.customization.spongeType?.name || 'Unknown',
          shape: item.customization.shape?.name || 'Unknown',
          size: item.customization.size?.name || 'Unknown',
          flavor: item.customization.flavor?.name || 'Unknown',
          inscription: item.customization.inscription || '',
        },
      })),
    };

    console.log('Fetched cart:', transformedCart);
    return res.status(200).json({ message: 'Cart fetched successfully', cart: transformedCart });
  } catch (error) {
    console.error('Get cart error:', { message: error.message, stack: error.stack, userId: req.user.id });
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// GET: Retrieve cart count
router.get('/cart/count', authUserMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).lean();
    const count = cart ? cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
    console.log('Cart count:', { userId: req.user.id, count });
    return res.status(200).json({ message: 'Cart count fetched successfully', count });
  } catch (error) {
    console.error('Get cart count error:', { message: error.message, stack: error.stack, userId: req.user.id });
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// PUT: Update cart item quantity
router.put(
  '/cart/:cakeId',
  authUserMiddleware,
  [
    check('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    check('inscription').optional().trim().isLength({ max: 100 }).withMessage('Inscription must be 100 characters or less'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { cakeId } = req.params;
      const { quantity, inscription } = req.body;

      if (!req.user?.id) {
        return res.status(401).json({ message: 'User authentication failed' });
      }

      const cake = await Cake.findById(cakeId).lean();
      if (!cake) {
        return res.status(404).json({ message: `Cake not found (ID: ${cakeId})` });
      }
      if (cake.stock != null && quantity > cake.stock) {
        return res.status(400).json({ message: `Only ${cake.stock} items available in stock for ${cake.name}` });
      }

      let cart = await Cart.findOne({ user: req.user.id });
      if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
      }

      const itemIndex = cart.items.findIndex(
        (item) => item.cake.toString() === cakeId && item.customization.inscription === inscription
      );

      if (itemIndex === -1) {
        return res.status(404).json({ message: 'Cart item not found' });
      }

      cart.items[itemIndex].quantity = quantity;
      await cart.save();

      const populatedCart = await Cart.findById(cart._id)
        .populate({
          path: 'items.cake',
          select: 'name price image stock',
          populate: { path: 'image', select: 'filename mimeType' },
        })
        .populate('items.customization.spongeType', 'name')
        .populate('items.customization.shape', 'name')
        .populate('items.customization.size', 'name')
        .populate('items.customization.flavor', 'name')
        .lean();

      const transformedCart = {
        items: populatedCart.items.map((item) => ({
          cakeId: item.cake._id.toString(),
          name: item.cake.name || 'Unknown Cake',
          price: item.cake.price || 0,
          image: item.cake.image?.[0]?.filename
            ? `https://cakewebsite-r7is.onrender.com/api/images/${item.cake.image[0]._id}`
            : 'https://via.placeholder.com/150',
          stock: item.cake.stock ?? null,
          quantity: item.quantity,
          customization: {
            spongeType: item.customization.spongeType?.name || 'Unknown',
            shape: item.customization.shape?.name || 'Unknown',
            size: item.customization.size?.name || 'Unknown',
            flavor: item.customization.flavor?.name || 'Unknown',
            inscription: item.customization.inscription || '',
          },
        })),
      };

      console.log('Cart after update:', transformedCart);
      return res.status(200).json({ message: 'Cart updated successfully', cart: transformedCart });
    } catch (error) {
      console.error('Error updating cart:', {
        message: error.message,
        stack: error.stack,
        userId: req.user?.id,
        cakeId: req.params.cakeId,
      });
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  }
);

// DELETE: Remove item from cart
router.delete(
  '/cart/:cakeId',
  authUserMiddleware,
  [
    check('inscription').optional().trim().isLength({ max: 100 }).withMessage('Inscription must be 100 characters or less'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { cakeId } = req.params;
      const { inscription } = req.body;

      if (!req.user?.id) {
        return res.status(401).json({ message: 'User authentication failed' });
      }

      let cart = await Cart.findOne({ user: req.user.id });
      if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
      }

      const itemIndex = cart.items.findIndex(
        (item) => item.cake.toString() === cakeId && item.customization.inscription === inscription
      );

      if (itemIndex === -1) {
        return res.status(404).json({ message: 'Cart item not found' });
      }

      cart.items.splice(itemIndex, 1);
      await cart.save();

      const populatedCart = await Cart.findById(cart._id)
        .populate({
          path: 'items.cake',
          select: 'name price image stock',
          populate: { path: 'image', select: 'filename mimeType' },
        })
        .populate('items.customization.spongeType', 'name')
        .populate('items.customization.shape', 'name')
        .populate('items.customization.size', 'name')
        .populate('items.customization.flavor', 'name')
        .lean();

      const transformedCart = {
        items: populatedCart.items.map((item) => ({
          cakeId: item.cake._id.toString(),
          name: item.cake.name || 'Unknown Cake',
          price: item.cake.price || 0,
          image: item.cake.image?.[0]?.filename
            ? `https://cakewebsite-r7is.onrender.com/api/images/${item.cake.image[0]._id}`
            : 'https://via.placeholder.com/150',
          stock: item.cake.stock ?? null,
          quantity: item.quantity,
          customization: {
            spongeType: item.customization.spongeType?.name || 'Unknown',
            shape: item.customization.shape?.name || 'Unknown',
            size: item.customization.size?.name || 'Unknown',
            flavor: item.customization.flavor?.name || 'Unknown',
            inscription: item.customization.inscription || '',
          },
        })),
      };

      console.log('Cart after remove:', transformedCart);
      return res.status(200).json({ message: 'Item removed from cart', cart: transformedCart });
    } catch (error) {
      console.error('Error removing from cart:', {
        message: error.message,
        stack: error.stack,
        userId: req.user?.id,
        cakeId: req.params.cakeId,
      });
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  }
);

// POST: Apply coupon
router.post(
  '/cart/apply-coupon',
  authUserMiddleware,
  [
    check('couponCode')
      .trim()
      .notEmpty()
      .withMessage('Coupon code is required')
      .matches(/^[A-Z0-9]+$/)
      .withMessage('Coupon code must contain only letters and numbers'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { couponCode } = req.body;
      const cart = await Cart.findOne({ user: req.user.id }).populate({
        path: 'items.cake',
        select: 'price',
      });

      if (!cart || !cart.items.length) {
        return res.status(400).json({ message: 'Cart is empty' });
      }

      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true }).lean();
      if (!coupon) {
        return res.status(400).json({ message: 'Invalid or inactive coupon code' });
      }

      const now = new Date();
      if (coupon.validFrom && now < coupon.validFrom) {
        return res.status(400).json({ message: 'Coupon is not yet valid' });
      }
      if (coupon.validUntil && now > coupon.validUntil) {
        return res.status(400).json({ message: 'Coupon has expired' });
      }
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return res.status(400).json({ message: 'Coupon usage limit reached' });
      }
      if (coupon.usedBy && coupon.usedBy.includes(req.user.id)) {
        return res.status(400).json({ message: 'Coupon already used by this user' });
      }

      const cartTotal = cart.items.reduce((sum, item) => sum + (item.cake.price || 0) * item.quantity, 0);
      if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) {
        return res.status(400).json({ message: `Minimum order amount is ₹${coupon.minOrderAmount}` });
      }

      let discountAmount = 0;
      if (coupon.discountType === 'percentage') {
        discountAmount = (cartTotal * coupon.discountValue) / 100;
        if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
          discountAmount = coupon.maxDiscountAmount;
        }
      } else {
        discountAmount = coupon.discountValue;
      }

      console.log('Coupon applied:', { couponCode, discountAmount, cartTotal });
      return res.status(200).json({
        message: 'Coupon applied successfully',
        coupon: { code: coupon.code, discountAmount },
        totalAfterDiscount: cartTotal - discountAmount,
      });
    } catch (error) {
      console.error('Apply coupon error:', { message: error.message, stack: error.stack, userId: req.user.id, couponCode: req.body.couponCode });
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  }
);

// POST: Place order
router.post(
  '/orders',
  authUserMiddleware,
  [
    check('couponCode')
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Coupon code cannot be empty')
      .matches(/^[A-Z0-9]+$/)
      .withMessage('Coupon code must contain only letters and numbers'),
    check('addressId').notEmpty().isMongoId().withMessage('Address ID is required and must be valid'),
    check('shippingAddress').optional().custom((value) => {
      if (value && (!value.street || !value.city || !value.state || !value.zip)) {
        throw new Error('Shipping address must include street, city, state, and zip');
      }
      return true;
    }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { couponCode, addressId, shippingAddress } = req.body;
      const userId = req.user.id;

      // Fetch profile
      const profile = await Profile.findOne({ user: userId });
      if (!profile) {
        console.error('No profile found for userId:', userId);
        return res.status(400).json({ message: 'User profile not found. Please create a profile.' });
      }

      // Handle shipping address
      let address;
      if (shippingAddress) {
        address = {
          street: shippingAddress.street,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zip: shippingAddress.zip,
          isDefault: shippingAddress.isDefault || false,
        };
        const exists = profile.addresses.some(
          (addr) => addr.street === address.street && addr.zip === address.zip
        );
        if (!exists) {
          profile.addresses.push(address);
          await profile.save();
        }
      } else if (addressId) {
        address = profile.addresses.id(addressId);
        if (!address) {
          console.warn('Address ID not found:', addressId);
          return res.status(400).json({ message: 'Address not found' });
        }
      } else {
        return res.status(400).json({ message: 'Address ID or shipping address is required' });
      }

      // Validate address
      if (!address.street || !address.city || !address.state || !address.zip) {
        console.error('Invalid address:', address);
        return res.status(400).json({ message: 'Shipping address is missing required fields' });
      }

      // Fetch cart
      const cart = await Cart.findOne({ user: userId }).populate({
        path: 'items.cake',
        select: 'name price image stock',
        populate: { path: 'image', select: 'filename mimeType' },
      });

      if (!cart || !cart.items.length) {
        console.error('Cart is empty for userId:', userId);
        return res.status(400).json({ message: 'Cart is empty' });
      }

      // Validate cart items
      for (const item of cart.items) {
        if (!item.cake || !item.cake.name || item.cake.price == null) {
          console.error('Invalid cake in cart:', item);
          return res.status(400).json({ message: `Invalid cake in cart: ${item.cake?._id || 'unknown'}` });
        }
        if (item.cake.stock != null && item.quantity > item.cake.stock) {
          return res.status(400).json({ message: `Insufficient stock for ${item.cake.name}` });
        }
      }

      // Calculate total
      const cartTotal = cart.items.reduce((sum, item) => sum + item.cake.price * item.quantity, 0);
      if (cartTotal <= 0) {
        console.error('Invalid cart total:', cartTotal);
        return res.status(400).json({ message: 'Cart total is invalid' });
      }

      let discountAmount = 0;
      if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
        if (!coupon) {
          return res.status(400).json({ message: 'Invalid or inactive coupon code' });
        }
        coupon.usedBy = coupon.usedBy || [];
        const now = new Date();
        if (coupon.validFrom && now < coupon.validFrom) {
          return res.status(400).json({ message: 'Coupon is not yet valid' });
        }
        if (coupon.validUntil && now > coupon.validUntil) {
          return res.status(400).json({ message: 'Coupon has expired' });
        }
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          return res.status(400).json({ message: 'Coupon usage limit reached' });
        }
        if (coupon.usedBy.includes(userId)) {
          return res.status(400).json({ message: 'Coupon already used by this user' });
        }
        if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) {
          return res.status(400).json({ message: `Minimum order amount is ₹${coupon.minOrderAmount}` });
        }

        discountAmount =
          coupon.discountType === 'percentage'
            ? Math.min((cartTotal * coupon.discountValue) / 100, coupon.maxDiscountAmount || Infinity)
            : coupon.discountValue;

        coupon.usedCount = (coupon.usedCount || 0) + 1;
        coupon.usedBy.push(userId);
        await coupon.save();
      }

      const finalAmount = cartTotal - discountAmount;
      if (finalAmount < 0) {
        console.error('Invalid final amount:', finalAmount);
        return res.status(400).json({ message: 'Final amount cannot be negative' });
      }

      // Create order
      const order = new Order({
        user: userId,
        items: cart.items.map((item) => ({
          cake: item.cake._id,
          quantity: item.quantity,
          price: item.cake.price,
          name: item.cake.name,
          image: item.cake.image?.[0]?.filename
            ? `https://cakewebsite-r7is.onrender.com/api/images/${item.cake.image[0]._id}`
            : 'https://via.placeholder.com/150',
          customization: item.customization,
        })),
        totalAmount: cartTotal,
        finalAmount,
        coupon: couponCode ? { code: couponCode.toUpperCase(), discountAmount } : undefined,
        shippingAddress: {
          street: address.street,
          city: address.city,
          state: address.state,
          zip: address.zip,
          isDefault: address.isDefault,
        },
        status: 'pending',
      });

      await order.save();

      // Update stock
      for (const item of cart.items) {
        if (item.cake.stock != null) {
          await Cake.findByIdAndUpdate(item.cake._id, { $inc: { stock: -item.quantity } });
        }
      }

      // Clear cart
      cart.items = [];
      await cart.save();

      // Populate order for response
      const populatedOrder = await Order.findById(order._id)
        .populate({
          path: 'items.cake',
          select: 'name price image',
          populate: { path: 'image', select: 'filename mimeType' },
        })
        .populate('items.customization.spongeType', 'name')
        .populate('items.customization.shape', 'name')
        .populate('items.customization.size', 'name')
        .populate('items.customization.flavor', 'name')
        .lean();

      console.log('Order placed:', { orderId: order._id, userId });
      return res.status(201).json({ message: 'Order placed successfully', data: populatedOrder });
    } catch (error) {
      console.error('Error placing order:', {
        message: error.message,
        stack: error.stack,
        userId,
        body: req.body,
        cartItems: cart?.items?.length || 0,
      });
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  }
);

// GET: Retrieve orders
router.get('/orders', authUserMiddleware, async (req, res) => {
  try {
    if (!req.user?.id || !mongoose.Types.ObjectId.isValid(req.user.id)) {
      console.error('Invalid user ID:', req.user?.id);
      return res.status(401).json({ message: 'Invalid user ID' });
    }

    const orders = await Order.find({ user: req.user.id })
      .populate({
        path: 'items.cake',
        select: 'name price image',
        populate: { path: 'image', select: 'filename mimeType' },
      })
      .populate('items.customization.spongeType', 'name')
      .populate('items.customization.shape', 'name')
      .populate('items.customization.size', 'name')
      .populate('items.customization.flavor', 'name')
      .lean();

    const transformedOrders = orders.map((order) => ({
      id: order._id.toString(),
      date: order.createdAt,
      status: order.status || 'pending',
      total: order.totalAmount || 0,
      finalTotal: order.finalAmount || order.totalAmount || 0,
      couponCode: order.coupon?.code || '',
      discountAmount: order.coupon?.discountAmount || 0,
      shippingAddress: {
        street: order.shippingAddress?.street || 'N/A',
        city: order.shippingAddress?.city || 'N/A',
        state: order.shippingAddress?.state || 'N/A',
        zip: order.shippingAddress?.zip || 'N/A',
        isDefault: order.shippingAddress?.isDefault || false,
      },
      items: order.items && Array.isArray(order.items) ? order.items.map((item) => ({
        id: item._id.toString(),
        cakeId: item.cake?._id.toString() || '',
        name: item.cake?.name || 'Unknown Cake',
        price: item.cake?.price || 0,
        image: item.cake?.image?.[0]?.filename
          ? `https://cakewebsite-r7is.onrender.com/api/images/${item.cake.image[0]._id}`
          : 'https://via.placeholder.com/150',
        quantity: item.quantity || 0,
        customization: {
          spongeType: item.customization?.spongeType?.name || 'Unknown',
          shape: item.customization?.shape?.name || 'Unknown',
          size: item.customization?.size?.name || 'Unknown',
          flavor: item.customization?.flavor?.name || 'Unknown',
          inscription: item.customization?.inscription || '',
        },
      })) : [],
    }));

    console.log('Orders fetched for userId:', req.user.id, 'Order count:', transformedOrders.length);
    return res.status(200).json(transformedOrders);
  } catch (error) {
    console.error('Error fetching orders:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id,
    });
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

module.exports = router;