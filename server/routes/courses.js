const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// GET courses - STRICTLY filtered by institutionId
router.get('/', async (req, res) => {
  try {
    const { institutionId, status } = req.query;
    
    // institutionId is REQUIRED - courses belong to specific institutions
    if (!institutionId) {
      return res.status(400).json({ error: 'institutionId is required' });
    }

    let query = db.collection('courses')
      .where('institutionId', '==', institutionId);

    // Optional status filter
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const courses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`📚 Found ${courses.length} courses for institution ${institutionId}`);
    res.status(200).json(courses);

  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// GET single course by ID - with institution verification
router.get('/:id', async (req, res) => {
  try {
    const { institutionId } = req.query; // Optional: verify course belongs to institution
    
    const doc = await db.collection('courses').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = doc.data();
    
    // If institutionId provided, verify the course belongs to that institution
    if (institutionId && course.institutionId !== institutionId) {
      return res.status(403).json({ error: 'Course does not belong to this institution' });
    }

    res.json({ id: doc.id, ...course });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// CREATE new course - automatically sets institutionId
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
      institutionId, // REQUIRED - which institution owns this course
      institutionName
    } = req.body;

    // Validate required fields
    if (!name || !faculty || !duration || !fees || !description || !institutionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify the institution exists
    const institutionDoc = await db.collection('institutes').doc(institutionId).get();
    if (!institutionDoc.exists) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    const institutionData = institutionDoc.data();

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
      institutionId, // This ties the course to the institution
      institutionName: institutionName || institutionData.name,
      status: 'pending', // Courses are pending until institution is approved
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection('courses').add(courseData);

    console.log(`✅ Created new course for institution ${institutionId}: ${name}`);

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

// UPDATE course by ID - verify institution ownership
router.put('/:id', async (req, res) => {
  try {
    const courseId = req.params.id;
    const { institutionId } = req.body; // Should come from authenticated institute
    
    // Get the current course data
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const currentCourse = courseDoc.data();
    
    // Verify the course belongs to the institution making the request
    if (institutionId && currentCourse.institutionId !== institutionId) {
      return res.status(403).json({ error: 'Cannot update course from another institution' });
    }

    const updateData = { 
      ...req.body, 
      updatedAt: new Date().toISOString() 
    };

    // Don't allow changing institutionId (course cannot be moved between institutions)
    delete updateData.institutionId;
    
    await db.collection('courses').doc(courseId).update(updateData);
    
    console.log(`✅ Course ${courseId} updated for institution ${currentCourse.institutionId}`);
    
    res.json({ 
      message: 'Course updated successfully',
      id: courseId
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// DELETE course by ID - verify institution ownership
router.delete('/:id', async (req, res) => {
  try {
    const courseId = req.params.id;
    const { institutionId } = req.query; // Should come from authenticated institute
    
    // Get the current course data
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const course = courseDoc.data();
    
    // Verify the course belongs to the institution making the request
    if (institutionId && course.institutionId !== institutionId) {
      return res.status(403).json({ error: 'Cannot delete course from another institution' });
    }

    await db.collection('courses').doc(courseId).delete();
    
    console.log(`🗑️ Course ${courseId} deleted from institution ${course.institutionId}`);
    
    res.json({ 
      message: 'Course deleted successfully',
      id: courseId
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// GET courses for students (public) - from ALL approved institutions
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
      .where('institutionId', 'in', approvedInstituteIds)
      .where('status', '==', 'active')
      .orderBy('name')
      .get();
    
    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`🎓 Found ${courses.length} active courses from ${approvedInstituteIds.length} approved institutions`);
    res.json(courses);
  } catch (error) {
    console.error('Error fetching active courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// GET courses by institution ID (public) - for browsing specific institution courses
router.get('/public/institution/:institutionId', async (req, res) => {
  try {
    const { institutionId } = req.params;
    
    // Verify institution exists and is approved
    const institutionDoc = await db.collection('institutes').doc(institutionId).get();
    if (!institutionDoc.exists) {
      return res.status(404).json({ error: 'Institution not found' });
    }
    
    const institution = institutionDoc.data();
    if (institution.status !== 'approved') {
      return res.status(403).json({ error: 'Institution not approved' });
    }

    // Get active courses for this specific institution
    const coursesSnapshot = await db.collection('courses')
      .where('institutionId', '==', institutionId)
      .where('status', '==', 'active')
      .orderBy('name')
      .get();
    
    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`🏫 Found ${courses.length} active courses for institution ${institutionId}`);
    res.json(courses);
  } catch (error) {
    console.error('Error fetching institution courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

module.exports = router;
