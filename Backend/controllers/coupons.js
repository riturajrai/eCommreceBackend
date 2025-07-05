const express = require('express');
const router = express.Router();
const Coupon = require('../models/CouponSchema');
const authMiddleware = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

// Get all coupons
router.get('/coupons', authMiddleware, async (req, res) => {
  try {
    const coupons = await Coupon.find().lean();
    res.status(200).json({ success: true, data: coupons });
  } catch (error) {
    console.error('Fetch coupons error:', error.message);
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
});

// Add a new coupon
router.post('/coupons', authMiddleware, async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderAmount } = req.body;

    if (!code || !['percentage', 'fixed'].includes(discountType) || !discountValue || discountValue <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid coupon data.' });
    }

    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists.' });
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      discountType,
      discountValue: parseFloat(discountValue),
      minOrderAmount: parseFloat(minOrderAmount || 0),
      isActive: true,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    await coupon.save();
    res.status(201).json({ success: true, data: coupon.toObject() });
  } catch (error) {
    console.error('Add coupon error:', error.message);
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
});

// Update a coupon
router.put('/coupons/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { code, discountType, discountValue, minOrderAmount } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid coupon ID.' });
    }

    if (!code || !['percentage', 'fixed'].includes(discountType) || !discountValue || discountValue <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid coupon data.' });
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase(), _id: { $ne: id } });
    if (existingCoupon) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists.' });
    }

    coupon.code = code.toUpperCase();
    coupon.discountType = discountType;
    coupon.discountValue = parseFloat(discountValue);
    coupon.minOrderAmount = parseFloat(minOrderAmount || 0);
    await coupon.save();

    res.status(200).json({ success: true, data: coupon.toObject() });
  } catch (error) {
    console.error('Update coupon error:', error.message);
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
});

// Delete a coupon
router.delete('/coupons/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid coupon ID.' });
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }

    await coupon.deleteOne();
    res.status(200).json({ success: true, message: 'Coupon deleted successfully.' });
  } catch (error) {
    console.error('Delete coupon error:', error.message);
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
});

module.exports = router;