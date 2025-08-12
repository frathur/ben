import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

export default function HomeDashboard({ navigation }) {
  const { csModules, notifications, user } = useApp();
  
  // Get current level modules or default to 100 level
  const currentLevelModules = user?.academicLevel ? (csModules?.[user.academicLevel] || []) : (csModules?.['100'] || []);
  
  // Safety check - if user is null, show loading
  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const getUnreadNotifications = (courseCode) => {
    return notifications.filter(
      notif => notif.course === courseCode && !notif.read
    ).length;
  };

  const renderModuleCard = ({ item, index }) => {
    const unreadCount = getUnreadNotifications(item.code);
    
    // Color scheme for different modules
    const colors = [
      { bg: '#EEF2FF', icon: '#4F46E5', accent: '#4F46E5' },
      { bg: '#F0FDF4', icon: '#059669', accent: '#059669' },
      { bg: '#FEF3C7', icon: '#D97706', accent: '#D97706' },
      { bg: '#FDF2F8', icon: '#EC4899', accent: '#EC4899' },
    ];
    const colorScheme = colors[index % colors.length];
    
    return (
      <TouchableOpacity 
        style={[styles.moduleCard, { backgroundColor: colorScheme.bg }]}
        activeOpacity={0.7}
      >
        <View style={styles.moduleHeader}>
          <View style={[styles.moduleIcon, { backgroundColor: colorScheme.icon }]}>
            <Ionicons name="code-slash" size={20} color="#FFFFFF" />
          </View>
          {unreadCount > 0 && (
            <View style={[styles.notificationBadge, { backgroundColor: colorScheme.accent }]}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.moduleName} numberOfLines={2}>{item.name}</Text>
        <Text style={[styles.moduleCode, { color: colorScheme.accent }]}>{item.code}</Text>
        <Text style={styles.moduleInstructor}>{item.instructor}</Text>
        <Text style={styles.moduleCredits}>{item.credits} Credits</Text>
        
        <View style={styles.moduleActions}>
                     <TouchableOpacity 
             style={[styles.actionButton, { borderColor: colorScheme.accent }]}
             onPress={() => navigation.navigate('GroupChat')}
           >
             <Ionicons name="chatbubbles-outline" size={16} color={colorScheme.accent} />
             <Text style={[styles.actionText, { color: colorScheme.accent }]}>Chat</Text>
           </TouchableOpacity>
           <TouchableOpacity 
             style={[styles.actionButton, { borderColor: colorScheme.accent }]}
             onPress={() => navigation.navigate('UploadNotes')}
           >
             <Ionicons name="document-outline" size={16} color={colorScheme.accent} />
             <Text style={[styles.actionText, { color: colorScheme.accent }]}>Notes</Text>
           </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const currentTime = new Date().getHours();
  const getGreeting = () => {
    if (currentTime < 12) return 'Good morning';
    if (currentTime < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.userSection}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'ST'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.greeting}>
                {getGreeting()}, {user?.name?.split(' ')[0] || 'Student'}! 👋
              </Text>
              <Text style={styles.subtitle}>
                {user?.academicLevel ? `${user.academicLevel} Level` : 'Computer Science'} • {user?.department || 'CS Department'}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color="#4F46E5" />
            {notifications.filter(n => !n.read).length > 0 && (
              <View style={styles.notificationDot}>
                <Text style={styles.notificationCount}>
                  {notifications.filter(n => !n.read).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Stats Section */}
        <View style={styles.quickStats}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="library-outline" size={20} color="#4F46E5" />
            </View>
            <Text style={styles.statNumber}>{currentLevelModules.length}</Text>
            <Text style={styles.statLabel}>Modules</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="mail-unread-outline" size={20} color="#059669" />
            </View>
            <Text style={styles.statNumber}>
              {notifications.filter(n => !n.read).length}
            </Text>
            <Text style={styles.statLabel}>Unread</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="school-outline" size={20} color="#D97706" />
            </View>
            <Text style={styles.statNumber}>{user?.academicLevel || '100'}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('GroupChat')}
          >
            <Ionicons name="chatbubbles" size={24} color="#4F46E5" />
            <Text style={styles.quickActionText}>Group Chat</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('UploadNotes')}
          >
            <Ionicons name="cloud-upload" size={24} color="#059669" />
            <Text style={styles.quickActionText}>Upload Notes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="calendar" size={24} color="#D97706" />
            <Text style={styles.quickActionText}>Schedule</Text>
          </TouchableOpacity>
        </View>

        {/* Modules Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your {user?.academicLevel || '100'} Level Modules</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>View All</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={currentLevelModules}
          renderItem={renderModuleCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.moduleRow}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          contentContainerStyle={styles.modulesGrid}
        />

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
        </View>
        
        <View style={styles.activityContainer}>
          {notifications.slice(0, 3).map((notification, index) => (
            <TouchableOpacity 
              key={notification.id} 
              style={styles.activityItem}
              onPress={() => navigation.navigate('Notifications')}
            >
              <View style={[styles.activityIcon, 
                { backgroundColor: notification.read ? '#F1F5F9' : '#EEF2FF' }
              ]}>
                <Ionicons 
                  name={notification.type === 'assignment' ? 'document-text' : 
                        notification.type === 'material' ? 'book' : 
                        notification.type === 'exam' ? 'school' : 'megaphone'} 
                  size={16} 
                  color={notification.read ? '#64748B' : '#4F46E5'} 
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle} numberOfLines={1}>
                  {notification.title}
                </Text>
                <Text style={styles.activityMessage} numberOfLines={2}>
                  {notification.message}
                </Text>
                <Text style={styles.activityTime}>
                  {new Date(notification.timestamp).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  notificationDot: {
    position: 'absolute',
    top: 4,
    right: 4,
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
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
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
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  quickActionCard: {
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
  quickActionText: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  seeAll: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  modulesGrid: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  moduleRow: {
    justifyContent: 'space-between',
  },
  moduleCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    margin: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    minHeight: 180,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  moduleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  moduleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 6,
    lineHeight: 20,
  },
  moduleCode: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  moduleInstructor: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  moduleCredits: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 12,
  },
  moduleActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    gap: 4,
  },
  actionText: {
    fontSize: 10,
    fontWeight: '600',
  },
  activityContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  activityMessage: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
});

