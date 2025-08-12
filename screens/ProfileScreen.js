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
  
  // Group modules by semester
  const semester1Modules = currentLevelModules.filter(module => module.semester === 1);
  const semester2Modules = currentLevelModules.filter(module => module.semester === 2);
  
  // Calculate total credits
  const totalCredits = currentLevelModules.reduce((sum, module) => sum + module.credits, 0);

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

  const renderCourse = (course, index) => {
    const colors = [
      { bg: '#EEF2FF', icon: '#4F46E5' },
      { bg: '#F0FDF4', icon: '#059669' },
      { bg: '#FEF3C7', icon: '#D97706' },
      { bg: '#FDF2F8', icon: '#EC4899' },
    ];
    const colorScheme = colors[index % colors.length];
    
    return (
      <View key={course.id} style={[styles.courseItem, { backgroundColor: colorScheme.bg }]}>
        <View style={[styles.courseIcon, { backgroundColor: colorScheme.icon }]}>
          <Ionicons name="code-slash" size={18} color="#FFFFFF" />
        </View>
        <View style={styles.courseInfo}>
          <Text style={styles.courseName} numberOfLines={2}>{course.name}</Text>
          <View style={styles.courseDetails}>
            <Text style={[styles.courseCode, { color: colorScheme.icon }]}>{course.code}</Text>
            <Text style={styles.courseCredits}>{course.credits} Credits</Text>
          </View>
          <Text style={styles.courseInstructor}>{course.instructor}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'ST'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name || 'Student Name'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'email@university.edu'}</Text>
              <Text style={styles.studentId}>ID: {user?.studentId || 'CST000000'}</Text>
              <View style={styles.levelBadgeContainer}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>
                    Level {user?.academicLevel || '100'}
                  </Text>
                </View>
                <Text style={styles.department}>{user?.department || 'Computer Science'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Academic Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Academic Overview</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="library-outline" size={20} color="#4F46E5" />
              </View>
              <Text style={styles.statNumber}>{currentLevelModules.length}</Text>
              <Text style={styles.statLabel}>Modules</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="school-outline" size={20} color="#059669" />
              </View>
              <Text style={styles.statNumber}>{totalCredits}</Text>
              <Text style={styles.statLabel}>Credits</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="calendar-outline" size={20} color="#D97706" />
              </View>
              <Text style={styles.statNumber}>{user?.academicLevel || '100'}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
          </View>
        </View>

        {/* Semester 1 Modules */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Semester 1 Modules</Text>
            <View style={styles.moduleBadge}>
              <Text style={styles.moduleBadgeText}>{semester1Modules.length}</Text>
            </View>
          </View>
          <View style={styles.coursesContainer}>
            {semester1Modules.map((course, index) => renderCourse(course, index))}
          </View>
        </View>

        {/* Semester 2 Modules */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Semester 2 Modules</Text>
            <View style={styles.moduleBadge}>
              <Text style={styles.moduleBadgeText}>{semester2Modules.length}</Text>
            </View>
          </View>
          <View style={styles.coursesContainer}>
            {semester2Modules.map((course, index) => renderCourse(course, index))}
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
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 6,
  },
  userEmail: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 4,
  },
  studentId: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 8,
  },
  levelBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelBadge: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  department: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  moduleBadge: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  moduleBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  coursesContainer: {
    gap: 12,
  },
  courseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  courseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
    lineHeight: 20,
  },
  courseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  courseCode: {
    fontSize: 13,
    fontWeight: '600',
  },
  courseCredits: {
    fontSize: 12,
    color: '#64748B',
  },
  courseInstructor: {
    fontSize: 12,
    color: '#94A3B8',
  },
  optionsContainer: {
    gap: 8,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
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
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
