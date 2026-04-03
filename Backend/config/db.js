const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // This creates a database named 'lms-project' in Compass
    await mongoose.connect('mongodb://127.0.0.1:27017/lms-project');
    console.log('🍃 MongoDB connected successfully via Mongoose.');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;