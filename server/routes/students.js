const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// Get student profile
router.get('/:id/profile', async (req, res) => {
  try {
    const studentDoc = await db.collection('students').doc(req.params.id).get();
    
    if (studentDoc.exists) {
      res.json(studentDoc.data());
    } else {
      // Create empty profile if doesn't exist
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
    
    // Validate phone format
    const phoneRegex = /^\+266[0-9]{8}$/;
    if (!phoneRegex.test(profileData.phone)) {
      return res.status(400).json({ error: 'Invalid phone format. Must be +266 followed by 8 digits' });
    }

    // Validate name (no numbers)
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
    
    // Convert grades to numerical values for comparison
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

// Get qualified courses for student
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

    const coursesSnapshot = await db.collection('courses').get();
    const qualifiedCourses = [];

    coursesSnapshot.forEach(doc => {
      const course = { id: doc.id, ...doc.data() };
      if (qualifiesForCourse(student.grades, course.requirements)) {
        qualifiedCourses.push(course);
      }
    });

    res.json(qualifiedCourses);
  } catch (error) {
    console.error('Error fetching qualified courses:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to check if student qualifies for course
function qualifiesForCourse(studentGrades, requirements) {
  const gradeValues = {
    'A*': 6, 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0
  };

  for (const requirement of requirements) {
    const match = requirement.match(/([A-Za-z\s]+)\s+([A-F\*])(?:\+)?/);
    if (match) {
      const subject = match[1].trim();
      const minGrade = match[2];
      const studentGrade = studentGrades[subject] || -1;
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
    
    // Update the accepted admission
    await db.collection('applications').doc(admissionId).update({
      accepted: true,
      acceptanceDate: new Date().toISOString()
    });

    // Reject other admissions from different institutions
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
    
    // Validate PDF data
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

// Get qualified jobs for student
router.get('/:id/qualified-jobs', async (req, res) => {
  try {
    const studentDoc = await db.collection('students').doc(req.params.id).get();
    const student = studentDoc.data();
    
    // For now, return all active jobs
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

module.exports = router;