const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// GET courses - STRICTLY filtered by instituteId (matching frontend)
router.get('/', async (req, res) => {
  try {
    const { instituteId, status } = req.query;
    
    console.log('🔍 Fetching courses for institute:', instituteId);
    
    // instituteId is REQUIRED - courses belong to specific institutes
    if (!instituteId) {
      return res.status(400).json({ error: 'instituteId is required' });
    }

    let query = db.collection('courses')
      .where('instituteId', '==', instituteId);

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
    console.error('❌ Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses: ' + error.message });
  }
});

// GET single course by ID
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('courses').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// CREATE new course - handle field mapping properly
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
      institutionId, // From frontend
      institutionName // From frontend
    } = req.body;

    console.log('🔍 Creating course with data:', { name, faculty, institutionId });

    // Validate required fields
    if (!name || !faculty || !duration || !fees || !description || !institutionId) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, faculty, duration, fees, description, institutionId' 
      });
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
      requirements: requirements && Array.isArray(requirements) ? requirements.filter(req => req.trim() !== '') : [],
      careerPaths: careerPaths && Array.isArray(careerPaths) ? careerPaths.filter(path => path.trim() !== '') : [],
      intake: intake || '',
      // Store with consistent field names
      instituteId: institutionId, // Map to instituteId
      instituteName: institutionName || instituteData.name,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection('courses').add(courseData);

    console.log(`✅ Created new course for institute ${institutionId}: ${name}`);

    // Return data in format frontend expects
    res.status(201).json({ 
      id: docRef.id, 
      ...courseData,
      message: 'Course created successfully' 
    });
  } catch (error) {
    console.error('❌ Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course: ' + error.message });
  }
});

// UPDATE course by ID
router.put('/:id', async (req, res) => {
  try {
    const courseId = req.params.id;
    const updateData = { 
      ...req.body, 
      updatedAt: new Date().toISOString() 
    };

    console.log('🔍 Updating course:', courseId, 'with data:', updateData);

    // Get the current course data
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Handle field mapping if frontend sends institutionId
    if (updateData.institutionId) {
      updateData.instituteId = updateData.institutionId;
      delete updateData.institutionId;
    }
    if (updateData.institutionName) {
      updateData.instituteName = updateData.institutionName;
      delete updateData.institutionName;
    }

    // Clean up arrays
    if (updateData.requirements && Array.isArray(updateData.requirements)) {
      updateData.requirements = updateData.requirements.filter(req => req.trim() !== '');
    }
    if (updateData.careerPaths && Array.isArray(updateData.careerPaths)) {
      updateData.careerPaths = updateData.careerPaths.filter(path => path.trim() !== '');
    }

    await db.collection('courses').doc(courseId).update(updateData);
    
    console.log(`✅ Course ${courseId} updated successfully`);
    
    res.json({ 
      message: 'Course updated successfully',
      id: courseId
    });
  } catch (error) {
    console.error('❌ Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course: ' + error.message });
  }
});

// DELETE course by ID
router.delete('/:id', async (req, res) => {
  try {
    const courseId = req.params.id;
    
    console.log('🔍 Deleting course:', courseId);

    // Check if course exists
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    await db.collection('courses').doc(courseId).delete();
    
    console.log(`🗑️ Course ${courseId} deleted successfully`);
    
    res.json({ 
      message: 'Course deleted successfully',
      id: courseId
    });
  } catch (error) {
    console.error('❌ Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course: ' + error.message });
  }
});

// GET courses for students (public) - from ALL approved institutes
router.get('/public/active', async (req, res) => {
  try {
    console.log('🔍 Fetching public active courses');
    
    // First get all approved institutes
    const institutesSnapshot = await db.collection('institutes')
      .where('status', '==', 'approved')
      .get();
    
    const approvedInstituteIds = institutesSnapshot.docs.map(doc => doc.id);
    
    console.log(`🏫 Found ${approvedInstituteIds.length} approved institutes`);
    
    if (approvedInstituteIds.length === 0) {
      return res.json([]);
    }
    
    // Get active courses from approved institutes
    const coursesSnapshot = await db.collection('courses')
      .where('instituteId', 'in', approvedInstituteIds)
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
    console.error('❌ Error fetching active courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses: ' + error.message });
  }
});

// GET courses by institute ID (public) - for browsing specific institute courses
router.get('/public/institute/:instituteId', async (req, res) => {
  try {
    const { instituteId } = req.params;
    
    console.log('🔍 Fetching public courses for institute:', instituteId);
    
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
      .where('instituteId', '==', instituteId)
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
    console.error('❌ Error fetching institute courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses: ' + error.message });
  }
});

// Debug endpoint to check courses collection
router.get('/debug/all', async (req, res) => {
  try {
    const snapshot = await db.collection('courses').get();
    const courses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      total: courses.length,
      courses: courses
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
