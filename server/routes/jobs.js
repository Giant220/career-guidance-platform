const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// GET all active jobs
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('jobs')
      .where('status', '==', 'active')
      .orderBy('postedDate', 'desc')
      .get();
    
    const jobs = [];
    snapshot.forEach(doc => {
      jobs.push({ 
        id: doc.id, 
        ...doc.data() 
      });
    });

    console.log(`✅ Found ${jobs.length} active jobs`);
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// GET single job by ID
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('jobs').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// CREATE new job (for companies)
router.post('/', async (req, res) => {
  try {
    const {
      title,
      companyName,
      companyId,
      location,
      salary,
      type,
      description,
      requirements,
      qualifications,
      deadline
    } = req.body;

    // Validate required fields
    if (!title || !companyName || !description) {
      return res.status(400).json({ error: 'Title, company name, and description are required' });
    }

    const jobData = {
      title,
      companyName,
      companyId: companyId || '',
      location: location || 'Remote',
      salary: salary || 'Negotiable',
      type: type || 'Full-time',
      description,
      requirements: requirements || [],
      qualifications: qualifications || [],
      deadline: deadline || null,
      status: 'active',
      postedDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await db.collection('jobs').add(jobData);

    res.status(201).json({ 
      id: docRef.id,
      ...jobData,
      message: 'Job posted successfully' 
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// UPDATE job
router.put('/:id', async (req, res) => {
  try {
    const jobId = req.params.id;
    const updateData = { 
      ...req.body, 
      updatedAt: new Date().toISOString() 
    };

    await db.collection('jobs').doc(jobId).update(updateData);
    
    res.json({ 
      message: 'Job updated successfully',
      id: jobId
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// DELETE job
router.delete('/:id', async (req, res) => {
  try {
    await db.collection('jobs').doc(req.params.id).delete();
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// GET jobs by company
router.get('/company/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const snapshot = await db.collection('jobs')
      .where('companyId', '==', companyId)
      .orderBy('postedDate', 'desc')
      .get();
    
    const jobs = [];
    snapshot.forEach(doc => {
      jobs.push({ id: doc.id, ...doc.data() });
    });

    res.json(jobs);
  } catch (error) {
    console.error('Error fetching company jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Apply for job
router.post('/apply', async (req, res) => {
  try {
    const { jobId, studentId, studentName, studentEmail } = req.body;

    // Check if already applied
    const existingApplication = await db.collection('jobApplications')
      .where('studentId', '==', studentId)
      .where('jobId', '==', jobId)
      .get();

    if (!existingApplication.empty) {
      return res.status(400).json({ 
        error: 'You have already applied to this job' 
      });
    }

    // Get job details
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = jobDoc.data();

    const applicationData = {
      studentId,
      jobId,
      jobTitle: job.title,
      companyName: job.companyName,
      companyId: job.companyId,
      studentName: studentName || 'Unknown Student',
      studentEmail: studentEmail || 'No email',
      status: 'pending',
      applicationDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('jobApplications').add(applicationData);

    res.json({ 
      success: true, 
      message: 'Job application submitted successfully',
      applicationId: docRef.id 
    });
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get job applications for student
router.get('/student/:studentId/applications', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const snapshot = await db.collection('jobApplications')
      .where('studentId', '==', studentId)
      .orderBy('applicationDate', 'desc')
      .get();
    
    const applications = [];
    snapshot.forEach(doc => {
      applications.push({ id: doc.id, ...doc.data() });
    });

    res.json(applications);
  } catch (error) {
    console.error('Error fetching job applications:', error);
    res.status(500).json({ error: 'Failed to fetch job applications' });
  }
});

// Get job applications for company
router.get('/company/:companyId/applications', async (req, res) => {
  try {
    const { companyId } = req.params;
    
    const snapshot = await db.collection('jobApplications')
      .where('companyId', '==', companyId)
      .orderBy('applicationDate', 'desc')
      .get();
    
    const applications = [];
    snapshot.forEach(doc => {
      applications.push({ id: doc.id, ...doc.data() });
    });

    res.json(applications);
  } catch (error) {
    console.error('Error fetching company job applications:', error);
    res.status(500).json({ error: 'Failed to fetch job applications' });
  }
});

// Update job application status
router.put('/applications/:id/status', async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    await db.collection('jobApplications').doc(req.params.id).update({
      status,
      notes: notes || '',
      updatedAt: new Date().toISOString(),
      reviewedAt: new Date().toISOString()
    });

    res.json({ message: 'Job application status updated successfully' });
  } catch (error) {
    console.error('Error updating job application:', error);
    res.status(500).json({ error: 'Failed to update job application' });
  }
});

// Health check for jobs
router.get('/health/test', (req, res) => {
  res.json({ 
    status: 'Jobs API working',
    timestamp: new Date().toISOString(),
    endpoints: {
      'GET /': 'Get all jobs',
      'GET /:id': 'Get single job',
      'POST /': 'Create job',
      'POST /apply': 'Apply for job',
      'GET /student/:studentId/applications': 'Get student job applications',
      'GET /company/:companyId/applications': 'Get company job applications'
    }
  });
});

module.exports = router;
