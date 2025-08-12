import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function ProfileScreen() {
  const { user, csModules, signOut } = useApp();
  
  // Safety check - if user is null, show loading
  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }
  
  // Get current level modules
  const currentLevelModules = user?.academicLevel ? (csModules?.[user.academicLevel] || []) : [];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const result = await signOut();
              if (!result.success) {
                Alert.alert('Error', 'Failed to logout. Please try again.');
              }
            } catch (error) {
              Alert.alert('Error', 'An unexpected error occurred.');
            }
          }
        },
      ]
    );
  };

  const profileOptions = [
    {
      id: '1',
      title: 'Edit Profile',
      icon: 'person-outline',
      onPress: () => console.log('Edit Profile'),
    },
    {
      id: '2',
      title: 'Notifications Settings',
      icon: 'notifications-outline',
      onPress: () => console.log('Notification Settings'),
    },
    {
      id: '3',
      title: 'Privacy & Security',
      icon: 'shield-outline',
      onPress: () => console.log('Privacy Settings'),
    },
    {
      id: '4',
      title: 'Help & Support',
      icon: 'help-circle-outline',
      onPress: () => console.log('Help & Support'),
    },
    {
      id: '5',
      title: 'About UniConnect',
      icon: 'information-circle-outline',
      onPress: () => console.log('About'),
    },
  ];

  const renderProfileOption = (option) => (
    <TouchableOpacity
      key={option.id}
      style={styles.optionCard}
      onPress={option.onPress}
    >
      <View style={styles.optionContent}>
        <Ionicons name={option.icon} size={24} color="#4F46E5" />
        <Text style={styles.optionTitle}>{option.title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
    </TouchableOpacity>
  );

  const renderCourse = (course) => (
    <View key={course.id} style={styles.courseItem}>
      <View style={styles.courseIcon}>
        <Ionicons name="book" size={16} color="#4F46E5" />
      </View>
      <View style={styles.courseInfo}>
        <Text style={styles.courseName}>{course.name}</Text>
        <Text style={styles.courseCode}>{course.code}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={40} color="#FFFFFF" />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name || 'Student Name'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'email@university.edu'}</Text>
              <Text style={styles.studentId}>ID: {user?.studentId || 'CST000000'}</Text>
              <Text style={styles.userLevel}>
                {user?.academicLevel ? `${user.academicLevel} Level` : 'Computer Science'} • {user?.department || 'Computer Science'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Level Modules</Text>
          <View style={styles.coursesContainer}>
            {currentLevelModules.map(renderCourse)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.optionsContainer}>
            {profileOptions.map(renderProfileOption)}
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  studentId: {
    fontSize: 12,
    color: '#94A3B8',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  coursesContainer: {
    gap: 8,
  },
  courseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  courseIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 2,
  },
  courseCode: {
    fontSize: 12,
    color: '#64748B',
  },
  optionsContainer: {
    gap: 8,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  userLevel: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
});
