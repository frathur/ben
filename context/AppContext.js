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
      if (firebaseUser && firebaseUser.userData) {
        // User is signed in - use data from Firestore
        const userData = firebaseUser.userData;
        
        setUser({
          uid: firebaseUser.uid,
          name: userData.fullName || firebaseUser.displayName || 'User',
          identifier: userData.identifier || (userData.userType === 'lecturer' ? 'STAFF000' : 'CST000000'),
          studentId: userData.identifier, // For backward compatibility
          email: firebaseUser.email,
          avatar: firebaseUser.photoURL || 'https://i.pravatar.cc/150?img=1',
          department: userData.department || 'Computer Science',
          userType: userData.userType || 'student',
          // Student-specific fields
          ...(userData.userType === 'student' && {
            academicLevel: userData.academicLevel || '100',
            levelDescription: userData.levelDescription || 'First Year - Foundation',
          }),
          // Lecturer-specific fields
          ...(userData.userType === 'lecturer' && {
            title: userData.title || 'Lecturer',
            teachingCourses: userData.teachingCourses || [],
          }),
        });
        setIsAuthenticated(true);
      } else if (firebaseUser) {
        // Fallback for users without Firestore data (shouldn't happen with new flow)
        setUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          identifier: 'CST000000',
          studentId: 'CST000000',
          email: firebaseUser.email,
          avatar: firebaseUser.photoURL || 'https://i.pravatar.cc/150?img=1',
          department: 'Computer Science',
          userType: 'student',
          academicLevel: '100',
          levelDescription: 'First Year - Foundation',
        });
        setIsAuthenticated(true);
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
      // Set loading state during logout
      setIsLoading(true);
      
      // Clear user state immediately to prevent component errors
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear any local storage/cache
      setChatMessages([]);
      setNotifications([]);
      
      // Sign out from Firebase
      const result = await authService.signOutUser();
      
      // Ensure loading is cleared regardless of result
      setTimeout(() => {
        setIsLoading(false);
      }, 500); // Small delay to ensure smooth transition
      
      return result.success ? result : { success: true }; // Always return success since we cleared state
    } catch (error) {
      console.error('Logout error:', error);
      // Force clear user state on any error
      setUser(null);
      setIsAuthenticated(false);
      setChatMessages([]);
      setNotifications([]);
      setIsLoading(false);
      return { success: true }; // Return success since we cleared the state
    }
  };

  const sendPasswordReset = async (email) => {
    return await authService.sendPasswordReset(email);
  };

  // Update user data in Firestore
  const updateUserData = async (userData) => {
    if (!user) return { success: false, error: 'No user logged in' };
    
    try {
      const result = await authService.updateUserData(user.uid, userData);
      if (result.success) {
        // Update local user state
        setUser(prev => ({ ...prev, ...userData }));
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
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
    updateUserData,
    
    // App state
    notifications,
    setNotifications,
    chatMessages,
    setChatMessages,
    csModules: dummyData.csModules,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
