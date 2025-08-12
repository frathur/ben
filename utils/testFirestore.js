// Test Firestore connection and operations
import { db } from '../config/firebaseConfig';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

export async function testFirestoreConnection() {
  try {
    console.log('🔥 Testing Firestore connection...');
    
    // Test 1: Add a test document
    const testDoc = await addDoc(collection(db, 'test'), {
      message: 'Hello Firestore!',
      timestamp: new Date(),
      userType: 'test'
    });
    console.log('✅ Test document created with ID:', testDoc.id);
    
    // Test 2: Query test documents
    const q = query(collection(db, 'test'), where('userType', '==', 'test'));
    const querySnapshot = await getDocs(q);
    console.log('✅ Query successful, found', querySnapshot.size, 'documents');
    
    // Test 3: Check if users collection exists
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log('✅ Users collection check:', usersSnapshot.size, 'users found');
    
    console.log('🎉 Firestore is working perfectly!');
    return true;
    
  } catch (error) {
    console.error('❌ Firestore test failed:', error);
    return false;
  }
}

// Call this function in your app to test
// testFirestoreConnection();
