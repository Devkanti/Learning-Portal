const express = require('express');
const multer = require('multer');
const Course = require('../models/Course');
const Submission = require('../models/Submission');
const User = require('../models/User'); // NEW: Added User model to fetch registered students

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/'); },
  filename: (req, file, cb) => { cb(null, Date.now() + '-' + file.originalname); }
});
const upload = multer({ storage });

router.get('/', async (req, res) => {
  try { res.json(await Course.find()); } catch (error) { res.status(500).json({ message: "Error" }); }
});

router.post('/', upload.fields([
  { name: 'poster', maxCount: 1 },
  { name: 'video', maxCount: 1 }, 
  { name: 'assessment', maxCount: 1 } 
]), async (req, res) => {
  try {
    const { title, description, teacherId, videoTitle, deadline } = req.body;
    const posterUrl = req.files && req.files['poster'] ? req.files['poster'][0].path : null;
    const assignmentFile = req.files && req.files['assessment'] ? req.files['assessment'][0].path : null;
    
    const lectures = [];
    if (req.files && req.files['video']) {
      lectures.push({
        title: videoTitle || 'Lecture 1',
        videoUrl: req.files['video'][0].path,
        assignmentPrompt: assignmentFile, 
        assignmentDeadline: deadline || null 
      });
    }
    
    const newCourse = await Course.create({ title, description, teacherId, posterUrl, lectures });
    res.status(201).json({ message: "Course created!", course: newCourse });
  } catch (error) { res.status(500).json({ message: "Error", error: error.message }); }
});

router.post('/:courseId/lectures', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'assessment', maxCount: 1 } 
]), async (req, res) => {
  try {
    const { title, deadline } = req.body;
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Not found" });

    const videoFile = req.files && req.files['video'] ? req.files['video'][0].path : null;
    const assessmentFile = req.files && req.files['assessment'] ? req.files['assessment'][0].path : null;

    if(!videoFile) return res.status(400).json({ message: "Video is required" });

    course.lectures.push({ 
      title, 
      videoUrl: videoFile,
      assignmentPrompt: assessmentFile, 
      assignmentDeadline: deadline || null 
    });
    await course.save();

    res.json({ message: "Lecture added successfully!", course });
  } catch (error) { res.status(500).json({ message: "Error", error: error.message }); }
});

router.post('/:courseId/submit', upload.single('file'), async (req, res) => {
  try {
    const { studentId, lectureId } = req.body; 
    if(!req.file) return res.status(400).json({ message: "File required" });

    const newSubmission = await Submission.create({ 
      studentId, 
      courseId: req.params.courseId, 
      lectureId, 
      fileUrl: req.file.path 
    });
    res.status(201).json({ message: "Submitted successfully!", submission: newSubmission });
  } catch (error) { res.status(500).json({ message: "Error", error: error.message }); }
});


// =========================================================================
// FIX: "SMART" TEACHER FETCH SUBMISSIONS (Generates Ghost Submissions)
// =========================================================================
router.get('/teacher/:teacherId/submissions', async (req, res) => {
  try {
    // 1. Fetch Teacher's Courses
    const courses = await Course.find({ teacherId: req.params.teacherId });
    const courseIds = courses.map(c => c.id);
    
    // 2. Fetch ALL Students 
    const students = await User.find({ role: 'student' });
    
    // 3. Fetch all existing real submissions for these courses
    const realSubmissions = await Submission.find({ courseId: { $in: courseIds } });
      
    const formatted = [];

    // 4. Cross-reference loop: Generate table rows for EVERY student + EVERY assignment
    courses.forEach(course => {
      course.lectures.forEach(lecture => {
        if (lecture.assignmentPrompt) { // Only do this if the lecture actually requires an assignment
          
          students.forEach(student => {
            // Did this specific student submit this specific assignment?
            const existingSub = realSubmissions.find(s => 
              s.studentId && s.studentId.toString() === student._id.toString() && 
              s.lectureId.toString() === (lecture._id || lecture.id).toString()
            );

            if (existingSub) {
              // They submitted it! Return the real data.
              formatted.push({
                id: existingSub._id,
                fileUrl: existingSub.fileUrl,
                grade: existingSub.grade,
                feedback: existingSub.feedback,
                User: { name: student.name, id: student._id },
                Course: { title: course.title, id: course._id },
                Lecture: { title: lecture.title, id: lecture._id || lecture.id } 
              });
            } else {
              // They DID NOT submit it! Return a "Ghost Submission" for the UI
              formatted.push({
                id: `missing-${course._id}-${lecture._id || lecture.id}-${student._id}`, // Fake ID for React
                fileUrl: null, // Tells UI it's missing
                grade: null,
                feedback: null,
                User: { name: student.name, id: student._id },
                Course: { title: course.title, id: course._id },
                Lecture: { title: lecture.title, id: lecture._id || lecture.id } 
              });
            }
          });
        }
      });
    });

    res.json(formatted);
  } catch (error) { res.status(500).json({ message: "Error", error: error.message }); }
});


router.get('/student/:studentId/submissions', async (req, res) => {
  try {
    const submissions = await Submission.find({ studentId: req.params.studentId })
      .populate('courseId')
      .sort({ createdAt: -1 });

    const formatted = submissions.map(sub => {
      const targetLecture = sub.courseId ? sub.courseId.lectures.id(sub.lectureId) : null;
      return {
        id: sub.id, fileUrl: sub.fileUrl, grade: sub.grade, feedback: sub.feedback,
        Course: { title: sub.courseId ? sub.courseId.title : 'Unknown Course' }, 
        Lecture: { title: targetLecture ? targetLecture.title : 'Deleted Video' }, 
        createdAt: sub.createdAt
      }
    });
    res.json(formatted);
  } catch (error) { res.status(500).json({ message: "Error", error: error.message }); }
});

// =========================================================================
// FIX: UNIFIED GRADING ROUTE (Handles both real and ghost submissions)
// =========================================================================
router.post('/grade', async (req, res) => {
  try {
    const { submissionId, studentId, courseId, lectureId, grade, feedback } = req.body;
    let submission;

    // Check if this is a real submission or a Ghost Submission starting with "missing-"
    if (submissionId && !submissionId.toString().startsWith('missing-')) {
      // It's real! Update the existing document.
      submission = await Submission.findById(submissionId);
      if (!submission) return res.status(404).json({ message: "Not found" });
    } else {
      // It's a missing assignment! Create an empty shell document just to hold the grade.
      submission = new Submission({
        studentId,
        courseId,
        lectureId,
        fileUrl: '' // Empty string so we know they never uploaded the file
      });
    }

    submission.grade = grade;
    submission.feedback = feedback; 
    await submission.save();
    
    res.json({ message: "Graded successfully", submission });
  } catch (error) { res.status(500).json({ message: "Error", error: error.message }); }
});


router.delete('/:courseId/lectures/:lectureId', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const initialLength = course.lectures.length;
    course.lectures = course.lectures.filter(
      (lec) => (lec._id || lec.id).toString() !== req.params.lectureId
    );

    if (course.lectures.length === initialLength) {
        return res.status(404).json({ message: "Lecture not found in this course" });
    }

    await course.save();
    res.json({ message: "Lecture deleted successfully", course });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    const deletedCourse = await Course.findByIdAndDelete(req.params.id);
    if (!deletedCourse) return res.status(404).json({ message: "Course not found" });
    
    res.json({ message: "Course deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;