const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// GET all institutes (for students - only approved ones)
router.get('/', async (req, res) => {
  try {
    const { status, forStudents } = req.query;
    let query = db.collection('institutes');

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
      userId // Added: link to user who created it
    } = req.body;

    // Create institute with consistent ID structure
    const instituteId = `inst_${Date.now()}`;
    
    const instituteData = {
      id: instituteId,
      name,
      type,
      email,
      phone,
      location,
      website: website || '',
      established: established || '',
      description: description || '',
      status: 'pending', // default status - requires admin approval
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('institutes').doc(instituteId).set(instituteData);

    res.status(201).json({ 
      id: instituteId, 
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

// APPROVE institute (NEW ENDPOINT - CRITICAL)
router.post('/:id/approve', async (req, res) => {
  try {
    const instituteId = req.params.id;
    
    // Verify institute exists
    const instituteDoc = await db.collection('institutes').doc(instituteId).get();
    if (!instituteDoc.exists) {
      return res.status(404).json({ error: 'Institute not found' });
    }

    // Update status to approved
    await db.collection('institutes').doc(instituteId).update({
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
        institutionStatus: 'approved',
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

// REJECT institute (NEW ENDPOINT)
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

module.exports = router;
