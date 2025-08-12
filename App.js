import React, { useState, useEffect } from 'react';
import { View, SafeAreaView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import CourseSelectionScreen from './screens/CourseSelectionScreen';
import HomeDashboard from './screens/HomeDashboard';
import GroupChatScreen from './screens/GroupChatScreen';
import UploadNotesScreen from './screens/UploadNotesScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import ProfileScreen from './screens/ProfileScreen';

// Import context
import { AppProvider, useApp } from './context/AppContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const theme = {
  colors: {
    primary: '#4F46E5',
    accent: '#818CF8',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#1E293B',
    placeholder: '#64748B',
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Upload') {
            iconName = focused ? 'cloud-upload' : 'cloud-upload-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.placeholder,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: '#E2E8F0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeDashboard} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Chat" component={GroupChatScreen} options={{ title: 'Group Chat' }} />
      <Tab.Screen name="Upload" component={UploadNotesScreen} options={{ title: 'Upload Notes' }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Root App Component with Provider
export default function App() {
  return (
    <PaperProvider theme={theme}>
      <AppProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.primary }}>
          <View style={{ backgroundColor: theme.colors.primary, height: 0 }} />
          <StatusBar style="light" />
          <AppContent />
        </SafeAreaView>
      </AppProvider>
    </PaperProvider>
  );
}

// Main App Content Component
function AppContent() {
  const { isAuthenticated, isLoading, user } = useApp();
  const [showSplash, setShowSplash] = useState(true);
  const [hasSelectedCourses, setHasSelectedCourses] = useState(false);

  useEffect(() => {
    // Show splash screen for 3 seconds
    setTimeout(() => {
      setShowSplash(false);
    }, 3000);
  }, []);

  // Show splash screen initially
  if (showSplash) {
    return <SplashScreen />;
  }

  // Show loading while checking authentication state
  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login">
              {props => <LoginScreen {...props} onLogin={() => {}} />}
            </Stack.Screen>
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : !hasSelectedCourses ? (
          <Stack.Screen name="CourseSelection">
            {props => (
              <CourseSelectionScreen
                {...props}
                onCoursesSelected={() => setHasSelectedCourses(true)}
              />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="MainTabs" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
