const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// GET all institutes (for students - only approved ones) - PUBLIC
router.get('/', async (req, res) => {
  try {
    const { status, forStudents } = req.query;
    let query = db.collection('institutions');

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

// GET single institute by ID - PUBLIC
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('institutions').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Institute not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error fetching institute:', error);
    res.status(500).json({ error: 'Failed to fetch institute' });
  }
});

// CREATE new institute - PROTECTED
router.post('/', async (req, res) => {
  try {
    const userId = req.user.uid; // From auth middleware
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

    // Validate required fields
    if (!name || !email || !type || !location) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['name', 'email', 'type', 'location']
      });
    }

    // Check if user already has an institution
    const existingUserInstitution = await db.collection('institutions')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (!existingUserInstitution.empty) {
      return res.status(400).json({ 
        error: 'You already have an institution registered' 
      });
    }

    // Check if email already exists
    const existingEmail = await db.collection('institutions')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingEmail.empty) {
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
      userId, // Link to creator
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

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

// UPDATE institute by ID - PROTECTED (only owner or admin)
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.uid;
    const instituteId = req.params.id;

    // Verify ownership or admin rights
    const instituteDoc = await db.collection('institutions').doc(instituteId).get();
    if (!instituteDoc.exists) {
      return res.status(404).json({ error: 'Institute not found' });
    }

    const institute = instituteDoc.data();
    if (institute.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this institution' });
    }

    const updateData = { 
      ...req.body, 
      updatedAt: new Date().toISOString() 
    };
    
    await db.collection('institutions').doc(instituteId).update(updateData);
    
    res.json({ message: 'Institute updated successfully' });
  } catch (error) {
    console.error('Error updating institute:', error);
    res.status(500).json({ error: 'Failed to update institute' });
  }
});

// DELETE institute by ID - PROTECTED (only owner or admin)
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.uid;
    const instituteId = req.params.id;

    // Verify ownership or admin rights
    const instituteDoc = await db.collection('institutions').doc(instituteId).get();
    if (!instituteDoc.exists) {
      return res.status(404).json({ error: 'Institute not found' });
    }

    const institute = instituteDoc.data();
    if (institute.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this institution' });
    }

    await db.collection('institutions').doc(instituteId).delete();
    res.json({ message: 'Institute deleted successfully' });
  } catch (error) {
    console.error('Error deleting institute:', error);
    res.status(500).json({ error: 'Failed to delete institute' });
  }
});

// APPROVE institute - ADMIN ONLY
router.post('/:id/approve', async (req, res) => {
  try {
    const instituteId = req.params.id;
    
    const instituteDoc = await db.collection('institutions').doc(instituteId).get();
    if (!instituteDoc.exists) {
      return res.status(404).json({ error: 'Institute not found' });
    }

    await db.collection('institutions').doc(instituteId).update({
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
    console.error('Error approving institute:', error);
    res.status(500).json({ error: 'Failed to approve institute' });
  }
});

// REJECT institute - ADMIN ONLY
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

// GET institutes for students (only approved ones) - PUBLIC
router.get('/public/approved', async (req, res) => {
  try {
    const snapshot = await db.collection('institutions')
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

// ✅ INSTITUTE DASHBOARD ROUTES - USER SPECIFIC

// Get current user's institute profile
router.get('/profile/me', async (req, res) => {
  try {
    const userId = req.user.uid;
    
    const snapshot = await db.collection('institutions')
      .where('userId', '==', userId)
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

// Get current user's institute stats
router.get('/stats/me', async (req, res) => {
  try {
    const userId = req.user.uid;
    
    const snapshot = await db.collection('institutions')
      .where('userId', '==', userId)
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
      ).length,
      admissionRate: applicationsSnapshot.size > 0 ? 
        Math.round((applicationsSnapshot.docs.filter(doc => 
          doc.data().status === 'approved'
        ).length / applicationsSnapshot.size) * 100) : 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching institute stats:', error);
    res.status(500).json({ error: 'Failed to fetch institute stats' });
  }
});

// Get current user's institute courses
router.get('/courses/me', async (req, res) => {
  try {
    const userId = req.user.uid;
    
    const snapshot = await db.collection('institutions')
      .where('userId', '==', userId)
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

module.exports = router;
