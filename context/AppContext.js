import React, { createContext, useContext, useState, useEffect } from 'react';
import { dummyData } from '../data/dummyData';
import authService from '../services/authService';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState(dummyData.notifications);
  const [chatMessages, setChatMessages] = useState(dummyData.chatMessages);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to authentication state changes
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in - load their profile data
        try {
          // For now, create user with basic info
          // In a real app, you would fetch from Firestore:
          // const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          // const userData = userDoc.data();
          
          setUser({
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email,
            avatar: firebaseUser.photoURL || 'https://i.pravatar.cc/150?img=1',
            department: 'Computer Science',
            // academicLevel will be undefined for new users, triggering level selection
            // For existing users, it would be loaded from Firestore
          });
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error loading user profile:', error);
          setUser({
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email,
            avatar: firebaseUser.photoURL || 'https://i.pravatar.cc/150?img=1',
            department: 'Computer Science',
          });
          setIsAuthenticated(true);
        }
      } else {
        // User is signed out
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Authentication methods
  const signIn = async (email, password) => {
    const result = await authService.signIn(email, password);
    return result;
  };

  const signUp = async (email, password, userData) => {
    const result = await authService.signUp(email, password, userData);
    return result;
  };

  const signOut = async () => {
    try {
      const result = await authService.signOutUser();
      if (result.success) {
        // Clear user state immediately
        setUser(null);
        setIsAuthenticated(false);
      }
      return result;
    } catch (error) {
      // Force clear user state on any error
      setUser(null);
      setIsAuthenticated(false);
      return { success: false, error: 'Logout failed' };
    }
  };

  const sendPasswordReset = async (email) => {
    return await authService.sendPasswordReset(email);
  };

  const value = {
    // User and authentication state
    user,
    setUser,
    isAuthenticated,
    isLoading,
    
    // Authentication methods
    signIn,
    signUp,
    signOut,
    sendPasswordReset,
    
    // App state
    notifications,
    setNotifications,
    chatMessages,
    setChatMessages,
    csModules: dummyData.csModules,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
