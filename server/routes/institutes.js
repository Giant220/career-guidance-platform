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

// Get system stats
router.get('/stats', async (req, res) => {
  try {
    // Get user counts
    const usersSnapshot = await db.collection('users').get();
    const institutionsSnapshot = await db.collection('institutions').get();
    const companiesSnapshot = await db.collection('companies').get();
    const applicationsSnapshot = await db.collection('applications').get();

    const pendingInstitutions = institutionsSnapshot.docs.filter(doc => 
      doc.data().status === 'pending'
    ).length;

    const pendingCompanies = companiesSnapshot.docs.filter(doc => 
      doc.data().status === 'pending'
    ).length;

    const pendingApprovals = pendingInstitutions + pendingCompanies;

    res.json({
      totalUsers: usersSnapshot.size,
      totalInstitutions: institutionsSnapshot.size,
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

// Get recent activity
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

    // Get recent institutions (real data)
    const institutionsSnapshot = await db.collection('institutions')
      .orderBy('createdAt', 'desc')
      .limit(3)
      .get();

    institutionsSnapshot.forEach(doc => {
      const institution = doc.data();
      recentActivity.push({
        type: 'institution',
        message: `New institution: ${institution.name}`,
        user: institution.email,
        timestamp: institution.createdAt
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

// Get pending institutions for approval
router.get('/institutions/pending', async (req, res) => {
  try {
    const snapshot = await db.collection('institutions')
      .where('status', '==', 'pending')
      .get();
    
    const pendingInstitutions = [];
    snapshot.forEach(doc => {
      pendingInstitutions.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json(pendingInstitutions);
  } catch (error) {
    console.error('Error fetching pending institutions:', error);
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

// Get all institutions
router.get('/institutions', async (req, res) => {
  try {
    const snapshot = await db.collection('institutions').get();
    const institutions = [];
    
    for (const doc of snapshot.docs) {
      const institution = doc.data();
      
      // Get course count
      const coursesSnapshot = await db.collection('courses')
        .where('institutionId', '==', doc.id)
        .get();

      // Get application count
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
    res.status(500).json({ error: error.message });
  }
});

// Update institution status
router.put('/institutions/:institutionId/status', async (req, res) => {
  try {
    const { status } = req.body;

    await db.collection('institutions').doc(req.params.institutionId).update({
      status,
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, message: 'Institution status updated successfully' });
  } catch (error) {
    console.error('Error updating institution status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete institution
router.delete('/institutions/:institutionId', async (req, res) => {
  try {
    await db.collection('institutions').doc(req.params.institutionId).delete();
    res.json({ success: true, message: 'Institution deleted successfully' });
  } catch (error) {
    console.error('Error deleting institution:', error);
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
