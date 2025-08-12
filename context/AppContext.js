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
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState(dummyData.notifications);
  const [chatMessages, setChatMessages] = useState(dummyData.chatMessages);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to authentication state changes
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        setUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email,
          avatar: firebaseUser.photoURL || 'https://i.pravatar.cc/150?img=1',
        });
        setIsAuthenticated(true);
      } else {
        // User is signed out
        setUser(null);
        setIsAuthenticated(false);
        setSelectedCourses([]);
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
    const result = await authService.signOutUser();
    if (result.success) {
      setUser(null);
      setIsAuthenticated(false);
      setSelectedCourses([]);
    }
    return result;
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
    selectedCourses,
    setSelectedCourses,
    notifications,
    setNotifications,
    chatMessages,
    setChatMessages,
    availableCourses: dummyData.courses,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
