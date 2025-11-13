const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// GET courses - STRICTLY filtered by instituteId (matching frontend)
router.get('/', async (req, res) => {
  try {
    const { instituteId, status } = req.query; // Changed to instituteId
    
    // instituteId is REQUIRED - courses belong to specific institutes
    if (!instituteId) {
      return res.status(400).json({ error: 'instituteId is required' });
    }

    let query = db.collection('courses')
      .where('instituteId', '==', instituteId); // Changed to instituteId

    // Optional status filter
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const courses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`📚 Found ${courses.length} courses for institute ${instituteId}`);
    res.status(200).json(courses);

  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// GET single course by ID - with institute verification
router.get('/:id', async (req, res) => {
  try {
    const { instituteId } = req.query; // Changed to instituteId
    
    const doc = await db.collection('courses').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = doc.data();
    
    // If instituteId provided, verify the course belongs to that institute
    if (instituteId && course.instituteId !== instituteId) {
      return res.status(403).json({ error: 'Course does not belong to this institute' });
    }

    res.json({ id: doc.id, ...course });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// CREATE new course - automatically sets instituteId (matching frontend)
router.post('/', async (req, res) => {
  try {
    const {
      name,
      faculty,
      duration,
      fees,
      credits,
      description,
      requirements,
      careerPaths,
      intake,
      institutionId, // From frontend - will map to instituteId
      institutionName // From frontend - will map to instituteName
    } = req.body;

    // Validate required fields
    if (!name || !faculty || !duration || !fees || !description || !institutionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify the institute exists
    const instituteDoc = await db.collection('institutes').doc(institutionId).get();
    if (!instituteDoc.exists) {
      return res.status(404).json({ error: 'Institute not found' });
    }

    const instituteData = instituteDoc.data();

    const courseData = {
      name,
      faculty,
      duration,
      fees,
      credits: credits || '',
      description,
      requirements: requirements || [],
      careerPaths: careerPaths || [],
      intake: intake || '',
      // MAP frontend field names to backend field names
      instituteId: institutionId, // Map institutionId → instituteId
      instituteName: institutionName || instituteData.name, // Map institutionName → instituteName
      status: 'pending', // Courses are pending until institute is approved
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection('courses').add(courseData);

    console.log(`✅ Created new course for institute ${institutionId}: ${name}`);

    res.status(201).json({ 
      id: docRef.id, 
      ...courseData,
      message: 'Course created successfully' 
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// UPDATE course by ID - verify institute ownership
router.put('/:id', async (req, res) => {
  try {
    const courseId = req.params.id;
    const { institutionId } = req.body; // From frontend
    
    // Get the current course data
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const currentCourse = courseDoc.data();
    
    // Verify the course belongs to the institute making the request
    if (institutionId && currentCourse.instituteId !== institutionId) {
      return res.status(403).json({ error: 'Cannot update course from another institute' });
    }

    const updateData = { 
      ...req.body, 
      updatedAt: new Date().toISOString() 
    };

    // Map frontend fields to backend fields
    if (updateData.institutionId) {
      updateData.instituteId = updateData.institutionId;
      delete updateData.institutionId;
    }
    if (updateData.institutionName) {
      updateData.instituteName = updateData.institutionName;
      delete updateData.institutionName;
    }
    
    // Don't allow changing instituteId (course cannot be moved between institutes)
    delete updateData.instituteId;
    
    await db.collection('courses').doc(courseId).update(updateData);
    
    console.log(`✅ Course ${courseId} updated for institute ${currentCourse.instituteId}`);
    
    res.json({ 
      message: 'Course updated successfully',
      id: courseId
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// DELETE course by ID - verify institute ownership
router.delete('/:id', async (req, res) => {
  try {
    const courseId = req.params.id;
    const { instituteId } = req.query; // Changed to instituteId
    
    // Get the current course data
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const course = courseDoc.data();
    
    // Verify the course belongs to the institute making the request
    if (instituteId && course.instituteId !== instituteId) {
      return res.status(403).json({ error: 'Cannot delete course from another institute' });
    }

    await db.collection('courses').doc(courseId).delete();
    
    console.log(`🗑️ Course ${courseId} deleted from institute ${course.instituteId}`);
    
    res.json({ 
      message: 'Course deleted successfully',
      id: courseId
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// GET courses for students (public) - from ALL approved institutes
router.get('/public/active', async (req, res) => {
  try {
    // First get all approved institutes
    const institutesSnapshot = await db.collection('institutes')
      .where('status', '==', 'approved')
      .get();
    
    const approvedInstituteIds = institutesSnapshot.docs.map(doc => doc.id);
    
    if (approvedInstituteIds.length === 0) {
      return res.json([]);
    }
    
    // Get active courses from approved institutes
    const coursesSnapshot = await db.collection('courses')
      .where('instituteId', 'in', approvedInstituteIds) // Changed to instituteId
      .where('status', '==', 'active')
      .orderBy('name')
      .get();
    
    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`🎓 Found ${courses.length} active courses from ${approvedInstituteIds.length} approved institutes`);
    res.json(courses);
  } catch (error) {
    console.error('Error fetching active courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// GET courses by institute ID (public) - for browsing specific institute courses
router.get('/public/institute/:instituteId', async (req, res) => { // Changed to instituteId
  try {
    const { instituteId } = req.params; // Changed to instituteId
    
    // Verify institute exists and is approved
    const instituteDoc = await db.collection('institutes').doc(instituteId).get();
    if (!instituteDoc.exists) {
      return res.status(404).json({ error: 'Institute not found' });
    }
    
    const institute = instituteDoc.data();
    if (institute.status !== 'approved') {
      return res.status(403).json({ error: 'Institute not approved' });
    }

    // Get active courses for this specific institute
    const coursesSnapshot = await db.collection('courses')
      .where('instituteId', '==', instituteId) // Changed to instituteId
      .where('status', '==', 'active')
      .orderBy('name')
      .get();
    
    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`🏫 Found ${courses.length} active courses for institute ${instituteId}`);
    res.json(courses);
  } catch (error) {
    console.error('Error fetching institute courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

module.exports = router;
