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

// Get system stats - FIXED: Proper pending counts
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
      pendingInstitutions: pendingInstitutions,
      pendingCompanies: pendingCompanies,
      activeApplications: applicationsSnapshot.size,
      systemHealth: 100
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get recent activity - FIXED: Show pending status clearly
router.get('/activity', async (req, res) => {
  try {
    const recentActivity = [];

    // Get recent users
    const usersSnapshot = await db.collection('users')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    usersSnapshot.forEach(doc => {
      const user = doc.data();
      recentActivity.push({
        type: 'user',
        message: `New ${user.role} registered: ${user.fullName}`,
        user: user.email,
        timestamp: user.createdAt,
        status: 'info'
      });
    });

    // Get recent institutions - FIXED: Show pending status
    const institutionsSnapshot = await db.collection('institutions')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    institutionsSnapshot.forEach(doc => {
      const institution = doc.data();
      
      let message, status, priority;
      if (institution.status === 'pending') {
        message = `🚨 INSTITUTION PENDING APPROVAL: ${institution.name}`;
        status = 'warning';
        priority = 1; // High priority for pending items
      } else if (institution.status === 'approved') {
        message = `✅ Institution approved: ${institution.name}`;
        status = 'success';
        priority = 3;
      } else {
        message = `Institution: ${institution.name} (${institution.status})`;
        status = 'info';
        priority = 2;
      }

      recentActivity.push({
        type: 'institution',
        message: message,
        user: institution.email,
        timestamp: institution.createdAt,
        status: status,
        priority: priority,
        institutionStatus: institution.status,
        needsAttention: institution.status === 'pending',
        id: doc.id
      });
    });

    // Get recent companies
    const companiesSnapshot = await db.collection('companies')
      .orderBy('createdAt', 'desc')
      .limit(3)
      .get();

    companiesSnapshot.forEach(doc => {
      const company = doc.data();
      
      let message, status, priority;
      if (company.status === 'pending') {
        message = `🚨 COMPANY PENDING APPROVAL: ${company.name}`;
        status = 'warning';
        priority = 1;
      } else if (company.status === 'approved') {
        message = `✅ Company approved: ${company.name}`;
        status = 'success';
        priority = 3;
      } else {
        message = `Company: ${company.name} (${company.status})`;
        status = 'info';
        priority = 2;
      }

      recentActivity.push({
        type: 'company',
        message: message,
        user: company.email,
        timestamp: company.createdAt,
        status: status,
        priority: priority,
        companyStatus: company.status,
        needsAttention: company.status === 'pending',
        id: doc.id
      });
    });

    // Sort by priority first (pending items first), then by timestamp
    recentActivity.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    // Limit to 8 items
    const finalActivity = recentActivity.slice(0, 8);

    res.json(finalActivity);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get items needing immediate attention
router.get('/attention-needed', async (req, res) => {
  try {
    const attentionItems = [];

    // Get pending institutions
    const pendingInstitutions = await db.collection('institutions')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();

    pendingInstitutions.forEach(doc => {
      const institution = doc.data();
      attentionItems.push({
        type: 'institution',
        id: doc.id,
        name: institution.name,
        email: institution.email,
        location: institution.location,
        timestamp: institution.createdAt,
        status: 'pending',
        message: `Institution pending approval: ${institution.name}`,
        daysAgo: Math.floor((new Date() - new Date(institution.createdAt)) / (1000 * 60 * 60 * 24))
      });
    });

    // Get pending companies
    const pendingCompanies = await db.collection('companies')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();

    pendingCompanies.forEach(doc => {
      const company = doc.data();
      attentionItems.push({
        type: 'company',
        id: doc.id,
        name: company.name,
        email: company.email,
        industry: company.industry,
        timestamp: company.createdAt,
        status: 'pending',
        message: `Company pending approval: ${company.name}`,
        daysAgo: Math.floor((new Date() - new Date(company.createdAt)) / (1000 * 60 * 60 * 24))
      });
    });

    // Sort by oldest first (attention needed sooner)
    attentionItems.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json(attentionItems);
  } catch (error) {
    console.error('Error fetching attention items:', error);
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

// ✅ APPROVE INSTITUTION
router.post('/institutions/:institutionId/approve', async (req, res) => {
  try {
    const institutionId = req.params.institutionId;
    const institutionRef = db.collection('institutions').doc(institutionId);
    const institutionDoc = await institutionRef.get();

    if (!institutionDoc.exists) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    const institution = institutionDoc.data();

    // Update institution status to approved
    await institutionRef.update({
      status: 'approved',
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Update all courses for this institution to be visible
    const coursesSnapshot = await db.collection('courses')
      .where('institutionId', '==', institutionId)
      .get();

    const batch = db.batch();
    coursesSnapshot.forEach(doc => {
      const courseRef = db.collection('courses').doc(doc.id);
      batch.update(courseRef, {
        status: 'active',
        updatedAt: new Date().toISOString()
      });
    });

    await batch.commit();

    console.log(`Institute ${institutionId} approved. Updated ${coursesSnapshot.size} courses.`);

    res.json({ 
      success: true, 
      message: 'Institution approved successfully! Courses are now visible to students.',
      approvedCourses: coursesSnapshot.size
    });
  } catch (error) {
    console.error('Error approving institution:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ REJECT INSTITUTION
router.post('/institutions/:institutionId/reject', async (req, res) => {
  try {
    const institutionId = req.params.institutionId;
    const { reason } = req.body;
    
    const institutionRef = db.collection('institutions').doc(institutionId);
    const institutionDoc = await institutionRef.get();

    if (!institutionDoc.exists) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    // Update institution status to rejected
    await institutionRef.update({
      status: 'rejected',
      rejectionReason: reason || 'No reason provided',
      rejectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Hide all courses for this institution
    const coursesSnapshot = await db.collection('courses')
      .where('institutionId', '==', institutionId)
      .get();

    const batch = db.batch();
    coursesSnapshot.forEach(doc => {
      const courseRef = db.collection('courses').doc(doc.id);
      batch.update(courseRef, {
        status: 'inactive',
        updatedAt: new Date().toISOString()
      });
    });

    await batch.commit();

    res.json({ 
      success: true, 
      message: 'Institution rejected successfully! Courses are now hidden.',
      rejectedCourses: coursesSnapshot.size
    });
  } catch (error) {
    console.error('Error rejecting institution:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update institution status (for suspend/reactivate)
router.put('/institutions/:institutionId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const institutionId = req.params.institutionId;

    await db.collection('institutions').doc(institutionId).update({
      status,
      updatedAt: new Date().toISOString()
    });

    // Update course visibility based on status
    const coursesSnapshot = await db.collection('courses')
      .where('institutionId', '==', institutionId)
      .get();

    const batch = db.batch();
    const newCourseStatus = status === 'approved' ? 'active' : 'inactive';
    
    coursesSnapshot.forEach(doc => {
      const courseRef = db.collection('courses').doc(doc.id);
      batch.update(courseRef, {
        status: newCourseStatus,
        updatedAt: new Date().toISOString()
      });
    });

    await batch.commit();

    res.json({ 
      success: true, 
      message: `Institution status updated to ${status}. Updated ${coursesSnapshot.size} courses.`
    });
  } catch (error) {
    console.error('Error updating institution status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete institution
router.delete('/institutions/:institutionId', async (req, res) => {
  try {
    const institutionId = req.params.institutionId;

    // Delete all courses for this institution
    const coursesSnapshot = await db.collection('courses')
      .where('institutionId', '==', institutionId)
      .get();

    const batch = db.batch();
    coursesSnapshot.forEach(doc => {
      batch.delete(db.collection('courses').doc(doc.id));
    });

    await batch.commit();
    await db.collection('institutions').doc(institutionId).delete();

    res.json({ 
      success: true, 
      message: 'Institution and all associated courses deleted successfully!',
      deletedCourses: coursesSnapshot.size
    });
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

// ✅ DEBUG: Get all institutions with details
router.get('/debug/institutions', async (req, res) => {
  try {
    const snapshot = await db.collection('institutions').get();
    const institutions = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      institutions.push({ 
        id: doc.id, 
        ...data,
        firestoreId: doc.id,
        createdAt: data.createdAt,
        status: data.status || 'missing'
      });
    });

    console.log('DEBUG - All institutions:', institutions);
    res.json(institutions);
  } catch (error) {
    console.error('Error in debug route:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
