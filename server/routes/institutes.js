const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// Create new institution - FIXED: Ensure status is 'pending'
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      type,
      location,
      phone,
      description,
      userId
    } = req.body;

    // Validate required fields
    if (!name || !email || !type || !location || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const institutionData = {
      name,
      email,
      type,
      location,
      phone: phone || '',
      description: description || '',
      userId,
      status: 'pending', // FIXED: Always start as pending
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Check if institution already exists with this email or userId
    const existingSnapshot = await db.collection('institutions')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      return res.status(400).json({ error: 'Institution with this email already exists' });
    }

    const docRef = await db.collection('institutions').add(institutionData);

    res.json({
      success: true,
      message: 'Institution registered successfully! Waiting for admin approval.',
      institutionId: docRef.id,
      status: 'pending'
    });
  } catch (error) {
    console.error('Error creating institution:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get institute profile
router.get('/profile', async (req, res) => {
  try {
    // For now, get the first institution - you'll need to implement proper auth
    const snapshot = await db.collection('institutions').limit(1).get();
    
    if (snapshot.empty) {
      return res.status(404).json({ error: 'No institutions found' });
    }

    const instituteDoc = snapshot.docs[0];
    const institute = instituteDoc.data();

    res.json({
      id: instituteDoc.id,
      ...institute
    });
  } catch (error) {
    console.error('Error fetching institute profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get institute stats
router.get('/stats', async (req, res) => {
  try {
    // Get the first institution
    const snapshot = await db.collection('institutions').limit(1).get();
    
    if (snapshot.empty) {
      return res.status(404).json({ error: 'No institutions found' });
    }

    const instituteId = snapshot.docs[0].id;

    // Get course count
    const coursesSnapshot = await db.collection('courses')
      .where('institutionId', '==', instituteId)
      .get();

    // Get application count
    const applicationsSnapshot = await db.collection('applications')
      .where('institutionId', '==', instituteId)
      .get();

    // Get student count (unique students who applied)
    const studentIds = new Set();
    applicationsSnapshot.forEach(doc => {
      studentIds.add(doc.data().studentId);
    });

    res.json({
      totalCourses: coursesSnapshot.size,
      totalApplications: applicationsSnapshot.size,
      totalStudents: studentIds.size,
      pendingApplications: applicationsSnapshot.docs.filter(doc => 
        doc.data().status === 'pending'
      ).length
    });
  } catch (error) {
    console.error('Error fetching institute stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get institute courses
router.get('/courses', async (req, res) => {
  try {
    // Get the first institution
    const snapshot = await db.collection('institutions').limit(1).get();
    
    if (snapshot.empty) {
      return res.status(404).json({ error: 'No institutions found' });
    }

    const instituteId = snapshot.docs[0].id;

    const coursesSnapshot = await db.collection('courses')
      .where('institutionId', '==', instituteId)
      .get();

    const courses = [];
    coursesSnapshot.forEach(doc => {
      courses.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json(courses);
  } catch (error) {
    console.error('Error fetching institute courses:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
