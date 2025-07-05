const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/UserSchema');
const Profile = require('../models/ProfileSchema');
const authMiddleware = require('../middleware/authMiddleware');

// SIGNUP
router.post(
  '/signup',
  [
    check('name').trim().notEmpty().withMessage('Name is required'),
    check('email').isEmail().withMessage('Valid email is required'),
    check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    check('phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { name, email, password, phone } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create User
      const user = new User({
        email,
        password: hashedPassword,
        role: 'user',
      });
      await user.save();

      // Create Profile linked to User
      const profile = new Profile({
        user: user._id,
        name,
        phone,
        email, // Store email in profile for convenience
        addresses: [],
      });
      await profile.save();

      // Generate JWT
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.status(201).json({
        message: 'Signup successful',
        token,
        user: {
          id: user._id,
          name: profile.name,
          email: user.email,
          phone: profile.phone,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Signup error:', { message: error.message, stack: error.stack });
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// LOGIN
router.post(
  '/login',
  [
    check('email').isEmail().withMessage('Valid email is required'),
    check('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid password' });
      }

      // Find profile
      const profile = await Profile.findOne({ user: user._id });
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found. Please contact support.' });
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: profile.name,
          email: user.email,
          phone: profile.phone,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Login error:', { message: error.message, stack: error.stack });
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// GET USER PROFILE (protected)
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching profile for user ID:', req.user.id, 'Role:', req.user.role);
    const profile = await Profile.findOne({ user: req.user.id }).select('-password');
    if (!profile) {
      console.error('Profile not found for user ID:', req.user.id);
      return res.status(404).json({ message: 'Profile not found', action: 'redirect', url: '/signup' });
    }
    res.status(200).json({ message: 'Profile fetched successfully', data: profile });
  } catch (error) {
    console.error('Get profile error for user ID:', req.user.id, 'Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT: Update profile
router.put(
  '/profile',
  authMiddleware,
  [
    check('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    check('email').optional().isEmail().withMessage('Valid email is required'),
    check('phone').optional().matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number is required'),
    check('preferences').optional().isArray().withMessage('Preferences must be an array'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const profile = await Profile.findOne({ user: req.user.id });
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const { name, email, phone, preferences } = req.body;

      if (email && email !== user.email) {
        const exists = await User.findOne({ email });
        if (exists) {
          return res.status(400).json({ message: 'Email already in use' });
        }
        user.email = email;
        profile.email = email; // Sync email in profile
        await user.save();
      }

      if (name) profile.name = name;
      if (phone) profile.phone = phone;
      if (preferences) profile.preferences = preferences;

      await profile.save();
      const updatedProfile = await Profile.findOne({ user: req.user.id }).select('-password');
      res.status(200).json({ message: 'Profile updated successfully', data: updatedProfile });
    } catch (error) {
      console.error('Update profile error:', { message: error.message, stack: error.stack });
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// PUT: Change password
router.put(
  '/profile/password',
  authMiddleware,
  [
    check('currentPassword').notEmpty().withMessage('Current password is required'),
    check('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const user = await User.findById(req.user.id).select('+password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const isMatch = await bcrypt.compare(req.body.currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      user.password = await bcrypt.hash(req.body.newPassword, 10);
      await user.save();

      const profile = await Profile.findOne({ user: req.user.id }).select('-password');
      res.status(200).json({ message: 'Password updated successfully', data: profile });
    } catch (error) {
      console.error('Change password error:', { message: error.message, stack: error.stack });
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// POST: Add new address
router.post(
  '/profile/address',
  authMiddleware,
  [
    check('street').notEmpty().withMessage('Street is required'),
    check('city').notEmpty().withMessage('City is required'),
    check('state').notEmpty().withMessage('State is required'),
    check('zip').matches(/^[0-9]{6}$/).withMessage('Valid 6-digit zip code is required'),
    check('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const profile = await Profile.findOne({ user: req.user.id });
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      const { street, city, state, zip, isDefault } = req.body;
      if (isDefault) {
        profile.addresses.forEach((a) => (a.isDefault = false));
      }

      profile.addresses.push({ street, city, state, zip, isDefault: !!isDefault });
      await profile.save();

      const updatedProfile = await Profile.findOne({ user: req.user.id }).select('-password');
      res.status(200).json({ message: 'Address added successfully', data: updatedProfile });
    } catch (error) {
      console.error('Add address error:', { message: error.message, stack: error.stack });
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// PUT: Update address
router.put(
  '/profile/address/:id',
  authMiddleware,
  [
    check('street').optional().notEmpty().withMessage('Street cannot be empty'),
    check('city').optional().notEmpty().withMessage('City cannot be empty'),
    check('state').optional().notEmpty().withMessage('State cannot be empty'),
    check('zip').optional().matches(/^[0-9]{6}$/).withMessage('Valid 6-digit zip code is required'),
    check('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const profile = await Profile.findOne({ user: req.user.id });
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      const address = profile.addresses.id(req.params.id);
      if (!address) {
        return res.status(404).json({ message: 'Address not found' });
      }

      const { street, city, state, zip, isDefault } = req.body;
      if (street) address.street = street;
      if (city) address.city = city;
      if (state) address.state = state;
      if (zip) address.zip = zip;
      if (isDefault) {
        profile.addresses.forEach((a) => (a.isDefault = false));
        address.isDefault = true;
      }

      await profile.save();
      const updatedProfile = await Profile.findOne({ user: req.user.id }).select('-password');
      res.status(200).json({ message: 'Address updated successfully', data: updatedProfile });
    } catch (error) {
      console.error('Update address error:', { message: error.message, stack: error.stack });
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// DELETE: Remove address
router.delete('/profile/address/:id', authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const address = profile.addresses.id(req.params.id);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    address.remove();
    await profile.save();

    const updatedProfile = await Profile.findOne({ user: req.user.id }).select('-password');
    res.status(200).json({ message: 'Address deleted successfully', data: updatedProfile });
  } catch (error) {
    console.error('Delete address error:', { message: error.message, stack: error.stack });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET ALL USERS (admin only)
router.get('/users', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const users = await User.find().select('-password');
    const profiles = await Profile.find().select('-password');
    const usersWithProfiles = users.map((user) => {
      const profile = profiles.find((p) => p.user.toString() === user._id.toString());
      return {
        id: user._id,
        email: user.email,
        role: user.role,
        name: profile?.name || 'N/A',
        phone: profile?.phone || 'N/A',
      };
    });
    res.status(200).json({ message: 'Users fetched successfully', users: usersWithProfiles });
  } catch (error) {
    console.error('Get users error:', { message: error.message, stack: error.stack });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// UPDATE USER ROLE (admin only)
router.put(
  '/users/:id/role',
  authMiddleware,
  [
    check('role').isIn(['user', 'admin']).withMessage('Invalid role'),
  ],
  async (req, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { role } = req.body;
      const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const profile = await Profile.findOne({ user: user._id });
      res.status(200).json({
        message: 'Role updated successfully',
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          name: profile?.name || 'N/A',
          phone: profile?.phone || 'N/A',
        },
      });
    } catch (error) {
      console.error('Update role error:', { message: error.message, stack: error.stack });
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// DELETE USER (admin only)
router.delete('/users/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete associated profile
    await Profile.findOneAndDelete({ user: req.params.id });

    res.status(200).json({ message: 'User and profile deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', { message: error.message, stack: error.stack });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;