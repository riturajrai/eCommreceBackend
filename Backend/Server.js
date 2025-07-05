const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./SingupAndLogin/Login.js');
const cakeRoutes = require('./routes/CakesRoute');
const discountFeatures = require('./controllers/coupons');
const userAllCakesFeatures = require('./cake/userCakes');
const adminPostCake = require('./cake/AdminCakePost.js');

dotenv.config();

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'https://stalwart-dragon-ef825f.netlify.app'],
    methods: ['GET' , 'PUT' , 'POST' , 'DELETE'],
    credentials: true,
  })
);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api', authRoutes);
app.use('/api', cakeRoutes);
app.use('/api/user', userAllCakesFeatures);
app.use('/api', discountFeatures);
app.use('/api', adminPostCake);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
