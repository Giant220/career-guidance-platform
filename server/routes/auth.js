const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// ✅ AUTH MIDDLEWARE for protected routes in this file
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No token provided for auth route');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    console.log('🔍 Verifying token in auth route...');
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    console.log('✅ Token verified for user:', decodedToken.email);
    next();
  } catch (error) {
    console.error('❌ Auth middleware error in auth route:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// User registration (public - no auth required)
router.post('/signup', async (req, res) => {
  try {
    console.log('=== SIGNUP REQUEST RECEIVED ===');
    console.log('Request body:', req.body);
    
    const { uid, email, fullName, phone, role } = req.body;

    // Validate UID
    if (!uid || typeof uid !== 'string' || uid.trim() === '') {
      console.log('❌ Invalid UID received:', uid);
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    console.log('✅ Valid UID received:', uid);

    const userData = {
      email: email,
      fullName: fullName,
      phone: phone,
      role: role,
      status: role === 'student' ? 'active' : 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('Saving user data to Firestore...');
    await db.collection('users').doc(uid).set(userData);
    console.log('✅ User data saved to Firestore');

    // 🚨 CRITICAL FIX: Create institution record if role is 'institute'
    if (role === 'institute') {
      console.log('🏫 Creating institution record...');
      
      const institutionData = {
        id: uid, // Use the same UID as institution ID
        name: fullName,
        email: email,
        phone: phone || '',
        type: 'College', // Default type
        location: 'Lesotho', // Default location
        website: '', // Empty for now
        status: 'pending', // Needs admin approval
        description: 'New institution awaiting approval',
        accreditation: 'Pending',
        established: new Date().getFullYear().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.collection('institutes').doc(uid).set(institutionData);
      console.log('✅ Institution record created with ID:', uid);
    }

    // 🚨 Also create company record if role is 'company'
    if (role === 'company') {
      console.log('🏢 Creating company record...');
      
      const companyData = {
        id: uid,
        name: fullName,
        email: email,
        phone: phone || '',
        type: 'Corporate',
        industry: 'General',
        website: '',
        location: 'Lesotho',
        description: 'New company awaiting approval',
        status: 'pending',
        contactPerson: fullName,
        size: '1-10 employees',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.collection('companies').doc(uid).set(companyData);
      console.log('✅ Company record created with ID:', uid);
    }

    res.json({ 
      success: true, 
      message: 'User registered successfully',
      user: userData
    });

  } catch (error) {
    console.error('❌ Error in user registration:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ FIXED: Get user data by UID (protected route - requires auth)
router.get('/user/:uid', authenticate, async (req, res) => {
  try {
    const { uid } = req.params;
    
    console.log('🔍 Fetching user with UID:', uid);
    console.log('🔍 Authenticated user:', req.user.uid);
    
    // ✅ SECURITY: Ensure user can only access their own data
    if (req.user.uid !== uid) {
      console.log('❌ Access denied: User trying to access different UID');
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!uid || uid === 'undefined') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      console.log('❌ User not found in Firestore for UID:', uid);
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    
    console.log('✅ User data found:', {
      uid: uid,
      email: userData.email,
      role: userData.role
    });
    
    res.json({
      uid: uid,
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role,
      status: userData.status
    });
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ✅ Add a health check endpoint (public)
router.get('/health', (req, res) => {
  res.json({ 
    status: 'Auth routes working',
    timestamp: new Date().toISOString(),
    endpoints: {
      'POST /signup': 'User registration',
      'GET /user/:uid': 'Get user data (protected)',
      'GET /health': 'Health check'
    }
  });
});

module.exports = router;
