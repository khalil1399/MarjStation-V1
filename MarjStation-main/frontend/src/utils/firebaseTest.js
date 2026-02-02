import { ref, set, get } from 'firebase/database';
import { database } from '../config/firebase';

export const testFirebaseConnection = async () => {
  const results = {
    initialized: false,
    canRead: false,
    canWrite: false,
    databaseURL: null,
    errors: []
  };

  try {
    // Test if Firebase is initialized
    if (database) {
      results.initialized = true;
      results.databaseURL = database.app.options.databaseURL || 'NOT CONFIGURED';
      console.log('✅ Firebase initialized');
      console.log('📍 Database URL:', results.databaseURL);
      
      if (!database.app.options.databaseURL) {
        results.errors.push('⚠️ CRITICAL: databaseURL is missing in Firebase config!');
        results.errors.push('Without databaseURL, data cannot be saved to Firebase Realtime Database');
        return results;
      }
    } else {
      results.errors.push('Firebase database not initialized');
      return results;
    }

    // Test read permission
    try {
      const testRef = ref(database, 'connectionTest');
      await get(testRef);
      results.canRead = true;
      console.log('✅ Can read from database');
    } catch (error) {
      results.errors.push(`Read failed: ${error.message}`);
      console.error('❌ Cannot read:', error);
    }

    // Test write permission
    try {
      const testRef = ref(database, 'connectionTest');
      const testData = {
        message: 'Connection test successful',
        timestamp: new Date().toISOString(),
        testId: Math.random().toString(36).substring(7)
      };
      
      console.log('🔄 Writing test data:', testData);
      await set(testRef, testData);
      results.canWrite = true;
      console.log('✅ Can write to database');
      
      // Verify the write by reading it back
      const snapshot = await get(testRef);
      if (snapshot.exists()) {
        const readData = snapshot.val();
        console.log('✅ Data verified:', readData);
        if (readData.testId === testData.testId) {
          console.log('✅ Write-Read cycle successful!');
        }
      }
    } catch (error) {
      results.errors.push(`Write failed: ${error.message}`);
      console.error('❌ Cannot write:', error);
      
      if (error.code === 'PERMISSION_DENIED') {
        results.errors.push('PERMISSION_DENIED - Update Firebase database rules!');
        results.errors.push('See /app/FIREBASE_SETUP_REQUIRED.md for instructions');
      }
    }

  } catch (error) {
    results.errors.push(`General error: ${error.message}`);
    console.error('❌ General error:', error);
  }

  return results;
};

export const checkFirebaseSetup = () => {
  console.log('=== Firebase Configuration ===');
  console.log('Project ID:', 'marjstation-49e10');
  console.log('Database URL:', database?.app?.options?.databaseURL || '⚠️ NOT CONFIGURED');
  console.log('Auth Domain:', database?.app?.options?.authDomain || 'Not configured');
  console.log('Storage Bucket:', database?.app?.options?.storageBucket || 'Not configured');
  console.log('============================');
  
  if (!database?.app?.options?.databaseURL) {
    console.error('🚨 CRITICAL ERROR: databaseURL is missing!');
    console.error('Add this to firebaseConfig: databaseURL: "https://marjstation-49e10-default-rtdb.firebaseio.com"');
  }
};
