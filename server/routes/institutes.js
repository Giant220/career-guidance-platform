console.log('✅ institutes.js loaded on Render deployment');

const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// Test route to verify institutes routes are working
router.get('/render-test', (req, res) => {
  console.log('✅ /api/institutes/render-test route hit on Render');
  res.json({ 
    message: 'Institute routes are working on Render!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Debug route to check user institute relationship
router.get('/debug-auth', async (req, res) => {
  try {
    console.log('🔍 /api/institutes/debug-auth hit on Render');
    console.log('🔍 User from auth:', req.user);
    
    if (!req.user) {
      return res.status(401).json({ error: 'No user in request - auth middleware issue' });
    }

    res.json({ 
      user: {
        uid: req.user.uid,
        email: req.user.email
      },
      message: 'Auth is working on Render',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Debug auth error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET all institutes (for students - only approved ones)
router.get('/', async (req, res) => {
  try {
    console.log('🔄 GET /api/institutes on Render');
    const { status, forStudents } = req.query;
    let query = db.collection('institutes');

    if (forStudents === 'true') {
      query = query.where('status', '==', 'approved');
    } else if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const institutes = [];
    
    snapshot.forEach(doc => {
      institutes.push({ 
        id: doc.id, 
        ...doc.data() 
      });
    });
    
    console.log(`✅ Found ${institutes.length} institutes on Render`);
    res.json(institutes);
  } catch (error) {
    console.error('❌ Error fetching institutes on Render:', error);
    res.status(500).json({ error: 'Failed to fetch institutes' });
  }
});

// GET single institute by ID
router.get('/:id', async (req, res) => {
  try {
    console.log(`🔄 GET /api/institutes/${req.params.id} on Render`);
    const doc = await db.collection('institutes').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Institute not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('❌ Error fetching institute on Render:', error);
    res.status(500).json({ error: 'Failed to fetch institute' });
  }
});

// CREATE new institute
router.post('/', async (req, res) => {
  try {
    console.log('🔄 POST /api/institutes on Render');
    const {
      name,
      type,
      email,
      phone,
      location,
      website,
      established,
      description,
      userId
    } = req.body;

    const instituteData = {
      name,
      type,
      email,
      phone: phone || '',
      location,
      website: website || '',
      established: established || '',
      description: description || '',
      userId: userId || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection('institutes').add(instituteData);

    res.status(201).json({ 
      id: docRef.id, 
      ...instituteData,
      message: 'Institute created successfully. Waiting for admin approval.' 
    });
  } catch (error) {
    console.error('❌ Error creating institute on Render:', error);
    res.status(500).json({ error: 'Failed to create institute' });
  }
});

// UPDATE institute by ID
router.put('/:id', async (req, res) => {
  try {
    console.log(`🔄 PUT /api/institutes/${req.params.id} on Render`);
    const updateData = { 
      ...req.body, 
      updatedAt: new Date().toISOString() 
    };
    
    await db.collection('institutes').doc(req.params.id).update(updateData);
    
    res.json({ message: 'Institute updated successfully' });
  } catch (error) {
    console.error('❌ Error updating institute on Render:', error);
    res.status(500).json({ error: 'Failed to update institute' });
  }
});

// DELETE institute by ID
router.delete('/:id', async (req, res) => {
  try {
    console.log(`🔄 DELETE /api/institutes/${req.params.id} on Render`);
    await db.collection('institutes').doc(req.params.id).delete();
    res.json({ message: 'Institute deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting institute on Render:', error);
    res.status(500).json({ error: 'Failed to delete institute' });
  }
});

// APPROVE institute
router.post('/:id/approve', async (req, res) => {
  try {
    console.log(`🔄 POST /api/institutes/${req.params.id}/approve on Render`);
    const instituteId = req.params.id;
    
    const instituteDoc = await db.collection('institutes').doc(instituteId).get();
    if (!instituteDoc.exists) {
      return res.status(404).json({ error: 'Institute not found' });
    }

    await db.collection('institutes').doc(instituteId).update({
      status: 'approved',
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const coursesSnapshot = await db.collection('courses')
      .where('institutionId', '==', instituteId)
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
      message: 'Institute approved successfully. Courses are now visible to students.',
      coursesUpdated: coursesSnapshot.size
    });
  } catch (error) {
    console.error('❌ Error approving institute on Render:', error);
    res.status(500).json({ error: 'Failed to approve institute' });
  }
});

// REJECT institute
router.post('/:id/reject', async (req, res) => {
  try {
    console.log(`🔄 POST /api/institutes/${req.params.id}/reject on Render`);
    const instituteId = req.params.id;
    const { reason } = req.body;

    await db.collection('institutes').doc(instituteId).update({
      status: 'rejected',
      rejectionReason: reason || '',
      rejectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      message: 'Institute rejected successfully' 
    });
  } catch (error) {
    console.error('❌ Error rejecting institute on Render:', error);
    res.status(500).json({ error: 'Failed to reject institute' });
  }
});

// GET institutes for students (only approved ones)
router.get('/public/approved', async (req, res) => {
  try {
    console.log('🔄 GET /api/institutes/public/approved on Render');
    const snapshot = await db.collection('institutes')
      .where('status', '==', 'approved')
      .orderBy('name')
      .get();
    
    const institutes = [];
    snapshot.forEach(doc => {
      institutes.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(institutes);
  } catch (error) {
    console.error('❌ Error fetching approved institutes on Render:', error);
    res.status(500).json({ error: 'Failed to fetch institutes' });
  }
});

// ✅ CRITICAL: Get current user's institute profile
router.get('/profile/me', async (req, res) => {
  try {
    console.log('🔄 GET /api/institutes/profile/me on Render');
    console.log('🔍 User ID:', req.user?.uid);
    console.log('🔍 User email:', req.user?.email);
    
    const userId = req.user.uid;
    
    const snapshot = await db.collection('institutes')
      .where('userId', '==', userId)
      .limit(1)
      .get();
    
    console.log('🔍 Found institutes for user:', snapshot.size);
    
    if (snapshot.empty) {
      console.log('❌ No institute found for user:', userId);
      return res.status(404).json({ 
        error: 'No institute profile found',
        message: 'Please complete your institution registration first.'
      });
    }

    const instituteDoc = snapshot.docs[0];
    const institute = instituteDoc.data();
    
    console.log('✅ Found institute:', instituteDoc.id);
    
    res.json({
      id: instituteDoc.id,
      ...institute
    });
  } catch (error) {
    console.error('❌ Error fetching institute profile on Render:', error);
    res.status(500).json({ error: 'Failed to fetch institute profile' });
  }
});

// ✅ CRITICAL: Get current user's institute stats
router.get('/stats/me', async (req, res) => {
  try {
    console.log('🔄 GET /api/institutes/stats/me on Render');
    const userId = req.user.uid;
    
    const snapshot = await db.collection('institutes')
      .where('userId', '==', userId)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return res.status(404).json({ error: 'No institute found' });
    }

    const instituteId = snapshot.docs[0].id;

    // Get courses count
    const coursesSnapshot = await db.collection('courses')
      .where('institutionId', '==', instituteId)
      .get();

    // Get applications count
    const applicationsSnapshot = await db.collection('applications')
      .where('institutionId', '==', instituteId)
      .get();

    // Get unique students
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
      ).length,
      admissionRate: applicationsSnapshot.size > 0 ? 
        Math.round((applicationsSnapshot.docs.filter(doc => 
          doc.data().status === 'approved'
        ).length / applicationsSnapshot.size) * 100) : 0
    };

    console.log('✅ Stats calculated for institute:', instituteId);
    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching institute stats on Render:', error);
    res.status(500).json({ error: 'Failed to fetch institute stats' });
  }
});

// ✅ CRITICAL: Get current user's institute courses
router.get('/courses/me', async (req, res) => {
  try {
    console.log('🔄 GET /api/institutes/courses/me on Render');
    const userId = req.user.uid;
    
    const snapshot = await db.collection('institutes')
      .where('userId', '==', userId)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return res.status(404).json({ error: 'No institute found' });
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

    console.log(`✅ Found ${courses.length} courses for institute`);
    res.json(courses);
  } catch (error) {
    console.error('❌ Error fetching institute courses on Render:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

console.log('✅ All institute routes registered on Render');

module.exports = router;
