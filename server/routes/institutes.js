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

// UPDATE institute by ID - Enhanced with notification
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
    
    // If status changed to approved, create a notification
    if (updateData.status === 'approved' && oldInstitute.status !== 'approved') {
      await db.collection('notifications').add({
        type: 'institute_approved',
        instituteId: instituteId,
        userId: oldInstitute.userId,
        instituteName: oldInstitute.name,
        message: `Your institute "${oldInstitute.name}" has been approved! You can now manage courses and applications.`,
        createdAt: new Date().toISOString(),
        read: false
      });
      
      console.log(`✅ Institute ${instituteId} approved. Notification created for user ${oldInstitute.userId}`);
    }
    
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

// APPROVE institute - Enhanced with notification
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

    // Create notification for institute owner
    await db.collection('notifications').add({
      type: 'institute_approved',
      instituteId: instituteId,
      userId: instituteData.userId,
      instituteName: instituteData.name,
      message: `Your institute "${instituteData.name}" has been approved! You can now manage courses and applications.`,
      createdAt: new Date().toISOString(),
      read: false
    });

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
      coursesUpdated: coursesSnapshot.size,
      notificationSent: true
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

    // Create notification for rejection
    await db.collection('notifications').add({
      type: 'institute_rejected',
      instituteId: instituteId,
      userId: instituteData.userId,
      instituteName: instituteData.name,
      message: `Your institute "${instituteData.name}" has been rejected. Reason: ${reason || 'No reason provided'}`,
      createdAt: new Date().toISOString(),
      read: false
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

// GET notifications for user
router.get('/user/:userId/notifications', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const snapshot = await db.collection('notifications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
    
    const notifications = [];
    snapshot.forEach(doc => {
      notifications.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// MARK notification as read
router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.collection('notifications').doc(id).update({
      read: true,
      readAt: new Date().toISOString()
    });
    
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

module.exports = router;
