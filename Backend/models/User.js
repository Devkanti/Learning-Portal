const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher', 'admin'], required: true },
  
  phone: { type: String, default: '' },
  dob: { type: String, default: '' },
  age: { type: Number, default: null },
  
  // NEW: An array to permanently store the IDs of finished video lectures
  completedVideos: [{ type: String }] 
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true }
});

module.exports = mongoose.model('User', userSchema);