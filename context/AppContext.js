import React, { createContext, useContext, useState } from 'react';
import { dummyData } from '../data/dummyData';

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
  const [user, setUser] = useState(dummyData.user);
  const [notifications, setNotifications] = useState(dummyData.notifications);
  const [chatMessages, setChatMessages] = useState(dummyData.chatMessages);

  const value = {
    selectedCourses,
    setSelectedCourses,
    user,
    setUser,
    notifications,
    setNotifications,
    chatMessages,
    setChatMessages,
    availableCourses: dummyData.courses,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
