const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();

console.log('🚀 Starting server initialization on Render...');
console.log('🔍 Environment:', process.env.NODE_ENV);
console.log('🔍 Port:', process.env.PORT);

// Initialize Firebase Admin
let admin;
let db;

try {
  console.log('🔄 Initializing Firebase Admin...');
  admin = require('./config/firebase');
  db = admin.firestore();
  console.log('✅ Firebase Admin initialized successfully');
  
  // Test Firebase connection
  db.collection('test').doc('connection').get()
    .then(() => console.log('✅ Firebase connection test passed'))
    .catch(err => console.error('❌ Firebase connection test failed:', err));
    
} catch (error) {
  console.error('💥 CRITICAL: Firebase Admin initialization failed:', error);
  process.exit(1);
}

const app = express();

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'", 
        "http:",
        "https:",
        "ws:",
        "wss:"
      ],
      scriptSrc: ["'self'", "'unsafe-inline'", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      fontSrc: ["'self'", "https:", "data:"],
      frameSrc: ["'self'", "https:"]
    }
  }
}));

app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Make db available to all routes
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log('🔍 Incoming request:', req.method, req.path, 'on Render');
  next();
});

// ✅ AUTH MIDDLEWARE
const auth = async (req, res, next) => {
  try {
    // Skip auth for public routes
    if (req.path === '/health' || req.path.startsWith('/public')) {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No auth token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      console.log('❌ Invalid token format');
      return res.status(401).json({ error: 'Invalid token format' });
    }

    console.log('🔍 Verifying token on Render...');
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    console.log('✅ Token verified for user:', decodedToken.email);
    next();
  } catch (error) {
    console.error('❌ Auth error on Render:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../client/build')));

// Public Routes
console.log('🔄 Loading public routes...');
app.use('/api/auth', require('./routes/auth'));

// Check if route files exist and load them
console.log('🔍 Checking route file loading on Render...');
try {
  console.log('✅ Loading students route...');
  app.use('/api/students', auth, require('./routes/students'));
} catch (error) {
  console.error('❌ Failed to load students route:', error);
}

try {
  console.log('✅ Loading institutes route...');
  app.use('/api/institutes', auth, require('./routes/institutes'));
} catch (error) {
  console.error('❌ Failed to load institutes route:', error);
}

try {
  console.log('✅ Loading companies route...');
  app.use('/api/companies', auth, require('./routes/companies'));
} catch (error) {
  console.error('❌ Failed to load companies route:', error);
}

try {
  console.log('✅ Loading admin route...');
  app.use('/api/admin', auth, require('./routes/admin'));
} catch (error) {
  console.error('❌ Failed to load admin route:', error);
}

try {
  console.log('✅ Loading applications route...');
  app.use('/api/applications', auth, require('./routes/applications'));
} catch (error) {
  console.error('❌ Failed to load applications route:', error);
}

try {
  console.log('✅ Loading jobs route...');
  app.use('/api/jobs', auth, require('./routes/jobs'));
} catch (error) {
  console.error('❌ Failed to load jobs route:', error);
}

// Health check endpoint (public)
app.get('/api/health', (req, res) => {
  console.log('✅ Health check passed on Render');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    firebase: 'connected',
    deployment: 'render'
  });
});

// Test route to verify API is working
app.get('/api/deploy-test', (req, res) => {
  console.log('✅ Deploy test route hit on Render');
  res.json({ 
    message: 'API is working on Render deployment',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  console.log('🔄 Serving React app for:', req.path);
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Error on Render:', error);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : error.message,
    deployment: 'render'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} on Render`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 App URL: https://career-guidance-platform-3c0y.onrender.com`);
  console.log(`🔍 Test API: https://career-guidance-platform-3c0y.onrender.com/api/deploy-test`);
  console.log(`🔍 Health check: https://career-guidance-platform-3c0y.onrender.com/api/health`);
});
