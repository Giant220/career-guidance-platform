const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// GET courses with optional filtering
router.get('/', async (req, res) => {
  try {
    const { institutionId, status } = req.query;
    let query = db.collection('courses');
    
    // Filter by institution if provided
    if (institutionId) {
      query = query.where('institutionId', '==', institutionId);
    }
    
    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const courses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(courses);

  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
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

// CREATE new course
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
      institutionId,
      institutionName
    } = req.body;

    // Validate required fields
    if (!name || !faculty || !duration || !fees || !description || !institutionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

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
      institutionId,
      institutionName: institutionName || '',
      status: 'pending', // Courses start as pending until institute is approved
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection('courses').add(courseData);

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

// UPDATE course by ID
router.put('/:id', async (req, res) => {
  try {
    const courseId = req.params.id;
    const updateData = { 
      ...req.body, 
      updatedAt: new Date().toISOString() 
    };
    
    // Check if course exists
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Update the course
    await db.collection('courses').doc(courseId).update(updateData);
    
    console.log(`✅ Course ${courseId} updated`);
    
    res.json({ 
      message: 'Course updated successfully',
      id: courseId
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// DELETE course by ID
router.delete('/:id', async (req, res) => {
  try {
    const courseId = req.params.id;
    
    // Check if course exists
    const courseDoc = await db.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    await db.collection('courses').doc(courseId).delete();
    
    res.json({ 
      message: 'Course deleted successfully',
      id: courseId
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// GET courses for students (only active ones from approved institutes)
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
    
    res.json(courses);
  } catch (error) {
    console.error('Error fetching active courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

module.exports = router;
