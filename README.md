# Career Bridge Lesotho

A comprehensive career guidance and employment integration platform for Lesotho.

## Setup Instructions

### 1. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project "Career Bridge Lesotho"
3. Enable Authentication (Email/Password)
4. Create Firestore Database
5. Download service account key and replace `firebase/config/firebase-service-account.json`

### 2. Local Development
```bash
# Install dependencies
cd client && npm install
cd ../server && npm install

# Run development
cd client && npm start  # Frontend on :3000
cd server && npm run dev  # Backend on :5000