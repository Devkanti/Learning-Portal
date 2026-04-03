const express = require('express');
const User = require('../models/User');
const Course = require('../models/Course');
const Submission = require('../models/Submission');
const router = express.Router();

// Get all users (except other admins)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } });
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete a user (De-register)
router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Submission.deleteMany({ studentId: req.params.id }); // Removes them from grading
    res.json({ message: 'User removed successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get all courses with their teacher's name
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find().populate('teacherId', 'name');
    res.json(courses);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete a course
router.delete('/courses/:id', async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;