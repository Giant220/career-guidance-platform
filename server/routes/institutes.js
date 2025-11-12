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
    const instituteId = req.params.id;
    const updateData = { 
      ...req.body, 
      updatedAt: new Date().toISOString() 
    };
    
    // Get the current institute data before update
    const instituteDoc = await db.collection('institutes').doc(instituteId).get();
    if (!instituteDoc.exists) {
      return res.status(404).json({ error: 'Institute not found' });
    }
    
    const oldInstitute = instituteDoc.data();
    
    // Update the institute
    await db.collection('institutes').doc(instituteId).update(updateData);
    
    console.log(`✅ Institute ${instituteId} updated. Status: ${updateData.status}`);
    
    res.json({ 
      message: 'Institute updated successfully',
      id: instituteId,
      status: updateData.status 
    });
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

    const instituteData = instituteDoc.data();

    // Update institute status
    await db.collection('institutes').doc(instituteId).update({
      status: 'approved',
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ Institute ${instituteId} approved for user ${instituteData.userId}`);

    // Activate all courses for this institute
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

    const instituteDoc = await db.collection('institutes').doc(instituteId).get();
    if (!instituteDoc.exists) {
      return res.status(404).json({ error: 'Institute not found' });
    }

    const instituteData = instituteDoc.data();

    await db.collection('institutes').doc(instituteId).update({
      status: 'rejected',
      rejectionReason: reason || '',
      rejectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log(`❌ Institute ${instituteId} rejected for user ${instituteData.userId}`);

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
