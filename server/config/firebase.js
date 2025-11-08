const admin = require('firebase-admin');
const path = require('path');

// For Render - file is in root directory
const serviceAccount = require('../../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://career-bridge-lesotho.firebaseio.com'
});

module.exports = admin;
