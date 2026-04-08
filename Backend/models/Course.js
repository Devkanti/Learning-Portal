const mongoose = require('mongoose');

// NEW: Lectures now contain their own video, assessment prompt, and deadline
const lectureSchema = new mongoose.Schema({
  title: { type: String, required: true },
  videoUrl: { type: String, required: true },
  // Optional Assessment for THIS lecture
  assignmentPrompt: { type: String, default: null }, 
  assignmentDeadline: { type: Date, default: null }  
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  posterUrl: { type: String },
  lectures: [lectureSchema], // Array of the new lecture structure
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { 
  timestamps: true,
  toJSON: { virtuals: true }
});

module.exports = mongoose.model('Course', courseSchema);