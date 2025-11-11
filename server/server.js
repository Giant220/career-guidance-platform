const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();

// Initialize Firebase Admin WITH ERROR HANDLING
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
  console.error('This will break all database operations!');
  
  // Create mock db to prevent crashes but log all errors
  db = {
    collection: (name) => ({
      doc: (id) => ({
        get: () => {
          console.error(`❌ Firebase not initialized - attempted to get doc: ${name}/${id}`);
          return Promise.reject(new Error('Firebase not initialized'));
        },
        set: (data) => {
          console.error(`❌ Firebase not initialized - attempted to set doc: ${name}/${id}`);
          return Promise.reject(new Error('Firebase not initialized'));
        },
        update: (data) => {
          console.error(`❌ Firebase not initialized - attempted to update doc: ${name}/${id}`);
          return Promise.reject(new Error('Firebase not initialized'));
        },
        delete: () => {
          console.error(`❌ Firebase not initialized - attempted to delete doc: ${name}/${id}`);
          return Promise.reject(new Error('Firebase not initialized'));
        }
      }),
      where: () => ({
        get: () => {
          console.error(`❌ Firebase not initialized - attempted to query collection: ${name}`);
          return Promise.reject(new Error('Firebase not initialized'));
        },
        orderBy: () => ({
          get: () => {
            console.error(`❌ Firebase not initialized - attempted to query collection: ${name}`);
            return Promise.reject(new Error('Firebase not initialized'));
          }
        })
      }),
      get: () => {
        console.error(`❌ Firebase not initialized - attempted to get collection: ${name}`);
        return Promise.reject(new Error('Firebase not initialized'));
      },
      add: (data) => {
        console.error(`❌ Firebase not initialized - attempted to add to collection: ${name}`);
        return Promise.reject(new Error('Firebase not initialized'));
      }
    })
  };
}

const app = express();

// Security Middleware - Public access friendly
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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
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

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../client/build')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/institutes', require('./routes/institutes'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/jobs', require('./routes/jobs'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    firebase: db ? 'Firebase connected' : 'Firebase failed'
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : error.message 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
});
