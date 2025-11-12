const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// GET all institutes (for students - only approved ones)
router.get('/', async (req, res) => {
  try {
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
    
    res.json(institutes);
  } catch (error) {
    console.error('Error fetching institutes:', error);
    res.status(500).json({ error: 'Failed to fetch institutes' });
  }
});

// GET single institute by ID
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('institutes').doc(req.params.id).get();
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
    
    await db.collection('institutes').doc(req.params.id).update(updateData);
    
    res.json({ message: 'Institute updated successfully' });
  } catch (error) {
    console.error('Error updating institute:', error);
    res.status(500).json({ error: 'Failed to update institute' });
  }
});

// DELETE institute by ID
router.delete('/:id', async (req, res) => {
  try {
    await db.collection('institutes').doc(req.params.id).delete();
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
    console.error('Error approving institute:', error);
    res.status(500).json({ error: 'Failed to approve institute' });
  }
});

// REJECT institute
router.post('/:id/reject', async (req, res) => {
  try {
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
    console.error('Error rejecting institute:', error);
    res.status(500).json({ error: 'Failed to reject institute' });
  }
});

// GET institutes for students (only approved ones)
router.get('/public/approved', async (req, res) => {
  try {
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
    console.error('Error fetching approved institutes:', error);
    res.status(500).json({ error: 'Failed to fetch institutes' });
  }
});

// ✅ CRITICAL: Get current user's institute profile
router.get('/profile/me', async (req, res) => {
  try {
    const userId = req.user.uid;
    console.log('🔍 Looking for institute for user:', userId);
    
    const snapshot = await db.collection('institutes')
      .where('userId', '==', userId)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return res.status(404).json({ 
        error: 'No institute profile found',
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

// ✅ CRITICAL: Get current user's institute stats
router.get('/stats/me', async (req, res) => {
  try {
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

    res.json(stats);
  } catch (error) {
    console.error('Error fetching institute stats:', error);
    res.status(500).json({ error: 'Failed to fetch institute stats' });
  }
});

// ✅ CRITICAL: Get current user's institute courses
router.get('/courses/me', async (req, res) => {
  try {
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

    res.json(courses);
  } catch (error) {
    console.error('Error fetching institute courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// ✅ DEBUG: Check user institute relationship
router.get('/debug/user-institute', async (req, res) => {
  try {
    const userId = req.user.uid;
    console.log('🔍 Debug - Looking for institute for user:', userId);
    
    const snapshot = await db.collection('institutes')
      .where('userId', '==', userId)
      .limit(1)
      .get();
    
    console.log('🔍 Debug - Found institutes:', snapshot.size);
    
    if (snapshot.empty) {
      // Check if there are ANY institutes in the database
      const allInstitutes = await db.collection('institutes').limit(5).get();
      console.log('🔍 Debug - All institutes in DB:', allInstitutes.size);
      
      const institutesList = [];
      allInstitutes.forEach(doc => {
        institutesList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return res.status(404).json({ 
        error: 'No institute found for this user',
        userId: userId,
        totalInstitutes: allInstitutes.size,
        institutes: institutesList,
        message: 'User needs to complete institute registration'
      });
    }

    const instituteDoc = snapshot.docs[0];
    console.log('🔍 Debug - Found institute:', instituteDoc.id);
    
    res.json({
      id: instituteDoc.id,
      ...instituteDoc.data()
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
