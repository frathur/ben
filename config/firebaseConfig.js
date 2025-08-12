import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
// Replace these values with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyCslfTN6E517THNrf4KAs4L8DzVgu5aIpQ",
    authDomain: "uniconnect-cedf3.firebaseapp.com",
    projectId: "uniconnect-cedf3",
    storageBucket: "uniconnect-cedf3.firebasestorage.app",
    messagingSenderId: "682619823833",
    appId: "1:682619823833:web:e281e93bbf5b53e0a440c8",
    measurementId: "G-V879DBCXEH"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth (React Native handles persistence automatically)
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };
export default app; 