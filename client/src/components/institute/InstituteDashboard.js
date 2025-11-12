const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();
const auth = require('../middleware/auth');

const INSTITUTIONS_COLLECTION = 'institutions';

// Apply auth middleware to all routes
router.use(auth);

// GET institution profile for current user
router.get('/profile/me', async (req, res) => {
  try {
    const userId = req.user.uid;
    
    const snapshot = await db.collection(INSTITUTIONS_COLLECTION)
      .where('userId', '==', userId)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return res.status(404).json({ 
        error: 'Institution not found',
        message: 'Please complete your institution registration.'
      });
    }

    const institutionDoc = snapshot.docs[0];
    const institution = institutionDoc.data();

    res.json({
      id: institutionDoc.id,
      ...institution
    });
  } catch (error) {
    console.error('Error fetching institution profile:', error);
    res.status(500).json({ error: 'Failed to fetch institution profile' });
  }
});

// GET institution stats for current user
router.get('/stats/me', async (req, res) => {
  try {
    const userId = req.user.uid;
    
    const snapshot = await db.collection(INSTITUTIONS_COLLECTION)
      .where('userId', '==', userId)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    const institutionId = snapshot.docs[0].id;

    const coursesSnapshot = await db.collection('courses')
      .where('institutionId', '==', institutionId)
      .get();

    const applicationsSnapshot = await db.collection('applications')
      .where('institutionId', '==', institutionId)
      .get();

    const studentIds = new Set();
    applicationsSnapshot.forEach(doc => {
      const application = doc.data();
      if (application.studentId) {
        studentIds.add(application.studentId);
      }
    });

    const stats = {
      totalCourses: coursesSnapshot.size,
      totalApplications: applicationsSnapshot.size,
      totalStudents: studentIds.size,
      pendingApplications: applicationsSnapshot.docs.filter(doc => 
        doc.data().status === 'pending'
      ).length
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching institution stats:', error);
    res.status(500).json({ error: 'Failed to fetch institution stats' });
  }
});

// GET institution courses for current user
router.get('/courses/me', async (req, res) => {
  try {
    const userId = req.user.uid;
    
    const snapshot = await db.collection(INSTITUTIONS_COLLECTION)
      .where('userId', '==', userId)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    const institutionId = snapshot.docs[0].id;

    const coursesSnapshot = await db.collection('courses')
      .where('institutionId', '==', institutionId)
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
    console.error('Error fetching institution courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// CREATE new institution
router.post('/', async (req, res) => {
  try {
    const userId = req.user.uid;
    const {
      name,
      type,
      email,
      phone,
      location,
      website,
      established,
      description
    } = req.body;

    if (!name || !email || !type || !location) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['name', 'email', 'type', 'location']
      });
    }

    const existingSnapshot = await db.collection(INSTITUTIONS_COLLECTION)
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      return res.status(400).json({ 
        error: 'Institution with this email already exists' 
      });
    }

    const institutionData = {
      name,
      type,
      email,
      phone: phone || '',
      location,
      website: website || '',
      established: established || '',
      description: description || '',
      userId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection(INSTITUTIONS_COLLECTION).add(institutionData);

    res.status(201).json({
      success: true,
      id: docRef.id,
      message: 'Institution registered successfully. Waiting for admin approval.',
      status: 'pending'
    });
  } catch (error) {
    console.error('Error creating institution:', error);
    res.status(500).json({ error: 'Failed to create institution' });
  }
});

// GET all institutions (admin only)
router.get('/', async (req, res) => {
  try {
    const { status, forStudents } = req.query;
    let query = db.collection(INSTITUTIONS_COLLECTION);

    if (forStudents === 'true') {
      query = query.where('status', '==', 'approved');
    } else if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const institutions = [];
    
    for (const doc of snapshot.docs) {
      const institution = doc.data();
      
      const coursesSnapshot = await db.collection('courses')
        .where('institutionId', '==', doc.id)
        .get();

      const applicationsSnapshot = await db.collection('applications')
        .where('institutionId', '==', doc.id)
        .get();

      institutions.push({
        id: doc.id,
        ...institution,
        courseCount: coursesSnapshot.size,
        applicationCount: applicationsSnapshot.size,
        studentCount: new Set(applicationsSnapshot.docs.map(d => d.data().studentId)).size
      });
    }
    
    res.json(institutions);
  } catch (error) {
    console.error('Error fetching institutions:', error);
    res.status(500).json({ error: 'Failed to fetch institutions' });
  }
});

// APPROVE institution (admin only)
router.post('/:id/approve', async (req, res) => {
  try {
    const institutionId = req.params.id;
    
    const institutionDoc = await db.collection(INSTITUTIONS_COLLECTION).doc(institutionId).get();
    if (!institutionDoc.exists) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    await db.collection(INSTITUTIONS_COLLECTION).doc(institutionId).update({
      status: 'approved',
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const coursesSnapshot = await db.collection('courses')
      .where('institutionId', '==', institutionId)
      .get();

    const batch = db.batch();
    coursesSnapshot.forEach(doc => {
      batch.update(doc.ref, {
        status: 'active',
        updatedAt: new Date().toISOString()
      });
    });

    if (coursesSnapshot.size > 0) {
      await batch.commit();
    }

    res.json({ 
      success: true, 
      message: 'Institution approved successfully.',
      coursesUpdated: coursesSnapshot.size
    });
  } catch (error) {
    console.error('Error approving institution:', error);
    res.status(500).json({ error: 'Failed to approve institution' });
  }
});

// REJECT institution (admin only)
router.post('/:id/reject', async (req, res) => {
  try {
    const institutionId = req.params.id;
    const { reason } = req.body;

    await db.collection(INSTITUTIONS_COLLECTION).doc(institutionId).update({
      status: 'rejected',
      rejectionReason: reason || '',
      rejectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      message: 'Institution rejected successfully' 
    });
  } catch (error) {
    console.error('Error rejecting institution:', error);
    res.status(500).json({ error: 'Failed to reject institution' });
  }
});

module.exports = router;
