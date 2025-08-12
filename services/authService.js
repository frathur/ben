// Simple auth service for Firebase
export class AuthService {
  constructor() {
    this.auth = null;
    this.db = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Dynamically import Firebase modules
      const { auth } = await import('../config/firebaseConfig');
      const { 
        createUserWithEmailAndPassword, 
        signInWithEmailAndPassword, 
        signOut, 
        sendPasswordResetEmail,
        updateProfile,
        onAuthStateChanged 
      } = await import('firebase/auth');
      const { doc, setDoc, getDoc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../config/firebaseConfig');

      this.auth = auth;
      this.db = db;
      this.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
      this.signInWithEmailAndPassword = signInWithEmailAndPassword;
      this.signOut = signOut;
      this.sendPasswordResetEmail = sendPasswordResetEmail;
      this.updateProfile = updateProfile;
      this.onAuthStateChanged = onAuthStateChanged;
      this.doc = doc;
      this.setDoc = setDoc;
      this.getDoc = getDoc;
      this.updateDoc = updateDoc;
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      throw error;
    }
  }

  // Sign up with email and password
  async signUp(email, password, userData) {
    try {
      await this.initialize();
      
      const userCredential = await this.createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      // Update user profile with display name
      await this.updateProfile(user, {
        displayName: userData.fullName
      });

      // Save additional user data to Firestore
      const userDocData = {
        fullName: userData.fullName,
        identifier: userData.identifier, // Student ID or Staff ID
        email: email,
        department: 'Computer Science',
        userType: userData.userType, // 'student' or 'lecturer'
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add user-type specific data
      if (userData.userType === 'student') {
        userDocData.academicLevel = userData.academicLevel;
        userDocData.levelDescription = this.getLevelDescription(userData.academicLevel);
      } else if (userData.userType === 'lecturer') {
        userDocData.teachingCourses = userData.teachingCourses;
        userDocData.title = 'Lecturer'; // Default title
      }

      await this.setDoc(this.doc(this.db, 'users', user.uid), userDocData);

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          ...userData
        }
      };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Sign in with email and password
  async signIn(email, password) {
    try {
      await this.initialize();
      
      const userCredential = await this.signInWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      // Fetch user data from Firestore
      const userData = await this.getUserData(user.uid);

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          ...userData
        }
      };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Sign out
  async signOutUser() {
    try {
      await this.initialize();
      await this.signOut(this.auth);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Send password reset email
  async sendPasswordReset(email) {
    try {
      await this.initialize();
      await this.sendPasswordResetEmail(this.auth, email);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Get current user
  getCurrentUser() {
    return this.auth?.currentUser || null;
  }

  // Get user data from Firestore
  async getUserData(uid) {
    try {
      await this.initialize();
      const userDoc = await this.getDoc(this.doc(this.db, 'users', uid));
      
      if (userDoc.exists()) {
        return userDoc.data();
      } else {
        // If user document doesn't exist, create a basic one (default to student)
        const basicUserData = {
          fullName: this.auth.currentUser?.displayName || 'Student',
          identifier: 'CST' + Math.floor(Math.random() * 100000).toString().padStart(5, '0'),
          email: this.auth.currentUser?.email,
          department: 'Computer Science',
          userType: 'student', // Default to student
          academicLevel: '100', // Default level
          levelDescription: 'First Year - Foundation',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await this.setDoc(this.doc(this.db, 'users', uid), basicUserData);
        return basicUserData;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }

  // Update user data in Firestore
  async updateUserData(uid, userData) {
    try {
      await this.initialize();
      await this.updateDoc(this.doc(this.db, 'users', uid), {
        ...userData,
        updatedAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating user data:', error);
      return { success: false, error: error.message };
    }
  }

  // Get level description
  getLevelDescription(level) {
    const descriptions = {
      '100': 'First Year - Foundation',
      '200': 'Second Year - Core Fundamentals', 
      '300': 'Third Year - Specialization',
      '400': 'Fourth Year - Advanced Studies'
    };
    return descriptions[level] || 'Computer Science Student';
  }

  // Listen to authentication state changes
  onAuthStateChange(callback) {
    if (!this.auth) {
      this.initialize().then(() => {
        return this.onAuthStateChanged(this.auth, (firebaseUser) => {
          if (firebaseUser) {
            // Fetch user data from Firestore when auth state changes
            this.getUserData(firebaseUser.uid).then(userData => {
              callback({
                ...firebaseUser,
                userData
              });
            });
          } else {
            callback(null);
          }
        });
      });
      return () => {}; // Return empty cleanup function
    }
    return this.onAuthStateChanged(this.auth, (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user data from Firestore when auth state changes
        this.getUserData(firebaseUser.uid).then(userData => {
          callback({
            ...firebaseUser,
            userData
          });
        });
      } else {
        callback(null);
      }
    });
  }

  // Convert Firebase error codes to user-friendly messages
  getErrorMessage(errorCode) {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'This email address is already registered. Please use a different email or try signing in.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled. Please contact support.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/user-not-found':
        return 'No account found with this email address. Please check your email or sign up.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again or reset your password.';
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection and try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}

export default new AuthService(); 