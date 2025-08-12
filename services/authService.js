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
      const { doc, setDoc } = await import('firebase/firestore');
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
      await this.setDoc(this.doc(this.db, 'users', user.uid), {
        fullName: userData.fullName,
        studentId: userData.studentId,
        email: email,
        department: 'Computer Science',
        createdAt: new Date(),
        academicLevel: null, // Will be set during level selection
        levelDescription: null
      });

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

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
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

  // Listen to authentication state changes
  onAuthStateChange(callback) {
    if (!this.auth) {
      this.initialize().then(() => {
        return this.onAuthStateChanged(this.auth, callback);
      });
      return () => {}; // Return empty cleanup function
    }
    return this.onAuthStateChanged(this.auth, callback);
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