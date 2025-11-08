const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// Apply for job
router.post('/apply', async (req, res) => {
  try {
    const { jobId, studentId } = req.body;

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

module.exports = router;