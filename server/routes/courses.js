const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// GET courses - SIMPLIFIED and robust
router.get('/', async (req, res) => {
  try {
    const { instituteId } = req.query;
    
    console.log('🔍 GET /api/courses - instituteId:', instituteId);
    
    if (!instituteId) {
      return res.status(400).json({ error: 'instituteId query parameter is required' });
    }

    // SIMPLE query without complex filtering first
    const snapshot = await db.collection('courses')
      .where('instituteId', '==', instituteId)
      .get();

    const courses = [];
    snapshot.forEach(doc => {
      courses.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`✅ Found ${courses.length} courses for institute ${instituteId}`);
    res.json(courses);

  } catch (error) {
    console.error('❌ CRITICAL ERROR in GET /api/courses:', error);
    console.error('Error stack:', error.stack);
    
    // Return specific error message
    res.status(500).json({ 
      error: 'Internal server error while fetching courses',
      message: error.message,
      code: error.code
    });
  }
});

// CREATE new course - SIMPLIFIED
router.post('/', async (req, res) => {
  try {
    console.log('🔍 POST /api/courses - Request body:', JSON.stringify(req.body));
    
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
      institutionId,
      institutionName
    } = req.body;

    // Basic validation
    if (!name || !faculty || !duration || !fees || !description || !institutionId) {
      return res.status(400).json({ 
        error: 'Missing required fields. Required: name, faculty, duration, fees, description, institutionId' 
      });
    }

    const courseData = {
      name: name.toString().trim(),
      faculty: faculty.toString().trim(),
      duration: duration.toString().trim(),
      fees: fees.toString().trim(),
      credits: credits ? credits.toString().trim() : '',
      description: description.toString().trim(),
      requirements: Array.isArray(requirements) ? requirements.filter(r => r && r.toString().trim()) : [],
      careerPaths: Array.isArray(careerPaths) ? careerPaths.filter(c => c && c.toString().trim()) : [],
      intake: intake ? intake.toString().trim() : '',
      instituteId: institutionId, // Map to backend field
      instituteName: institutionName || 'Unknown Institute',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('✅ Course data to save:', courseData);

    const docRef = await db.collection('courses').add(courseData);
    const courseId = docRef.id;

    console.log(`✅ Course created successfully: ${courseId}`);

    res.status(201).json({ 
      id: courseId,
      ...courseData,
      message: 'Course created successfully' 
    });

  } catch (error) {
    console.error('❌ CRITICAL ERROR in POST /api/courses:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Internal server error while creating course',
      message: error.message
    });
  }
});

// GET single course
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

// UPDATE course
router.put('/:id', async (req, res) => {
  try {
    const courseId = req.params.id;
    const updateData = { 
      ...req.body, 
      updatedAt: new Date().toISOString() 
    };

    // Handle field mapping
    if (updateData.institutionId) {
      updateData.instituteId = updateData.institutionId;
      delete updateData.institutionId;
    }
    if (updateData.institutionName) {
      updateData.instituteName = updateData.institutionName;
      delete updateData.institutionName;
    }

    await db.collection('courses').doc(courseId).update(updateData);
    
    res.json({ 
      message: 'Course updated successfully',
      id: courseId
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// DELETE course
router.delete('/:id', async (req, res) => {
  try {
    await db.collection('courses').doc(req.params.id).delete();
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// HEALTH CHECK endpoint for courses
router.get('/health/test', async (req, res) => {
  try {
    // Test basic Firestore connection
    const testDoc = await db.collection('courses').doc('test').get();
    
    res.json({
      status: 'OK',
      message: 'Courses API is working',
      firestore: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Courses API health check failed',
      error: error.message
    });
  }
});

// INITIALIZE courses collection if empty
router.post('/initialize', async (req, res) => {
  try {
    // Check if courses collection exists and has any data
    const snapshot = await db.collection('courses').limit(1).get();
    
    if (snapshot.empty) {
      console.log('📝 Courses collection is empty - initializing...');
      // Add a test course or just return success
      res.json({ 
        message: 'Courses collection is ready', 
        initialized: true 
      });
    } else {
      res.json({ 
        message: 'Courses collection already has data', 
        count: snapshot.size 
      });
    }
  } catch (error) {
    console.error('Initialization error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
