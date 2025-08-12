import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

export default function LecturerDashboard({ navigation }) {
  const { user, csModules, notifications } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // week, month, semester
  const [quickActionModal, setQuickActionModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);

  // Safety check - if user is null, show loading
  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Get lecturer's teaching data
  const teachingCourses = user.teachingCourses || [];
  const getTeachingCourseDetails = () => {
    const courseDetails = [];
    Object.values(csModules).flat().forEach(course => {
      if (teachingCourses.includes(course.id)) {
        courseDetails.push(course);
      }
    });
    return courseDetails;
  };

  const courseDetails = getTeachingCourseDetails();
  
  // Group courses by level for better organization
  const coursesByLevel = courseDetails.reduce((acc, course) => {
    const level = Object.keys(csModules).find(level => 
      csModules[level].some(c => c.id === course.id)
    );
    if (!acc[level]) acc[level] = [];
    acc[level].push(course);
    return acc;
  }, {});

  // Calculate comprehensive statistics
  const totalStudents = courseDetails.length * 35; // Assume avg 35 students per course
  const totalMaterials = courseDetails.length * 8; // Assume avg 8 materials per course
  const levelsTeaching = Object.keys(coursesByLevel).length;
  const pendingAssignments = Math.floor(Math.random() * 15) + 5; // Simulated
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    const firstName = user?.name?.split(' ')[0] || 'Professor';
    const title = user?.title || 'Dr.';
    
    if (hour < 12) return `Good morning, ${title} ${firstName}`;
    if (hour < 17) return `Good afternoon, ${title} ${firstName}`;
    return `Good evening, ${title} ${firstName}`;
  };

  const handleQuickAction = (action) => {
    setSelectedAction(action);
    setQuickActionModal(true);
  };

  const executeQuickAction = () => {
    switch (selectedAction.id) {
      case 'upload':
        navigation.navigate('Materials');
        break;
      case 'chat':
        navigation.navigate('Chat');
        break;
      case 'assignment':
        Alert.alert('Assignment Creator', 'This feature will open the assignment creation tool.');
        break;
      case 'analytics':
        Alert.alert('Advanced Analytics', 'Detailed analytics dashboard coming soon!');
        break;
      case 'schedule':
        Alert.alert('Class Schedule', 'Schedule management features coming soon!');
        break;
      case 'grades':
        Alert.alert('Grade Book', 'Grade management system coming soon!');
        break;
    }
    setQuickActionModal(false);
  };

  const renderStatCard = (icon, number, label, trend, color, gradient) => (
    <TouchableOpacity style={styles.statCard} activeOpacity={0.8}>
      <LinearGradient colors={gradient} style={styles.statGradient}>
        <View style={styles.statIconContainer}>
          <Ionicons name={icon} size={24} color="#FFFFFF" />
        </View>
        <View style={styles.statContent}>
          <Text style={styles.statNumber}>{number}</Text>
          <Text style={styles.statLabel}>{label}</Text>
          {trend && (
            <View style={styles.trendContainer}>
              <Ionicons 
                name={trend > 0 ? "trending-up" : "trending-down"} 
                size={12} 
                color={trend > 0 ? "#10B981" : "#EF4444"} 
              />
              <Text style={[styles.trendText, { color: trend > 0 ? "#10B981" : "#EF4444" }]}>
                {Math.abs(trend)}%
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderCourseCard = (course, level) => {
    const studentCount = Math.floor(Math.random() * 20) + 25; // 25-45 students
    const materials = Math.floor(Math.random() * 5) + 5; // 5-10 materials
    const lastActivity = Math.floor(Math.random() * 24) + 1; // 1-24 hours ago

    return (
      <TouchableOpacity key={course.id} style={styles.courseCard} activeOpacity={0.9}>
        <LinearGradient 
          colors={['#FFFFFF', '#F8FAFC']} 
          style={styles.courseCardGradient}
        >
          <View style={styles.courseHeader}>
            <View style={styles.courseMainInfo}>
              <View style={styles.courseTitleRow}>
                <Text style={styles.courseCode}>{course.code}</Text>
                <View style={[styles.levelBadge, { backgroundColor: getLevelColor(level) }]}>
                  <Text style={styles.levelBadgeText}>L{level}</Text>
                </View>
              </View>
              <Text style={styles.courseName} numberOfLines={2}>{course.name}</Text>
              <View style={styles.courseMetrics}>
                <View style={styles.metricItem}>
                  <Ionicons name="people" size={14} color="#059669" />
                  <Text style={styles.metricText}>{studentCount} students</Text>
                </View>
                <View style={styles.metricItem}>
                  <Ionicons name="folder" size={14} color="#D97706" />
                  <Text style={styles.metricText}>{materials} materials</Text>
                </View>
              </View>
            </View>
            <View style={styles.courseActions}>
              <TouchableOpacity 
                style={styles.courseActionBtn}
                onPress={() => navigation.navigate('Chat')}
              >
                <Ionicons name="chatbubbles" size={18} color="#4F46E5" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.courseActionBtn}
                onPress={() => navigation.navigate('Materials')}
              >
                <Ionicons name="cloud-upload" size={18} color="#059669" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.courseDivider} />
          
          <View style={styles.courseFooter}>
            <View style={styles.activityIndicator}>
              <View style={styles.activityDot} />
              <Text style={styles.activityText}>Last activity {lastActivity}h ago</Text>
            </View>
            <TouchableOpacity style={styles.viewDetailsBtn}>
              <Text style={styles.viewDetailsText}>View Details</Text>
              <Ionicons name="chevron-forward" size={14} color="#4F46E5" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const getLevelColor = (level) => {
    const colors = {
      '100': '#3B82F6',
      '200': '#10B981', 
      '300': '#F59E0B',
      '400': '#EF4444'
    };
    return colors[level] || '#6B7280';
  };

  const quickActions = [
    { id: 'upload', title: 'Upload Material', icon: 'cloud-upload', color: '#4F46E5', desc: 'Share course content with students' },
    { id: 'chat', title: 'Course Chats', icon: 'chatbubbles', color: '#059669', desc: 'Join ongoing discussions' },
    { id: 'assignment', title: 'Create Assignment', icon: 'document-text', color: '#D97706', desc: 'Design new assignments' },
    { id: 'analytics', title: 'View Analytics', icon: 'stats-chart', color: '#7C3AED', desc: 'Student performance insights' },
    { id: 'schedule', title: 'Class Schedule', icon: 'calendar', color: '#DC2626', desc: 'Manage your timetable' },
    { id: 'grades', title: 'Grade Book', icon: 'school', color: '#059669', desc: 'Record and manage grades' },
  ];

  const recentActivities = [
    {
      icon: 'cloud-upload',
      color: '#4F46E5',
      title: 'Uploaded Lecture 8 materials',
      course: 'CSM387 - Data Structures',
      time: '2 hours ago',
      engagement: '23 views'
    },
    {
      icon: 'chatbubbles',
      color: '#059669', 
      title: 'Answered 5 student questions',
      course: 'CSM281 - Programming I',
      time: '4 hours ago',
      engagement: '12 replies'
    },
    {
      icon: 'document-text',
      color: '#D97706',
      title: 'Created new assignment',
      course: 'CSM495 - Final Project',
      time: '1 day ago',
      engagement: '45 submissions'
    },
    {
      icon: 'school',
      color: '#7C3AED',
      title: 'Graded midterm exams',
      course: 'CSM387 - Data Structures', 
      time: '2 days ago',
      engagement: '38 grades'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Enhanced Header with Gradient */}
        <LinearGradient 
          colors={['#4F46E5', '#7C3AED']} 
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.userSection}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'DR'}
                </Text>
                <View style={styles.lecturerIndicator}>
                  <Ionicons name="school" size={12} color="#FFFFFF" />
                </View>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.greeting}>
                  {getGreeting()} 👨‍🏫
                </Text>
                <Text style={styles.subtitle}>
                  {user?.department || 'Computer Science Department'}
                </Text>
                <View style={styles.teachingBadge}>
                  <Ionicons name="library" size={12} color="#C7D2FE" />
                  <Text style={styles.teachingText}>
                    Teaching {courseDetails.length} courses across {levelsTeaching} levels
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.notificationButton} 
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications" size={24} color="#FFFFFF" />
              {notifications.filter(n => !n.read).length > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationCount}>
                    {notifications.filter(n => !n.read).length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Enhanced Statistics Dashboard */}
        <View style={styles.statsSection}>
          <View style={styles.statsSectionHeader}>
            <Text style={styles.sectionTitle}>Teaching Dashboard</Text>
            <View style={styles.periodSelector}>
              {['Week', 'Month', 'Semester'].map(period => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodBtn,
                    selectedPeriod === period.toLowerCase() && styles.periodBtnActive
                  ]}
                  onPress={() => setSelectedPeriod(period.toLowerCase())}
                >
                  <Text style={[
                    styles.periodText,
                    selectedPeriod === period.toLowerCase() && styles.periodTextActive
                  ]}>
                    {period}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.statsGrid}>
            {renderStatCard(
              'library', 
              courseDetails.length, 
              'Courses', 
              5, 
              '#4F46E5', 
              ['#4F46E5', '#6366F1']
            )}
            {renderStatCard(
              'people', 
              totalStudents, 
              'Students', 
              12, 
              '#059669', 
              ['#059669', '#10B981']
            )}
            {renderStatCard(
              'folder', 
              totalMaterials, 
              'Materials', 
              8, 
              '#D97706', 
              ['#D97706', '#F59E0B']
            )}
            {renderStatCard(
              'clipboard', 
              pendingAssignments, 
              'Pending', 
              -3, 
              '#DC2626', 
              ['#DC2626', '#EF4444']
            )}
          </View>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.actionCard, { animationDelay: index * 100 }]}
                onPress={() => handleQuickAction(action)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[action.color + '15', action.color + '05']}
                  style={styles.actionCardGradient}
                >
                  <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                    <Ionicons name={action.icon} size={22} color="#FFFFFF" />
                  </View>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionDesc} numberOfLines={2}>
                    {action.desc}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Course Management by Level */}
        {Object.keys(coursesByLevel).sort().map(level => (
          <View key={level} style={styles.levelSection}>
            <View style={styles.levelHeader}>
              <View style={styles.levelTitleContainer}>
                <View style={[styles.levelIcon, { backgroundColor: getLevelColor(level) }]}>
                  <Text style={styles.levelIconText}>{level}</Text>
                </View>
                <View>
                  <Text style={styles.levelTitle}>Level {level} Courses</Text>
                  <Text style={styles.levelSubtitle}>
                    {coursesByLevel[level].length} course{coursesByLevel[level].length !== 1 ? 's' : ''} • 
                    {coursesByLevel[level].length * 35} students
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.expandBtn}>
                <Ionicons name="chevron-down" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.coursesContainer}>
              {coursesByLevel[level].map(course => renderCourseCard(course, level))}
            </View>
          </View>
        ))}

        {/* Recent Activity Feed */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityContainer}>
            {recentActivities.map((activity, index) => (
              <TouchableOpacity key={index} style={styles.activityItem} activeOpacity={0.8}>
                <View style={[styles.activityIcon, { backgroundColor: activity.color + '15' }]}>
                  <Ionicons name={activity.icon} size={18} color={activity.color} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityCourse}>{activity.course}</Text>
                  <View style={styles.activityFooter}>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                    <View style={styles.engagementBadge}>
                      <Text style={styles.engagementText}>{activity.engagement}</Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Performance Insights Preview */}
        <View style={styles.insightsSection}>
          <LinearGradient colors={['#F8FAFC', '#FFFFFF']} style={styles.insightsContainer}>
            <View style={styles.insightsHeader}>
              <View>
                <Text style={styles.insightsTitle}>Performance Insights</Text>
                <Text style={styles.insightsSubtitle}>Student engagement metrics</Text>
              </View>
              <TouchableOpacity style={styles.viewAllBtn}>
                <Text style={styles.viewAllText}>View All</Text>
                <Ionicons name="arrow-forward" size={14} color="#4F46E5" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.insightsMetrics}>
              <View style={styles.insightMetric}>
                <Text style={styles.metricValue}>85%</Text>
                <Text style={styles.metricLabel}>Avg Attendance</Text>
                <View style={styles.metricTrend}>
                  <Ionicons name="trending-up" size={12} color="#10B981" />
                  <Text style={styles.metricTrendText}>+5%</Text>
                </View>
              </View>
              <View style={styles.insightMetric}>
                <Text style={styles.metricValue}>92%</Text>
                <Text style={styles.metricLabel}>Assignment Completion</Text>
                <View style={styles.metricTrend}>
                  <Ionicons name="trending-up" size={12} color="#10B981" />
                  <Text style={styles.metricTrendText}>+8%</Text>
                </View>
              </View>
              <View style={styles.insightMetric}>
                <Text style={styles.metricValue}>4.6</Text>
                <Text style={styles.metricLabel}>Avg Rating</Text>
                <View style={styles.metricTrend}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.metricTrendText}>Excellent</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Quick Action Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={quickActionModal}
        onRequestClose={() => setQuickActionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedAction && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleContainer}>
                    <View style={[styles.modalActionIcon, { backgroundColor: selectedAction.color }]}>
                      <Ionicons name={selectedAction.icon} size={24} color="#FFFFFF" />
                    </View>
                    <View>
                      <Text style={styles.modalTitle}>{selectedAction.title}</Text>
                      <Text style={styles.modalSubtitle}>{selectedAction.desc}</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={() => setQuickActionModal(false)}
                  >
                    <Ionicons name="close" size={24} color="#64748B" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalBody}>
                  <Text style={styles.modalText}>
                    This action will take you to the {selectedAction.title.toLowerCase()} section.
                    Continue?
                  </Text>
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity 
                    style={styles.cancelBtn} 
                    onPress={() => setQuickActionModal(false)}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.confirmBtn, { backgroundColor: selectedAction.color }]} 
                    onPress={executeQuickAction}
                  >
                    <Ionicons name={selectedAction.icon} size={16} color="#FFFFFF" />
                    <Text style={styles.confirmText}>Continue</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  headerGradient: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 10,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  lecturerIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#C7D2FE',
    marginBottom: 6,
  },
  teachingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  teachingText: {
    fontSize: 12,
    color: '#C7D2FE',
    fontWeight: '500',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  statsSectionHeader: {
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
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  periodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  periodBtnActive: {
    backgroundColor: '#4F46E5',
  },
  periodText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  periodTextActive: {
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statContent: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
  },
  actionsSection: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  actionCard: {
    width: (width - 64) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  actionCardGradient: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  levelSection: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  levelSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  expandBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  coursesContainer: {
    gap: 12,
  },
  courseCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  courseCardGradient: {
    padding: 16,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  courseMainInfo: {
    flex: 1,
  },
  courseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  courseCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  levelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  levelBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
    lineHeight: 20,
  },
  courseMetrics: {
    flexDirection: 'row',
    gap: 16,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 12,
    fontWeight: '500',
  },
  courseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  courseActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  courseDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  activityText: {
    fontSize: 11,
    color: '#64748B',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '500',
  },
  activitySection: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  activityContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  activityCourse: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  engagementBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  engagementText: {
    fontSize: 10,
    color: '#4F46E5',
    fontWeight: '500',
  },
  insightsSection: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  insightsContainer: {
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  insightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  insightsSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '500',
  },
  insightsMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  insightMetric: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 4,
  },
  metricTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  metricTrendText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10B981',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalText: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  confirmBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});