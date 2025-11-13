const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// GET applications for institute
router.get('/', async (req, res) => {
  try {
    const { instituteId, status } = req.query;
    
    console.log('🔍 GET /api/applications - instituteId:', instituteId);
    
    if (!instituteId) {
      return res.status(400).json({ error: 'instituteId is required' });
    }

    let query = db.collection('applications')
      .where('instituteId', '==', instituteId);

    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.orderBy('applicationDate', 'desc').get();
    const applications = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      applications.push({
        id: doc.id,
        studentName: data.studentName || 'Unknown Student',
        studentEmail: data.studentEmail || 'No email',
        courseName: data.courseName || 'Unknown Course',
        courseId: data.courseId,
        instituteId: data.instituteId,
        status: data.status || 'pending',
        applicationDate: data.applicationDate || data.createdAt,
        ...data
      });
    });

    console.log(`✅ Found ${applications.length} applications for institute ${instituteId}`);
    res.json(applications);

  } catch (error) {
    console.error('❌ Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// GET single application
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('applications').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// UPDATE application status
router.put('/:id', async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    
    const updateData = {
      status,
      updatedAt: new Date().toISOString()
    };

    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    if (status === 'admitted') {
      updateData.admissionDate = new Date().toISOString();
    } else if (status === 'rejected') {
      updateData.decisionDate = new Date().toISOString();
    }

    await db.collection('applications').doc(req.params.id).update(updateData);

    res.json({ 
      message: 'Application status updated successfully',
      status: status 
    });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// UPDATE application status (alternative endpoint)
router.put('/:id/status', async (req, res) => {
  try {
    const { status, decisionNotes } = req.body;
    
    const updateData = {
      status,
      updatedAt: new Date().toISOString()
    };

    if (decisionNotes) {
      updateData.decisionNotes = decisionNotes;
    }

    if (status === 'admitted') {
      updateData.admissionDate = new Date().toISOString();
    }

    await db.collection('applications').doc(req.params.id).update(updateData);

    res.json({ message: 'Application status updated successfully' });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// Submit course application (for students)
router.post('/', async (req, res) => {
  try {
    const { studentId, courseId, instituteId, courseName, studentName, studentEmail } = req.body;

    // Check if student has already applied to 2 courses at this institution
    const existingApplications = await db.collection('applications')
      .where('studentId', '==', studentId)
      .where('instituteId', '==', instituteId)
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
      instituteId,
      courseName,
      studentName: studentName || 'Unknown Student',
      studentEmail: studentEmail || 'No email',
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

// Get applications for student
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const snapshot = await db.collection('applications')
      .where('studentId', '==', studentId)
      .orderBy('applicationDate', 'desc')
      .get();
    
    const applications = [];
    snapshot.forEach(doc => {
      applications.push({ id: doc.id, ...doc.data() });
    });

    res.json(applications);
  } catch (error) {
    console.error('Error fetching student applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

module.exports = router;
