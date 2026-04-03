const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const SECRET_KEY = "your_super_secret_key_for_jwt"; // Make sure this matches your .env in production

// ==========================================
// Register User
// ==========================================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists!" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashedPassword, role });
    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ==========================================
// Login User
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials!" });

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    
    res.json({ 
      message: "Login successful!", 
      token, 
      user: { 
        id: user.id, 
        name: user.name, 
        role: user.role,
        email: user.email,
        phone: user.phone,
        dob: user.dob,
        age: user.age,
        completedVideos: user.completedVideos || [] // NEW: Sends video progress to frontend
      } 
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ==========================================
// Update User Profile
// ==========================================
router.put('/profile/:id', async (req, res) => {
  try {
    const { name, phone, dob, age } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, phone, dob, age },
      { new: true } 
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json({ 
      message: "Profile updated successfully!", 
      user: { 
        id: updatedUser.id, 
        name: updatedUser.name, 
        role: updatedUser.role,
        email: updatedUser.email,
        phone: updatedUser.phone,
        dob: updatedUser.dob,
        age: updatedUser.age,
        completedVideos: updatedUser.completedVideos || []
      } 
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ==========================================
// NEW: Toggle Student Video Progress
// ==========================================
router.post('/progress/:id', async (req, res) => {
  try {
    const { lectureId } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Toggle logic: If the video is already marked done, un-mark it. Otherwise, mark it.
    if (user.completedVideos.includes(lectureId)) {
      user.completedVideos = user.completedVideos.filter(id => id !== lectureId);
    } else {
      user.completedVideos.push(lectureId);
    }

    await user.save();
    res.json({ message: "Progress updated successfully", completedVideos: user.completedVideos });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;