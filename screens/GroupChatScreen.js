import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function GroupChatScreen() {
  const { csModules, chatMessages, user } = useApp();
  const [selectedCourse, setSelectedCourse] = useState('');
  const [newMessage, setNewMessage] = useState('');

  // Get user's current level modules
  const currentLevelModules = user?.academicLevel ? csModules[user.academicLevel] || [] : [];
  
  // Set initial selected course if not set
  React.useEffect(() => {
    if (!selectedCourse && currentLevelModules.length > 0) {
      setSelectedCourse(currentLevelModules[0].code);
    }
  }, [currentLevelModules, selectedCourse]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }) => {
    return (
      <View style={[
        styles.messageContainer,
        item.isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
      ]}>
        {!item.isCurrentUser && (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        )}
        <View style={[
          styles.messageBubble,
          item.isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
        ]}>
          {!item.isCurrentUser && (
            <Text style={styles.userName}>{item.user}</Text>
          )}
          <Text style={[
            styles.messageText,
            item.isCurrentUser ? styles.currentUserText : styles.otherUserText
          ]}>
            {item.message}
          </Text>
          <Text style={[
            styles.timestamp,
            item.isCurrentUser ? styles.currentUserTimestamp : styles.otherUserTimestamp
          ]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  const renderCourseTab = ({ item }) => {
    const isSelected = selectedCourse === item.code;
    const hasMessages = chatMessages[item.code] && chatMessages[item.code].length > 0;
    
    return (
      <TouchableOpacity
        style={[styles.courseTab, isSelected && styles.selectedTab]}
        onPress={() => setSelectedCourse(item.code)}
      >
        <View style={styles.courseTabContent}>
          <Text style={[styles.courseTabText, isSelected && styles.selectedTabText]}>
            {item.code}
          </Text>
          {hasMessages && (
            <View style={[styles.messageBadge, isSelected && styles.selectedBadge]}>
              <Text style={[styles.badgeText, isSelected && styles.selectedBadgeText]}>
                {chatMessages[item.code].length}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // In a real app, this would send the message to the backend
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

  const currentMessages = chatMessages[selectedCourse] || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Group Chat</Text>
          <Text style={styles.subtitle}>
            {user?.academicLevel ? `Level ${user.academicLevel}` : 'Course'} Discussions
          </Text>
        </View>
        <View style={styles.onlineIndicator}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>Online</Text>
        </View>
      </View>

      <FlatList
        data={currentLevelModules}
        renderItem={renderCourseTab}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.courseTabs}
        contentContainerStyle={styles.courseTabsContent}
      />

      <View style={styles.chatContainer}>
        <FlatList
          data={currentMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder={`Message ${selectedCourse} group...`}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              newMessage.trim() ? styles.sendButtonActive : styles.sendButtonInactive
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={newMessage.trim() ? '#FFFFFF' : '#94A3B8'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  onlineText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  courseTabs: {
    maxHeight: 70,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
  },
  courseTabsContent: {
    paddingHorizontal: 20,
  },
  courseTab: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedTab: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOpacity: 0.3,
  },
  courseTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  selectedTabText: {
    color: '#FFFFFF',
  },
  messageBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  selectedBadge: {
    backgroundColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  selectedBadgeText: {
    color: '#4F46E5',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  messagesList: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  currentUserMessage: {
    justifyContent: 'flex-end',
  },
  otherUserMessage: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  currentUserBubble: {
    backgroundColor: '#4F46E5',
    borderBottomRightRadius: 6,
  },
  otherUserBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  currentUserText: {
    color: '#FFFFFF',
  },
  otherUserText: {
    color: '#1E293B',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  currentUserTimestamp: {
    color: '#C7D2FE',
  },
  otherUserTimestamp: {
    color: '#94A3B8',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginRight: 12,
    maxHeight: 120,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonActive: {
    backgroundColor: '#4F46E5',
  },
  sendButtonInactive: {
    backgroundColor: '#F1F5F9',
  },
});
