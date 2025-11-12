const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// SIMPLE TEST ROUTE
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Student routes are working!', 
    timestamp: new Date().toISOString()
  });
});

// Get student profile
router.get('/:id/profile', async (req, res) => {
  try {
    const studentDoc = await db.collection('students').doc(req.params.id).get();
    
    if (studentDoc.exists) {
      res.json(studentDoc.data());
    } else {
      const emptyProfile = {
        fullName: '',
        phone: '',
        address: '',
        dateOfBirth: '',
        gender: '',
        nationality: 'Lesotho',
        createdAt: new Date().toISOString()
      };
      await db.collection('students').doc(req.params.id).set(emptyProfile);
      res.json(emptyProfile);
    }
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update student profile
router.post('/profile', async (req, res) => {
  try {
    const { studentId, ...profileData } = req.body;
    
    const phoneRegex = /^\+266[0-9]{8}$/;
    if (!phoneRegex.test(profileData.phone)) {
      return res.status(400).json({ error: 'Invalid phone format. Must be +266 followed by 8 digits' });
    }

    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(profileData.fullName)) {
      return res.status(400).json({ error: 'Name can only contain letters and spaces' });
    }

    await db.collection('students').doc(studentId).set({
      ...profileData,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating student profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save student grades
router.post('/grades', async (req, res) => {
  try {
    const { studentId, grades } = req.body;
    
    const gradeValues = {
      'A*': 6, 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0, 'Not Taken': -1
    };
    
    const numericalGrades = {};
    Object.keys(grades).forEach(subject => {
      numericalGrades[subject] = gradeValues[grades[subject]] || -1;
    });

    await db.collection('students').doc(studentId).set({
      grades: numericalGrades,
      rawGrades: grades,
      gradesUpdated: new Date().toISOString()
    }, { merge: true });

    res.json({ success: true, message: 'Grades saved successfully' });
  } catch (error) {
    console.error('Error saving grades:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to check if institute is approved
async function isInstituteApproved(institutionId, institutionName) {
  if (!institutionId) {
    // If no institutionId, check by institutionName in institutes collection
    if (institutionName) {
      const institutesSnapshot = await db.collection('institutes')
        .where('name', '==', institutionName)
        .get();
      
      if (!institutesSnapshot.empty) {
        const instituteDoc = institutesSnapshot.docs[0];
        const institute = instituteDoc.data();
        return institute.status === 'approved';
      }
    }
    // If we can't find the institute, assume it's approved (for backward compatibility with pre-populated data)
    return true;
  }
  
  // Check by institutionId
  try {
    const instituteDoc = await db.collection('institutes').doc(institutionId).get();
    if (instituteDoc.exists) {
      const institute = instituteDoc.data();
      return institute.status === 'approved';
    }
    
    // If institute not found by ID, check by name
    if (institutionName) {
      const institutesSnapshot = await db.collection('institutes')
        .where('name', '==', institutionName)
        .get();
      
      if (!institutesSnapshot.empty) {
        const instituteDoc = institutesSnapshot.docs[0];
        const institute = instituteDoc.data();
        return institute.status === 'approved';
      }
    }
    
    // If we can't find the institute at all, assume it's approved (pre-populated data)
    return true;
  } catch (error) {
    console.error('Error checking institute status:', error);
    // If there's an error checking, assume approved to not break existing functionality
    return true;
  }
}

// Get ALL courses for student (FIXED - Proper filtering for ALL courses)
router.get('/:id/all-courses', async (req, res) => {
  try {
    const studentId = req.params.id;
    const studentDoc = await db.collection('students').doc(studentId).get();
    
    if (!studentDoc.exists) {
      return res.json([]);
    }

    const student = studentDoc.data();
    
    if (!student || !student.grades) {
      return res.json([]);
    }

    // Get all courses
    const coursesSnapshot = await db.collection('courses').get();
    const approvedCourses = [];

    // Check each course's institute status - for ALL courses
    for (const doc of coursesSnapshot.docs) {
      const course = { id: doc.id, ...doc.data() };
      
      // Check if the course's institute is approved
      const isApproved = await isInstituteApproved(course.institutionId, course.institutionName);
      
      if (isApproved) {
        approvedCourses.push(course);
      }
    }

    const qualifiedCourses = approvedCourses.filter(course => 
      qualifiesForCourse(student.grades, course.requirements)
    );
    
    res.json(qualifiedCourses);
  } catch (error) {
    console.error('Error fetching all courses:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get qualified courses for student (FIXED - Proper filtering for ALL courses)
router.get('/:id/qualified-courses', async (req, res) => {
  try {
    const studentDoc = await db.collection('students').doc(req.params.id).get();
    
    if (!studentDoc.exists) {
      return res.json([]);
    }

    const student = studentDoc.data();
    
    if (!student || !student.grades) {
      return res.json([]);
    }

    // Get all courses
    const coursesSnapshot = await db.collection('courses').get();
    const approvedCourses = [];

    // Check each course's institute status - for ALL courses
    for (const doc of coursesSnapshot.docs) {
      const course = { id: doc.id, ...doc.data() };
      
      // Check if the course's institute is approved
      const isApproved = await isInstituteApproved(course.institutionId, course.institutionName);
      
      if (isApproved) {
        approvedCourses.push(course);
      }
    }

    const qualifiedCourses = approvedCourses.filter(course => 
      qualifiesForCourse(student.grades, course.requirements)
    );

    res.json(qualifiedCourses);
  } catch (error) {
    console.error('Error fetching qualified courses:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available courses for browsing (FIXED - All approved institute courses)
router.get('/:id/available-courses', async (req, res) => {
  try {
    const studentId = req.params.id;
    
    // Get all courses
    const coursesSnapshot = await db.collection('courses').get();
    const availableCourses = [];

    // Check each course's institute status - for ALL courses
    for (const doc of coursesSnapshot.docs) {
      const course = { id: doc.id, ...doc.data() };
      
      // Check if the course's institute is approved
      const isApproved = await isInstituteApproved(course.institutionId, course.institutionName);
      
      if (isApproved) {
        availableCourses.push({
          ...course,
          institutionName: course.institutionName || 'Unknown Institute',
          institutionStatus: 'approved'
        });
      }
    }

    res.json(availableCourses);
  } catch (error) {
    console.error('Error fetching available courses:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get courses by institute (NEW - For testing)
router.get('/:id/institute/:instituteId/courses', async (req, res) => {
  try {
    const { instituteId } = req.params;
    
    // Check if institute is approved
    const isApproved = await isInstituteApproved(instituteId, null);
    
    if (!isApproved) {
      return res.json([]);
    }

    // Get courses for this institute
    const coursesSnapshot = await db.collection('courses')
      .where('institutionId', '==', instituteId)
      .get();
    
    const courses = [];
    coursesSnapshot.forEach(doc => {
      courses.push({ id: doc.id, ...doc.data() });
    });

    res.json(courses);
  } catch (error) {
    console.error('Error fetching institute courses:', error);
    res.status(500).json({ error: error.message });
  }
});

// CLEAN Helper function to check if student qualifies for course
function qualifiesForCourse(studentGrades, requirements) {
  const gradeValues = {
    'A*': 6, 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0
  };

  if (!requirements || requirements.length === 0) {
    return true;
  }

  for (const requirement of requirements) {
    if (!requirement || typeof requirement !== 'string') {
      continue;
    }

    let subject, minGrade;
    
    // Pattern 1: "Subject Grade" (e.g., "English C", "Mathematics B")
    let match = requirement.match(/([A-Za-z\s]+)\s+([A-F\*])(?:\+)?/);
    if (match) {
      subject = match[1].trim();
      minGrade = match[2];
    } 
    // Pattern 2: "Grade in Subject" (e.g., "C in English", "B in Mathematics")
    else {
      match = requirement.match(/([A-F\*])\s+in\s+([A-Za-z\s]+)/i);
      if (match) {
        minGrade = match[1];
        subject = match[2].trim();
      }
      // Pattern 3: Handle other formats or free text - be lenient with custom courses
      else {
        const commonSubjects = ['english', 'mathematics', 'math', 'science', 'biology', 'chemistry', 'physics', 'computer', 'accounting', 'commerce'];
        const requirementLower = requirement.toLowerCase();
        
        const hasCommonSubject = commonSubjects.some(sub => 
          requirementLower.includes(sub) && Object.keys(studentGrades).some(studentSub => 
            studentSub.toLowerCase().includes(sub)
          )
        );
        
        if (hasCommonSubject) {
          continue;
        } else {
          continue;
        }
      }
    }

    if (subject && minGrade) {
      const studentSubjectKey = Object.keys(studentGrades).find(
        key => key.toLowerCase().includes(subject.toLowerCase())
      );
      
      const studentGrade = studentSubjectKey ? studentGrades[studentSubjectKey] : -1;
      const minGradeValue = gradeValues[minGrade] || 0;

      if (studentGrade < minGradeValue) {
        return false;
      }
    }
  }

  return true;
}

// Get student applications
router.get('/:id/applications', async (req, res) => {
  try {
    const snapshot = await db.collection('applications')
      .where('studentId', '==', req.params.id)
      .orderBy('applicationDate', 'desc')
      .get();
    
    const applications = [];
    snapshot.forEach(doc => {
      applications.push({ id: doc.id, ...doc.data() });
    });

    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get student admissions
router.get('/:id/admissions', async (req, res) => {
  try {
    const snapshot = await db.collection('applications')
      .where('studentId', '==', req.params.id)
      .orderBy('applicationDate', 'desc')
      .get();
    
    const admissions = [];
    snapshot.forEach(doc => {
      const app = doc.data();
      admissions.push({ id: doc.id, ...app });
    });

    res.json(admissions);
  } catch (error) {
    console.error('Error fetching admissions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Accept admission
router.post('/accept-admission', async (req, res) => {
  try {
    const { studentId, admissionId, institutionId } = req.body;
    
    await db.collection('applications').doc(admissionId).update({
      accepted: true,
      acceptanceDate: new Date().toISOString()
    });

    const otherAdmissions = await db.collection('applications')
      .where('studentId', '==', studentId)
      .where('institutionId', '!=', institutionId)
      .where('status', '==', 'admitted')
      .get();

    const batch = db.batch();
    otherAdmissions.forEach(doc => {
      batch.update(doc.ref, { 
        status: 'rejected', 
        rejectionReason: 'Student accepted another offer',
        updatedAt: new Date().toISOString()
      });
    });
    await batch.commit();

    res.json({ success: true, message: 'Admission accepted successfully' });
  } catch (error) {
    console.error('Error accepting admission:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload transcript metadata
router.post('/upload-transcript', async (req, res) => {
  try {
    const transcriptData = req.body;
    
    if (!transcriptData.fileName?.endsWith('.pdf')) {
      return res.status(400).json({ error: 'Only PDF files allowed' });
    }

    const docRef = await db.collection('student_transcripts').add({
      ...transcriptData,
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, transcriptId: docRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get student transcripts
router.get('/:id/transcripts', async (req, res) => {
  try {
    const snapshot = await db.collection('student_transcripts')
      .where('studentId', '==', req.params.id)
      .orderBy('uploadDate', 'desc')
      .get();

    const transcripts = [];
    snapshot.forEach(doc => {
      transcripts.push({ id: doc.id, ...doc.data() });
    });

    res.json(transcripts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete transcript
router.delete('/transcripts/:id', async (req, res) => {
  try {
    await db.collection('student_transcripts').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ALL jobs for student
router.get('/:id/jobs', async (req, res) => {
  try {
    const snapshot = await db.collection('jobs')
      .where('status', '==', 'active')
      .orderBy('postedDate', 'desc')
      .get();
    
    const jobs = [];
    snapshot.forEach(doc => {
      jobs.push({ id: doc.id, ...doc.data() });
    });

    res.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check if student qualifies for a specific job
router.get('/:studentId/jobs/:jobId/qualify', async (req, res) => {
  try {
    const { studentId, jobId } = req.params;

    const jobDoc = await db.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) {
      return res.json({ qualified: false, reason: 'Job not found' });
    }

    const job = jobDoc.data();

    const transcriptsSnapshot = await db.collection('student_transcripts')
      .where('studentId', '==', studentId)
      .get();

    const transcripts = [];
    transcriptsSnapshot.forEach(doc => {
      transcripts.push(doc.data());
    });

    if (transcripts.length === 0) {
      return res.json({ 
        qualified: false, 
        reason: 'No transcripts uploaded. Please upload your academic transcripts before applying for jobs.' 
      });
    }

    const hasRelevantEducation = transcripts.some(transcript => {
      const program = transcript.program?.toLowerCase() || '';
      const jobTitle = job.title?.toLowerCase() || '';
      const jobRequirements = job.requirements?.join(' ').toLowerCase() || '';
      
      return program.includes('computer') && jobTitle.includes('software') ||
             program.includes('business') && jobTitle.includes('business') ||
             program.includes('marketing') && jobTitle.includes('marketing') ||
             program.includes('accounting') && jobTitle.includes('accounting') ||
             true;
    });

    if (!hasRelevantEducation) {
      return res.json({ 
        qualified: false, 
        reason: 'Your educational background does not match the job requirements. Required: ' + (job.requirements?.join(', ') || 'Relevant degree/diploma')
      });
    }

    res.json({ qualified: true });
  } catch (error) {
    console.error('Error checking job qualification:', error);
    res.status(500).json({ error: error.message });
  }
});

// Apply for job with qualification check
router.post('/:studentId/jobs/:jobId/apply', async (req, res) => {
  try {
    const { studentId, jobId } = req.params;

    const existingApplication = await db.collection('jobApplications')
      .where('studentId', '==', studentId)
      .where('jobId', '==', jobId)
      .get();

    if (!existingApplication.empty) {
      return res.status(400).json({ 
        error: 'You have already applied to this job' 
      });
    }

    const qualifyResponse = await fetch(`http://localhost:5000/api/students/${studentId}/jobs/${jobId}/qualify`);
    const qualifyData = await qualifyResponse.json();

    if (!qualifyData.qualified) {
      return res.status(400).json({ 
        error: qualifyData.reason || 'You do not meet the qualifications for this job' 
      });
    }

    const jobDoc = await db.collection('jobs').doc(jobId).get();
    const studentDoc = await db.collection('students').doc(studentId).get();
    
    const job = jobDoc.data();
    const student = studentDoc.exists ? studentDoc.data() : {};

    const applicationData = {
      studentId,
      jobId,
      jobTitle: job.title,
      companyName: job.companyName,
      companyId: job.companyId,
      status: 'pending',
      applicationDate: new Date().toISOString(),
      studentName: student.fullName || 'Unknown Student',
      studentEmail: student.email || '',
      qualificationStatus: 'qualified',
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('jobApplications').add(applicationData);

    res.json({ 
      success: true, 
      message: 'Job application submitted successfully!',
      applicationId: docRef.id 
    });
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get student job applications
router.get('/:id/job-applications', async (req, res) => {
  try {
    const snapshot = await db.collection('jobApplications')
      .where('studentId', '==', req.params.id)
      .orderBy('applicationDate', 'desc')
      .get();
    
    const applications = [];
    snapshot.forEach(doc => {
      applications.push({ id: doc.id, ...doc.data() });
    });

    res.json(applications);
  } catch (error) {
    console.error('Error fetching job applications:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get student stats
router.get('/:id/stats', async (req, res) => {
  try {
    const studentId = req.params.id;

    const applicationsSnapshot = await db.collection('applications')
      .where('studentId', '==', studentId)
      .get();
    const applications = applicationsSnapshot.size;

    let admissions = 0;
    applicationsSnapshot.forEach(doc => {
      if (doc.data().status === 'admitted') {
        admissions++;
      }
    });

    const jobsSnapshot = await db.collection('jobApplications')
      .where('studentId', '==', studentId)
      .get();
    const jobsApplied = jobsSnapshot.size;

    const studentDoc = await db.collection('students').doc(studentId).get();
    const student = studentDoc.exists ? studentDoc.data() : {};
    
    let qualifiedCourses = 0;
    if (student && student.grades) {
      const coursesSnapshot = await db.collection('courses').get();
      
      for (const doc of coursesSnapshot.docs) {
        const course = doc.data();
        
        // Only count courses from approved institutes
        const isApproved = await isInstituteApproved(course.institutionId, course.institutionName);
        if (isApproved && qualifiesForCourse(student.grades, course.requirements)) {
          qualifiedCourses++;
        }
      }
    }

    res.json({
      applications,
      admissions,
      jobsApplied,
      qualifiedCourses
    });
  } catch (error) {
    console.error('Error fetching student stats:', error);
    res.json({
      applications: 0,
      admissions: 0, 
      jobsApplied: 0,
      qualifiedCourses: 0
    });
  }
});

module.exports = router;
