const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// GET all institutes (for students - only approved ones)
router.get('/', async (req, res) => {
  try {
    const { status, forStudents } = req.query;
    let query = db.collection('institutions'); // Use consistent collection name

    // CRITICAL FIX: If forStudents=true, only show approved institutes
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
    
    res.json(institutes);
  } catch (error) {
    console.error('Error fetching institutes:', error);
    res.status(500).json({ error: 'Failed to fetch institutes' });
  }
});

// GET single institute by ID
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('institutions').doc(req.params.id).get(); // Use consistent collection
    if (!doc.exists) {
      return res.status(404).json({ error: 'Institute not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error fetching institute:', error);
    res.status(500).json({ error: 'Failed to fetch institute' });
  }
});

// CREATE new institute
router.post('/', async (req, res) => {
  try {
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

    // Use consistent collection name
    const institutionData = {
      name,
      type,
      email,
      phone: phone || '',
      location,
      website: website || '',
      established: established || '',
      description: description || '',
      userId: userId || '',
      status: 'pending', // Always start as pending
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Let Firestore auto-generate ID for consistency
    const docRef = await db.collection('institutions').add(institutionData);

    res.status(201).json({ 
      id: docRef.id,
      ...institutionData,
      message: 'Institute created successfully. Waiting for admin approval.' 
    });
  } catch (error) {
    console.error('Error creating institute:', error);
    res.status(500).json({ error: 'Failed to create institute' });
  }
});

// UPDATE institute by ID
router.put('/:id', async (req, res) => {
  try {
    const updateData = { 
      ...req.body, 
      updatedAt: new Date().toISOString() 
    };
    
    await db.collection('institutions').doc(req.params.id).update(updateData); // Use consistent collection
    
    res.json({ message: 'Institute updated successfully' });
  } catch (error) {
    console.error('Error updating institute:', error);
    res.status(500).json({ error: 'Failed to update institute' });
  }
});

// DELETE institute by ID
router.delete('/:id', async (req, res) => {
  try {
    await db.collection('institutions').doc(req.params.id).delete(); // Use consistent collection
    res.json({ message: 'Institute deleted successfully' });
  } catch (error) {
    console.error('Error deleting institute:', error);
    res.status(500).json({ error: 'Failed to delete institute' });
  }
});

// APPROVE institute
router.post('/:id/approve', async (req, res) => {
  try {
    const instituteId = req.params.id;
    
    // Verify institute exists - use consistent collection
    const instituteDoc = await db.collection('institutions').doc(instituteId).get();
    if (!instituteDoc.exists) {
      return res.status(404).json({ error: 'Institute not found' });
    }

    // Update status to approved
    await db.collection('institutions').doc(instituteId).update({
      status: 'approved',
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Also update all courses from this institute to be visible
    const coursesSnapshot = await db.collection('courses')
      .where('institutionId', '==', instituteId)
      .get();

    const batch = db.batch();
    coursesSnapshot.forEach(doc => {
      batch.update(doc.ref, {
        status: 'active', // Make courses active
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
    console.error('Error approving institute:', error);
    res.status(500).json({ error: 'Failed to approve institute' });
  }
});

// REJECT institute
router.post('/:id/reject', async (req, res) => {
  try {
    const instituteId = req.params.id;
    const { reason } = req.body;

    await db.collection('institutions').doc(instituteId).update({
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
    console.error('Error rejecting institute:', error);
    res.status(500).json({ error: 'Failed to reject institute' });
  }
});

// GET institutes for students (only approved ones)
router.get('/public/approved', async (req, res) => {
  try {
    const snapshot = await db.collection('institutions') // Use consistent collection
      .where('status', '==', 'approved')
      .orderBy('name')
      .get();
    
    const institutes = [];
    snapshot.forEach(doc => {
      institutes.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(institutes);
  } catch (error) {
    console.error('Error fetching approved institutes:', error);
    res.status(500).json({ error: 'Failed to fetch institutes' });
  }
});

// ✅ CRITICAL: INSTITUTE DASHBOARD ENDPOINTS

// Get institute profile for dashboard
router.get('/profile', async (req, res) => {
  try {
    const snapshot = await db.collection('institutions')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return res.status(404).json({ 
        error: 'No institution profile found',
        message: 'Please complete your institution registration first.'
      });
    }

    const instituteDoc = snapshot.docs[0];
    const institute = instituteDoc.data();

    res.json({
      id: instituteDoc.id,
      ...institute
    });
  } catch (error) {
    console.error('Error fetching institute profile:', error);
    res.status(500).json({ error: 'Failed to fetch institute profile' });
  }
});

// Get institute stats for dashboard
router.get('/stats', async (req, res) => {
  try {
    const snapshot = await db.collection('institutions')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return res.status(404).json({ error: 'No institution found' });
    }

    const instituteId = snapshot.docs[0].id;

    const coursesSnapshot = await db.collection('courses')
      .where('institutionId', '==', instituteId)
      .get();

    const applicationsSnapshot = await db.collection('applications')
      .where('institutionId', '==', instituteId)
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
    console.error('Error fetching institute stats:', error);
    res.status(500).json({ error: 'Failed to fetch institute stats' });
  }
});

// Get institute courses for dashboard
router.get('/courses', async (req, res) => {
  try {
    const snapshot = await db.collection('institutions')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return res.status(404).json({ error: 'No institution found' });
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
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Health check for institute routes
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Institute routes are working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
