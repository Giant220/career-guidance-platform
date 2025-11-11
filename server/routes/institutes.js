const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// Get institute profile
router.get('/:id/profile', async (req, res) => {
  try {
    const instituteDoc = await db.collection('institutes').doc(req.params.id).get();
    
    if (instituteDoc.exists) {
      res.json({ id: instituteDoc.id, ...instituteDoc.data() });
    } else {
      // Check if it's a pre-populated institution
      const institutionDoc = await db.collection('institutions').doc(req.params.id).get();
      if (institutionDoc.exists) {
        const institutionData = institutionDoc.data();
        const instituteProfile = {
          id: req.params.id,
          name: institutionData.name,
          type: institutionData.type,
          location: institutionData.location,
          email: institutionData.email,
          phone: institutionData.phone,
          website: institutionData.website,
          description: institutionData.description,
          established: institutionData.established,
          accreditation: institutionData.accreditation,
          status: 'approved',
          createdAt: new Date().toISOString()
        };
        
        await db.collection('institutes').doc(req.params.id).set(instituteProfile);
        res.json(instituteProfile);
      } else {
        res.status(404).json({ error: 'Institute not found' });
      }
    }
  } catch (error) {
    console.error('Error fetching institute profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update institute profile
router.post('/profile', async (req, res) => {
  try {
    const { instituteId, ...profileData } = req.body;
    
    // Validate phone format
    const phoneRegex = /^\+266[0-9]{8}$/;
    if (!phoneRegex.test(profileData.phone)) {
      return res.status(400).json({ error: 'Invalid phone format. Must be +266 followed by 8 digits' });
    }

    await db.collection('institutes').doc(instituteId).set({
      ...profileData,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating institute profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get institute stats
router.get('/:id/stats', async (req, res) => {
  try {
    const instituteId = req.params.id;

    // Get total courses
    const coursesSnapshot = await db.collection('courses')
      .where('institutionId', '==', instituteId)
      .get();
    
    const totalCourses = coursesSnapshot.size;

    // Get applications
    const applicationsSnapshot = await db.collection('applications')
      .where('institutionId', '==', instituteId)
      .get();

    const applications = [];
    applicationsSnapshot.forEach(doc => {
      applications.push(doc.data());
    });

    const pendingApplications = applications.filter(app => app.status === 'pending').length;
    const admittedApplications = applications.filter(app => app.status === 'admitted').length;
    const totalStudents = new Set(applications.map(app => app.studentId)).size;

    const admissionRate = applications.length > 0 ? 
      Math.round((admittedApplications / applications.length) * 100) : 0;

    res.json({
      totalCourses,
      pendingApplications,
      totalStudents,
      admissionRate
    });
  } catch (error) {
    console.error('Error fetching institute stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get institute courses
router.get('/:id/courses', async (req, res) => {
  try {
    const snapshot = await db.collection('courses')
      .where('institutionId', '==', req.params.id)
      .get();
    
    const courses = [];
    snapshot.forEach(doc => {
      courses.push({ id: doc.id, ...doc.data() });
    });

    res.json(courses);
  } catch (error) {
    console.error('Error fetching institute courses:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get institute faculties
router.get('/:id/faculties', async (req, res) => {
  try {
    // For pre-populated institutions, get from institutions collection
    const institutionDoc = await db.collection('institutions').doc(req.params.id).get();
    
    if (institutionDoc.exists) {
      const institution = institutionDoc.data();
      const faculties = institution.faculties?.map(f => f.name) || [];
      res.json(faculties);
    } else {
      // For custom institutes, get from courses
      const coursesSnapshot = await db.collection('courses')
        .where('institutionId', '==', req.params.id)
        .get();
      
      const faculties = [...new Set(coursesSnapshot.docs.map(doc => doc.data().faculty))];
      res.json(faculties);
    }
  } catch (error) {
    console.error('Error fetching faculties:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add new course - FIXED VERSION
router.post('/courses', async (req, res) => {
  try {
    const courseData = req.body;
    const courseId = `custom-${Date.now()}`;

    // Get institute name to include in course data
    const instituteDoc = await db.collection('institutes').doc(courseData.institutionId).get();
    const institute = instituteDoc.exists ? instituteDoc.data() : {};

    await db.collection('courses').doc(courseId).set({
      ...courseData,
      id: courseId,
      institutionName: institute.name || 'Custom Institute', // CRITICAL: Add institutionName
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, courseId, message: 'Course added successfully' });
  } catch (error) {
    console.error('Error adding course:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update course - FIXED VERSION
router.put('/courses/:courseId', async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const courseData = req.body;

    // Ensure institutionName is preserved
    const existingCourse = await db.collection('courses').doc(courseId).get();
    const currentData = existingCourse.exists ? existingCourse.data() : {};

    await db.collection('courses').doc(courseId).set({
      ...currentData,
      ...courseData,
      institutionName: currentData.institutionName, // Preserve existing institutionName
      updatedAt: new Date().toISOString()
    }, { merge: true });

    res.json({ success: true, message: 'Course updated successfully' });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete course
router.delete('/courses/:courseId', async (req, res) => {
  try {
    await db.collection('courses').doc(req.params.courseId).delete();
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get institute applications
router.get('/:id/applications', async (req, res) => {
  try {
    const applicationsSnapshot = await db.collection('applications')
      .where('institutionId', '==', req.params.id)
      .orderBy('applicationDate', 'desc')
      .get();

    const applications = [];
    
    for (const doc of applicationsSnapshot.docs) {
      const application = doc.data();
      
      // Get student details
      const studentDoc = await db.collection('students').doc(application.studentId).get();
      const student = studentDoc.exists ? studentDoc.data() : {};
      
      applications.push({
        id: doc.id,
        ...application,
        studentName: student.fullName || 'Unknown Student',
        studentEmail: student.email || 'No email',
        studentPhone: student.phone || 'No phone'
      });
    }

    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update application status
router.put('/applications/:applicationId', async (req, res) => {
  try {
    const { status, rejectionReason, decisionDate } = req.body;

    await db.collection('applications').doc(req.params.applicationId).update({
      status,
      rejectionReason: rejectionReason || '',
      decisionDate: decisionDate || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, message: 'Application status updated successfully' });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get admitted students
router.get('/:id/admissions', async (req, res) => {
  try {
    const admissionsSnapshot = await db.collection('applications')
      .where('institutionId', '==', req.params.id)
      .where('status', '==', 'admitted')
      .orderBy('admissionDate', 'desc')
      .get();

    const admissions = [];
    
    for (const doc of admissionsSnapshot.docs) {
      const admission = doc.data();
      
      // Get student details
      const studentDoc = await db.collection('students').doc(admission.studentId).get();
      const student = studentDoc.exists ? studentDoc.data() : {};
      
      // Get course details
      const courseDoc = await db.collection('courses').doc(admission.courseId).get();
      const course = courseDoc.exists ? courseDoc.data() : {};

      admissions.push({
        id: doc.id,
        ...admission,
        studentName: student.fullName || 'Unknown Student',
        studentEmail: student.email || 'No email',
        studentPhone: student.phone || 'No phone',
        courseName: course.name || 'Unknown Course',
        duration: course.duration || 'N/A',
        fees: course.fees || 'N/A',
        intake: course.intake || 'N/A'
      });
    }

    res.json(admissions);
  } catch (error) {
    console.error('Error fetching admissions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update student acceptance
router.post('/admissions/acceptance', async (req, res) => {
  try {
    const { studentId, courseId, instituteId, accepted } = req.body;

    if (accepted) {
      // Mark as accepted
      const applicationSnapshot = await db.collection('applications')
        .where('studentId', '==', studentId)
        .where('courseId', '==', courseId)
        .where('institutionId', '==', instituteId)
        .get();

      if (!applicationSnapshot.empty) {
        const applicationDoc = applicationSnapshot.docs[0];
        await applicationDoc.ref.update({
          accepted: true,
          acceptanceDate: new Date().toISOString()
        });
      }
    } else {
      // Revoke admission
      const applicationSnapshot = await db.collection('applications')
        .where('studentId', '==', studentId)
        .where('courseId', '==', courseId)
        .where('institutionId', '==', instituteId)
        .get();

      if (!applicationSnapshot.empty) {
        const applicationDoc = applicationSnapshot.docs[0];
        await applicationDoc.ref.update({
          status: 'rejected',
          rejectionReason: 'Admission revoked by institution',
          decisionDate: new Date().toISOString()
        });
      }
    }

    res.json({ success: true, message: 'Acceptance status updated successfully' });
  } catch (error) {
    console.error('Error updating acceptance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get institute reports
router.get('/:id/reports', async (req, res) => {
  try {
    const { range } = req.query;
    const instituteId = req.params.id;

    // Mock report data - in real implementation, this would query actual data
    const reports = {
      totalApplications: 45,
      admissionRate: 62,
      popularCourse: "BSc Computer Science",
      completionRate: 85,
      courseStats: [
        { courseName: "BSc Computer Science", applicationCount: 15, admittedCount: 10, admissionRate: 67 },
        { courseName: "BA Business Administration", applicationCount: 12, admittedCount: 8, admissionRate: 67 },
        { courseName: "Diploma in Nursing", applicationCount: 10, admittedCount: 6, admissionRate: 60 },
        { courseName: "BSc Electronics", applicationCount: 8, admittedCount: 4, admissionRate: 50 }
      ],
      monthlyStats: [
        { month: "Jan", applications: 8 },
        { month: "Feb", applications: 12 },
        { month: "Mar", applications: 15 },
        { month: "Apr", applications: 10 }
      ],
      maxMonthlyApplications: 15,
      insights: [
        { 
          type: "Admission Trend", 
          message: "Applications have increased by 25% compared to last " + range 
        },
        { 
          type: "Course Popularity", 
          message: "Computer Science remains your most popular course" 
        },
        { 
          type: "Recommendation", 
          message: "Consider increasing capacity for high-demand courses" 
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
