const admin = require('firebase-admin');
const serviceAccount = require('../config/firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const createAllAuthAccounts = async () => {
  console.log('🔐 Creating authentication accounts for all entities...');

  try {
    await createInstitutionAccounts();
    await createCompanyAccounts();
    await createAdminAccounts();
    await createDemoAccounts();

    console.log('\n🎉 All authentication accounts created successfully!');
    
  } catch (error) {
    console.error('💥 Script failed:', error);
  }
};

const createInstitutionAccounts = async () => {
  console.log('\n📚 Creating institution accounts...');

  try {
    const institutionsSnapshot = await db.collection('institutions').get();
    
    if (institutionsSnapshot.empty) {
      console.log('❌ No institutions found in database');
      return;
    }

    console.log(`📚 Found ${institutionsSnapshot.size} institutions`);

    for (const doc of institutionsSnapshot.docs) {
      const institution = doc.data();
      const institutionId = doc.id;
      
      console.log(`\n🏫 Processing: ${institution.name}`);

      try {
        // Check if user already exists in Firebase Auth
        let user;
        try {
          user = await admin.auth().getUserByEmail(institution.email);
          console.log(`   ✅ Auth account already exists: ${institution.email}`);
        } catch (error) {
          if (error.code === 'auth/user-not-found') {
            // Create new auth user
            user = await admin.auth().createUser({
              email: institution.email,
              password: 'password123',
              displayName: institution.name,
              disabled: false
            });
            console.log(`   ✅ Created auth account: ${institution.email} / password123`);
          } else {
            throw error;
          }
        }

        // Create/update user document in Firestore
        await db.collection('users').doc(user.uid).set({
          uid: user.uid,
          email: institution.email,
          fullName: institution.name,
          phone: institution.phone || '',
          role: 'institute',
          status: 'active',
          institutionId: institutionId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });

        console.log(`   ✅ Updated Firestore user record`);

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('💥 Institution account creation failed:', error);
  }
};

const createCompanyAccounts = async () => {
  console.log('\n💼 Creating company accounts...');

  try {
    const companiesSnapshot = await db.collection('companies').get();
    
    if (companiesSnapshot.empty) {
      console.log('❌ No companies found in database');
      return;
    }

    console.log(`💼 Found ${companiesSnapshot.size} companies`);

    for (const doc of companiesSnapshot.docs) {
      const company = doc.data();
      const companyId = doc.id;
      
      console.log(`\n🏢 Processing: ${company.name}`);

      try {
        // Check if user already exists in Firebase Auth
        let user;
        try {
          user = await admin.auth().getUserByEmail(company.email);
          console.log(`   ✅ Auth account already exists: ${company.email}`);
        } catch (error) {
          if (error.code === 'auth/user-not-found') {
            // Create new auth user
            user = await admin.auth().createUser({
              email: company.email,
              password: 'password123',
              displayName: company.name,
              disabled: false
            });
            console.log(`   ✅ Created auth account: ${company.email} / password123`);
          } else {
            throw error;
          }
        }

        // Create/update user document in Firestore
        await db.collection('users').doc(user.uid).set({
          uid: user.uid,
          email: company.email,
          fullName: company.name,
          phone: company.phone || '',
          role: 'company',
          status: 'active',
          companyId: companyId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });

        console.log(`   ✅ Updated Firestore user record`);

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('💥 Company account creation failed:', error);
  }
};

const createAdminAccounts = async () => {
  console.log('\n👨‍💼 Creating admin accounts...');

  const adminAccounts = [
    {
      email: 'admin@careerbridge.ls',
      name: 'System Administrator',
      password: 'admin123'
    },
    {
      email: 'superadmin@careerbridge.ls', 
      name: 'Super Administrator',
      password: 'admin123'
    }
  ];

  for (const adminAcc of adminAccounts) {
    console.log(`\n👨‍💼 Processing: ${adminAcc.name}`);

    try {
      // Check if user already exists in Firebase Auth
      let user;
      try {
        user = await admin.auth().getUserByEmail(adminAcc.email);
        console.log(`   ✅ Auth account already exists: ${adminAcc.email}`);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          // Create new auth user
          user = await admin.auth().createUser({
            email: adminAcc.email,
            password: adminAcc.password,
            displayName: adminAcc.name,
            disabled: false
          });
          console.log(`   ✅ Created auth account: ${adminAcc.email} / ${adminAcc.password}`);
        } else {
          throw error;
        }
      }

      // Create/update user document in Firestore
      await db.collection('users').doc(user.uid).set({
        uid: user.uid,
        email: adminAcc.email,
        fullName: adminAcc.name,
        phone: '+26650000000',
        role: 'admin',
        status: 'active',
        permissions: ['manage_users', 'manage_institutions', 'manage_companies', 'view_reports'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      console.log(`   ✅ Updated Firestore user record`);

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
};

const createDemoAccounts = async () => {
  console.log('\n🎭 Creating demo accounts...');

  const demoAccounts = [
    // Student demo accounts
    {
      email: 'student@demo.com',
      name: 'Demo Student',
      password: 'password123',
      role: 'student'
    },
    {
      email: 'mosebo@student.com',
      name: 'Mosebo Student',
      password: 'password123', 
      role: 'student'
    },
    
    // Institution demo accounts
    {
      email: 'institution@demo.com',
      name: 'Demo Institution',
      password: 'password123',
      role: 'institute'
    },
    {
      email: 'techcollege@demo.com',
      name: 'Tech College Demo',
      password: 'password123',
      role: 'institute'
    },
    
    // Company demo accounts  
    {
      email: 'company@demo.com',
      name: 'Demo Company',
      password: 'password123',
      role: 'company'
    },
    {
      email: 'recruiter@demo.com',
      name: 'Demo Recruiter',
      password: 'password123',
      role: 'company'
    }
  ];

  for (const demoAcc of demoAccounts) {
    console.log(`\n🎭 Processing: ${demoAcc.name}`);

    try {
      // Check if user already exists in Firebase Auth
      let user;
      try {
        user = await admin.auth().getUserByEmail(demoAcc.email);
        console.log(`   ✅ Auth account already exists: ${demoAcc.email}`);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          // Create new auth user
          user = await admin.auth().createUser({
            email: demoAcc.email,
            password: demoAcc.password,
            displayName: demoAcc.name,
            disabled: false
          });
          console.log(`   ✅ Created auth account: ${demoAcc.email} / ${demoAcc.password}`);
        } else {
          throw error;
        }
      }

      // Create/update user document in Firestore
      await db.collection('users').doc(user.uid).set({
        uid: user.uid,
        email: demoAcc.email,
        fullName: demoAcc.name,
        phone: '+26650000000',
        role: demoAcc.role,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      console.log(`   ✅ Updated Firestore user record`);

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
};

// Run the complete script
createAllAuthAccounts().then(() => {
  console.log('\n🚀 All authentication accounts are ready!');
  console.log('\n📋 Login Credentials Summary:');
  console.log('\n👨‍💼 ADMIN ACCOUNTS:');
  console.log('   admin@careerbridge.ls / admin123');
  console.log('   superadmin@careerbridge.ls / admin123');
  
  console.log('\n🎭 DEMO ACCOUNTS:');
  console.log('   student@demo.com / password123');
  console.log('   institution@demo.com / password123');
  console.log('   company@demo.com / password123');
  console.log('   techcollege@demo.com / password123');
  console.log('   recruiter@demo.com / password123');
  console.log('   mosebo@student.com / password123');
  
  console.log('\n📚 INSTITUTIONS (use password123 for all):');
  console.log('   admissions@nul.ls');
  console.log('   info@limkokwing.ls');
  console.log('   info@cas.ac.ls');
  console.log('   admissions@lce.ac.ls');
  console.log('   lesotho@bothouniversity.com');
  console.log('   info@nhtc.ls');
  console.log('   principal@lac.ac.ls');
  console.log('   info@lerotholipoly.ac.ls');
  
  console.log('\n💼 COMPANIES (use password123 for all):');
  console.log('   careers@standardbank.ls');
  console.log('   recruitment@vodacom.co.ls');
  console.log('   hr@health.gov.ls');
  console.log('   hr@letseng.co.ls');
  
  console.log('\n🎉 You can now login with any of these accounts!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});