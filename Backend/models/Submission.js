const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  // NEW: Submission now links to a SPECIFIC Lecture
  lectureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course.lectures', required: true },
  fileUrl: { type: String, required: true },
  grade: { type: Number, default: null },
  feedback: { type: String, default: null }
}, { 
  timestamps: true,
  toJSON: { virtuals: true }
});

module.exports = mongoose.model('Submission', submissionSchema);