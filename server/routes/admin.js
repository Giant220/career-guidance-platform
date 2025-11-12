const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// Get admin profile
router.get('/profile/:id', async (req, res) => {
  try {
    const adminDoc = await db.collection('users').doc(req.params.id).get();
    
    if (adminDoc.exists) {
      res.json({ id: adminDoc.id, ...adminDoc.data() });
    } else {
      res.status(404).json({ error: 'Admin not found' });
    }
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get system stats - FIXED COLLECTION NAMES
router.get('/stats', async (req, res) => {
  try {
    // Get user counts
    const usersSnapshot = await db.collection('users').get();
    const institutesSnapshot = await db.collection('institutes').get(); // FIXED: institutions -> institutes
    const companiesSnapshot = await db.collection('companies').get();
    const applicationsSnapshot = await db.collection('applications').get();

    const pendingInstitutes = institutesSnapshot.docs.filter(doc => 
      doc.data().status === 'pending'
    ).length;

    const pendingCompanies = companiesSnapshot.docs.filter(doc => 
      doc.data().status === 'pending'
    ).length;

    const pendingApprovals = pendingInstitutes + pendingCompanies;

    res.json({
      totalUsers: usersSnapshot.size,
      totalInstitutions: institutesSnapshot.size, // FIXED
      totalCompanies: companiesSnapshot.size,
      pendingApprovals: pendingApprovals,
      activeApplications: applicationsSnapshot.size,
      systemHealth: 100
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get recent activity - FIXED COLLECTION NAMES
router.get('/activity', async (req, res) => {
  try {
    // Get recent users (real data)
    const usersSnapshot = await db.collection('users')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    const recentActivity = [];

    usersSnapshot.forEach(doc => {
      const user = doc.data();
      recentActivity.push({
        type: 'user',
        message: `New ${user.role} registered: ${user.fullName}`,
        user: user.email,
        timestamp: user.createdAt
      });
    });

    // Get recent institutes (real data) - FIXED: institutions -> institutes
    const institutesSnapshot = await db.collection('institutes')
      .orderBy('createdAt', 'desc')
      .limit(3)
      .get();

    institutesSnapshot.forEach(doc => {
      const institute = doc.data();
      recentActivity.push({
        type: 'institution',
        message: `New institute: ${institute.name}`,
        user: institute.email,
        timestamp: institute.createdAt
      });
    });

    // Sort by timestamp
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Limit to 8 items
    const finalActivity = recentActivity.slice(0, 8);

    res.json(finalActivity);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get pending institutes for approval - FIXED COLLECTION NAME
router.get('/institutions/pending', async (req, res) => {
  try {
    const snapshot = await db.collection('institutes') // FIXED: institutions -> institutes
      .where('status', '==', 'pending')
      .get();
    
    const pendingInstitutes = [];
    snapshot.forEach(doc => {
      pendingInstitutes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json(pendingInstitutes);
  } catch (error) {
    console.error('Error fetching pending institutes:', error);
    res.status(500).json({ error: error.message });
  }
});

// CRITICAL: APPROVE INSTITUTE ENDPOINT (MISSING)
router.post('/institutions/:id/approve', async (req, res) => {
  try {
    const instituteId = req.params.id;
    console.log(`Admin approving institute: ${instituteId}`);

    // Get the current institute data
    const instituteDoc = await db.collection('institutes').doc(instituteId).get();
    
    if (!instituteDoc.exists) {
      return res.status(404).json({ error: 'Institute not found' });
    }

    const instituteData = instituteDoc.data();
    console.log('Current institute status:', instituteData.status);

    // Update the institute status to approved
    const updateData = {
      status: 'approved',
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('Updating institute with:', updateData);

    await db.collection('institutes').doc(instituteId).update(updateData);

    // Verify the update
    const updatedDoc = await db.collection('institutes').doc(instituteId).get();
    console.log('Updated institute status:', updatedDoc.data().status);

    res.json({ 
      success: true, 
      message: 'Institute approved successfully',
      institute: {
        id: instituteId,
        ...updatedDoc.data()
      }
    });
  } catch (error) {
    console.error('Error approving institute:', error);
    res.status(500).json({ error: error.message });
  }
});

// CRITICAL: REJECT INSTITUTE ENDPOINT (MISSING)
router.post('/institutions/:id/reject', async (req, res) => {
  try {
    const instituteId = req.params.id;
    const { reason } = req.body;

    console.log(`Rejecting institute: ${instituteId}, reason: ${reason}`);

    const updateData = {
      status: 'rejected',
      rejectionReason: reason || '',
      rejectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection('institutes').doc(instituteId).update(updateData);

    // Verify the update
    const updatedDoc = await db.collection('institutes').doc(instituteId).get();

    res.json({ 
      success: true, 
      message: 'Institute rejected successfully',
      institute: {
        id: instituteId,
        ...updatedDoc.data()
      }
    });
  } catch (error) {
    console.error('Error rejecting institute:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all institutes - FIXED COLLECTION NAME
router.get('/institutions', async (req, res) => {
  try {
    const snapshot = await db.collection('institutes').get(); // FIXED: institutions -> institutes
    const institutes = [];
    
    for (const doc of snapshot.docs) {
      const institute = doc.data();
      
      // Get course count
      const coursesSnapshot = await db.collection('courses')
        .where('institutionId', '==', doc.id)
        .get();

      // Get application count
      const applicationsSnapshot = await db.collection('applications')
        .where('institutionId', '==', doc.id)
        .get();

      institutes.push({
        id: doc.id,
        ...institute,
        courseCount: coursesSnapshot.size,
        applicationCount: applicationsSnapshot.size,
        studentCount: new Set(applicationsSnapshot.docs.map(d => d.data().studentId)).size
      });
    }

    res.json(institutes);
  } catch (error) {
    console.error('Error fetching institutes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update institute status - FIXED COLLECTION NAME
router.put('/institutions/:instituteId/status', async (req, res) => {
  try {
    const { status } = req.body;

    await db.collection('institutes').doc(req.params.instituteId).update({ // FIXED: institutions -> institutes
      status,
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, message: 'Institute status updated successfully' });
  } catch (error) {
    console.error('Error updating institute status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete institute - FIXED COLLECTION NAME
router.delete('/institutions/:instituteId', async (req, res) => {
  try {
    await db.collection('institutes').doc(req.params.instituteId).delete(); // FIXED: institutions -> institutes
    res.json({ success: true, message: 'Institute deleted successfully' });
  } catch (error) {
    console.error('Error deleting institute:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get pending companies for approval
router.get('/companies/pending', async (req, res) => {
  try {
    const snapshot = await db.collection('companies')
      .where('status', '==', 'pending')
      .get();
    
    const pendingCompanies = [];
    snapshot.forEach(doc => {
      pendingCompanies.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json(pendingCompanies);
  } catch (error) {
    console.error('Error fetching pending companies:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    const users = [];
    
    snapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user status
router.put('/users/:userId/status', async (req, res) => {
  try {
    const { status } = req.body;

    await db.collection('users').doc(req.params.userId).update({
      status,
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, message: 'User status updated successfully' });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user role
router.put('/users/:userId/role', async (req, res) => {
  try {
    const { role } = req.body;

    await db.collection('users').doc(req.params.userId).update({
      role,
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/users/:userId', async (req, res) => {
  try {
    await db.collection('users').doc(req.params.userId).delete();
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all companies
router.get('/companies', async (req, res) => {
  try {
    const snapshot = await db.collection('companies').get();
    const companies = [];
    
    for (const doc of snapshot.docs) {
      const company = doc.data();
      
      // Get job count
      const jobsSnapshot = await db.collection('jobs')
        .where('companyId', '==', doc.id)
        .get();

      // Get application count
      const applicationsSnapshot = await db.collection('jobApplications')
        .where('companyId', '==', doc.id)
        .get();

      companies.push({
        id: doc.id,
        ...company,
        jobCount: jobsSnapshot.size,
        applicationCount: applicationsSnapshot.size
      });
    }

    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update company status
router.put('/companies/:companyId/status', async (req, res) => {
  try {
    const { status } = req.body;

    await db.collection('companies').doc(req.params.companyId).update({
      status,
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, message: 'Company status updated successfully' });
  } catch (error) {
    console.error('Error updating company status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete company
router.delete('/companies/:companyId', async (req, res) => {
  try {
    await db.collection('companies').doc(req.params.companyId).delete();
    res.json({ success: true, message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting company:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
