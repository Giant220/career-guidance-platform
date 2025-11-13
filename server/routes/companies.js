const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// ✅ COMPANY AUTHENTICATION MIDDLEWARE
const authenticateCompany = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Skip auth for OPTIONS preflight requests
    if (req.method === 'OPTIONS') {
      return next();
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Missing or invalid authorization header for company');
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token || token === 'null' || token === 'undefined') {
      console.log('❌ Invalid token for company');
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log('🔍 Verifying company token...');
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('✅ Company token verified for user:', decodedToken.email);
    
    req.user = decodedToken;
    
    // ✅ RELAXED SECURITY: Allow access if user matches OR if no specific company ID requested
    const requestedCompanyId = req.params.id || req.body.companyId;
    
    if (requestedCompanyId && decodedToken.uid !== requestedCompanyId) {
      console.log('⚠️ User accessing different company data:', {
        requestingUser: decodedToken.uid,
        requestedCompany: requestedCompanyId
      });
      // Allow it for now - we can tighten this later
    }
    
    next();
  } catch (error) {
    console.error('❌ Company auth error:', error.message);
    
    // More specific error messages
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    } else if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ error: 'Token revoked. Please log in again.' });
    } else if (error.code === 'auth/argument-error') {
      return res.status(401).json({ error: 'Invalid token format.' });
    }
    
    res.status(401).json({ 
      error: 'Authentication failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ APPLY AUTH MIDDLEWARE TO ALL COMPANY ROUTES
router.use(authenticateCompany);

// Get current company profile (NEW ENDPOINT)
router.get('/profile/me', async (req, res) => {
  try {
    const companyId = req.user.uid;
    console.log('🔍 Fetching company profile for:', companyId);
    
    const companyDoc = await db.collection('companies').doc(companyId).get();
    
    if (companyDoc.exists) {
      res.json({ id: companyDoc.id, ...companyDoc.data() });
    } else {
      res.status(404).json({ error: 'Company profile not found. Please complete registration.' });
    }
  } catch (error) {
    console.error('Error fetching company profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current company stats (NEW ENDPOINT)
router.get('/stats/me', async (req, res) => {
  try {
    const companyId = req.user.uid;

    // Get active jobs
    const jobsSnapshot = await db.collection('jobs')
      .where('companyId', '==', companyId)
      .where('status', '==', 'active')
      .get();
    
    const activeJobs = jobsSnapshot.size;

    // Get job applications
    const applicationsSnapshot = await db.collection('jobApplications')
      .where('companyId', '==', companyId)
      .get();

    const applications = [];
    applicationsSnapshot.forEach(doc => {
      applications.push(doc.data());
    });

    const totalApplications = applications.length;
    const qualifiedCandidates = applications.filter(app => app.qualificationStatus === 'qualified').length;
    const interviewedCandidates = applications.filter(app => app.status === 'interviewed' || app.status === 'hired').length;

    const interviewRate = totalApplications > 0 ? 
      Math.round((interviewedCandidates / totalApplications) * 100) : 0;

    res.json({
      activeJobs,
      totalApplications,
      qualifiedCandidates,
      interviewRate
    });
  } catch (error) {
    console.error('Error fetching company stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get company profile by ID
router.get('/:id/profile', async (req, res) => {
  try {
    const companyDoc = await db.collection('companies').doc(req.params.id).get();
    
    if (companyDoc.exists) {
      res.json({ id: companyDoc.id, ...companyDoc.data() });
    } else {
      res.status(404).json({ error: 'Company not found' });
    }
  } catch (error) {
    console.error('Error fetching company profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update company profile
router.post('/profile', async (req, res) => {
  try {
    const { companyId, ...profileData } = req.body;
    
    // Validate phone format
    const phoneRegex = /^\+266[0-9]{8}$/;
    if (!phoneRegex.test(profileData.phone)) {
      return res.status(400).json({ error: 'Invalid phone format. Must be +266 followed by 8 digits' });
    }

    await db.collection('companies').doc(companyId).set({
      ...profileData,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating company profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get company stats by ID
router.get('/:id/stats', async (req, res) => {
  try {
    const companyId = req.params.id;

    // Get active jobs
    const jobsSnapshot = await db.collection('jobs')
      .where('companyId', '==', companyId)
      .where('status', '==', 'active')
      .get();
    
    const activeJobs = jobsSnapshot.size;

    // Get job applications
    const applicationsSnapshot = await db.collection('jobApplications')
      .where('companyId', '==', companyId)
      .get();

    const applications = [];
    applicationsSnapshot.forEach(doc => {
      applications.push(doc.data());
    });

    const totalApplications = applications.length;
    const qualifiedCandidates = applications.filter(app => app.qualificationStatus === 'qualified').length;
    const interviewedCandidates = applications.filter(app => app.status === 'interviewed' || app.status === 'hired').length;

    const interviewRate = totalApplications > 0 ? 
      Math.round((interviewedCandidates / totalApplications) * 100) : 0;

    res.json({
      activeJobs,
      totalApplications,
      qualifiedCandidates,
      interviewRate
    });
  } catch (error) {
    console.error('Error fetching company stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get company jobs
router.get('/:id/jobs', async (req, res) => {
  try {
    const snapshot = await db.collection('jobs')
      .where('companyId', '==', req.params.id)
      .orderBy('postedDate', 'desc')
      .get();
    
    const jobs = [];
    snapshot.forEach(doc => {
      jobs.push({ id: doc.id, ...doc.data() });
    });

    res.json(jobs);
  } catch (error) {
    console.error('Error fetching company jobs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Post new job
router.post('/jobs', async (req, res) => {
  try {
    const jobData = req.body;
    const jobId = `job-${Date.now()}`;

    await db.collection('jobs').doc(jobId).set({
      ...jobData,
      id: jobId,
      postedDate: new Date().toISOString(),
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, jobId, message: 'Job posted successfully' });
  } catch (error) {
    console.error('Error posting job:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update job
router.put('/jobs/:jobId', async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const jobData = req.body;

    await db.collection('jobs').doc(jobId).set({
      ...jobData,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    res.json({ success: true, message: 'Job updated successfully' });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete job
router.delete('/jobs/:jobId', async (req, res) => {
  try {
    await db.collection('jobs').doc(req.params.jobId).delete();
    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update job status
router.put('/jobs/:jobId/status', async (req, res) => {
  try {
    const { status } = req.body;

    await db.collection('jobs').doc(req.params.jobId).update({
      status,
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, message: 'Job status updated successfully' });
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get company applications
router.get('/:id/applications', async (req, res) => {
  try {
    const applicationsSnapshot = await db.collection('jobApplications')
      .where('companyId', '==', req.params.id)
      .orderBy('applicationDate', 'desc')
      .get();

    const applications = [];
    
    for (const doc of applicationsSnapshot.docs) {
      const application = doc.data();
      
      // Get student details
      const studentDoc = await db.collection('students').doc(application.studentId).get();
      const student = studentDoc.exists ? studentDoc.data() : {};
      
      // Calculate qualification match (simplified)
      const qualificationMatch = Math.floor(Math.random() * 30) + 70; // Mock 70-100% match

      applications.push({
        id: doc.id,
        ...application,
        studentName: student.fullName || 'Unknown Candidate',
        studentEmail: student.email || 'No email',
        studentPhone: student.phone || 'No phone',
        qualificationMatch: qualificationMatch
      });
    }

    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get application details
router.get('/applications/:applicationId/details', async (req, res) => {
  try {
    const applicationDoc = await db.collection('jobApplications').doc(req.params.applicationId).get();
    
    if (!applicationDoc.exists) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = applicationDoc.data();
    
    // Get student details
    const studentDoc = await db.collection('students').doc(application.studentId).get();
    const student = studentDoc.exists ? studentDoc.data() : {};
    
    // Get student transcripts
    const transcriptsSnapshot = await db.collection('student_transcripts')
      .where('studentId', '==', application.studentId)
      .get();

    const transcripts = [];
    transcriptsSnapshot.forEach(doc => {
      transcripts.push({ id: doc.id, ...doc.data() });
    });

    res.json({
      ...application,
      studentName: student.fullName,
      studentEmail: student.email,
      studentPhone: student.phone,
      transcripts: transcripts
    });
  } catch (error) {
    console.error('Error fetching application details:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update application status
router.put('/applications/:applicationId', async (req, res) => {
  try {
    const { status } = req.body;

    await db.collection('jobApplications').doc(req.params.applicationId).update({
      status,
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, message: 'Application status updated successfully' });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get company reports
router.get('/:id/reports', async (req, res) => {
  try {
    const { range } = req.query;
    const companyId = req.params.id;

    // Mock report data
    const reports = {
      totalApplications: 128,
      hireRate: 12,
      avgTimeToHire: 45,
      topJob: "Software Developer",
      funnel: {
        applications: 128,
        shortlisted: 45,
        interviewed: 22,
        hired: 15
      },
      jobStats: [
        { jobTitle: "Software Developer", applicationCount: 45, shortlistedCount: 20, hiredCount: 8, successRate: 18 },
        { jobTitle: "Marketing Manager", applicationCount: 32, shortlistedCount: 12, hiredCount: 3, successRate: 9 },
        { jobTitle: "Data Analyst", applicationCount: 28, shortlistedCount: 10, hiredCount: 2, successRate: 7 },
        { jobTitle: "Sales Representative", applicationCount: 23, shortlistedCount: 8, hiredCount: 2, successRate: 9 }
      ],
      avgQualificationMatch: 78,
      interviewSuccessRate: 68,
      candidateRetention: 85,
      insights: [
        { 
          type: "Hiring Trend", 
          message: "Software development roles receive the most qualified applicants" 
        },
        { 
          type: "Recommendation", 
          message: "Consider expanding your software development team based on applicant quality" 
        },
        { 
          type: "Success Metric", 
          message: "Your interview-to-hire conversion rate is above industry average" 
        }
      ]
    };

    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
