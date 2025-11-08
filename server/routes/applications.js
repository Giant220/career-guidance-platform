const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// Submit course application
router.post('/', async (req, res) => {
  try {
    const { studentId, courseId, institutionId, courseName } = req.body;

    // Check if student has already applied to 2 courses at this institution
    const existingApplications = await db.collection('applications')
      .where('studentId', '==', studentId)
      .where('institutionId', '==', institutionId)
      .where('status', 'in', ['pending', 'admitted'])
      .get();

    if (existingApplications.size >= 2) {
      return res.status(400).json({ 
        error: 'You have already applied to 2 courses at this institution' 
      });
    }

    // Check if already applied to this course
    const existingCourseApp = await db.collection('applications')
      .where('studentId', '==', studentId)
      .where('courseId', '==', courseId)
      .where('status', 'in', ['pending', 'admitted'])
      .get();

    if (!existingCourseApp.empty) {
      return res.status(400).json({ 
        error: 'You have already applied to this course' 
      });
    }

    const applicationData = {
      studentId,
      courseId,
      institutionId,
      courseName,
      status: 'pending',
      applicationDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('applications').add(applicationData);

    res.json({ 
      success: true, 
      message: 'Application submitted successfully',
      applicationId: docRef.id 
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;