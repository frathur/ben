import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TextInput,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';
import chatService from '../services/chatService';

const { width, height } = Dimensions.get('window');

export default function GroupChatScreen({ navigation }) {
  const { csModules, user } = useApp();
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedView, setSelectedView] = useState('coursemates');
  const [typingUsers, setTypingUsers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [currentView, setCurrentView] = useState('chatList');
  const [messages, setMessages] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [recentMessages, setRecentMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Get modules based on user type
  const getAvailableModules = () => {
    if (user?.userType === 'lecturer') {
      const teachingCourses = user.teachingCourses || [];
      const courseDetails = [];
      Object.values(csModules).flat().forEach(course => {
        if (teachingCourses.includes(course.id)) {
          courseDetails.push(course);
        }
      });
      return courseDetails;
    } else {
      return user?.academicLevel ? csModules[user.academicLevel] || [] : [];
    }
  };

  const currentLevelModules = getAvailableModules();
  
  // Get senior levels (only relevant for students)
  const getSeniorLevels = () => {
    if (user?.userType === 'lecturer') return [];
    const currentLevel = parseInt(user?.academicLevel || '100');
    const levels = ['100', '200', '300', '400'];
    return levels.filter(level => parseInt(level) > currentLevel);
  };

  const seniorLevels = getSeniorLevels();

  // Filter courses based on search
  const filteredCourses = currentLevelModules.filter(course =>
    course.name.toLowerCase().includes(searchText.toLowerCase()) ||
    course.code.toLowerCase().includes(searchText.toLowerCase())
  );

  // Load recent messages and unread counts on component mount
  useEffect(() => {
    if (currentLevelModules.length > 0) {
      loadRecentMessages();
      loadUnreadCounts();
    }
  }, [currentLevelModules]);

  // Load recent messages for chat list
  const loadRecentMessages = async () => {
    try {
      const recent = await chatService.getRecentMessages(currentLevelModules);
      setRecentMessages(recent);
    } catch (error) {
      console.error('Error loading recent messages:', error);
    }
  };

  // Load unread counts for all courses
  const loadUnreadCounts = async () => {
    try {
      const counts = {};
      for (const course of currentLevelModules) {
        const count = await chatService.getUnreadCount(course.code);
        if (count > 0) {
          counts[course.code] = count;
        }
      }
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Error loading unread counts:', error);
    }
  };

  // Set up real-time listeners when a course is selected
  useEffect(() => {
    if (selectedCourse && currentView === 'individualChat') {
      setIsLoading(true);
      
      // Listen to messages
      const messageUnsubscribe = chatService.listenToMessages(
        selectedCourse.code,
        (newMessages) => {
          setMessages(newMessages);
          setIsLoading(false);
          
          // Scroll to bottom when new messages arrive
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      );

      // Listen to typing indicators
      const typingUnsubscribe = chatService.listenToTypingIndicators(
        selectedCourse.code,
        (users) => {
          setTypingUsers(users);
        }
      );

      // Listen to online status
      const onlineUnsubscribe = chatService.listenToOnlineStatus(
        selectedCourse.code,
        user?.userType === 'lecturer' ? 'student' : null,
        user?.userType === 'student' ? user.academicLevel : null,
        (count) => {
          setOnlineCount(count);
        }
      );

      return () => {
        messageUnsubscribe();
        typingUnsubscribe();
        onlineUnsubscribe();
      };
    }
  }, [selectedCourse, currentView, user]);

  // Handle typing with real-time updates
  const handleTyping = (text) => {
    setNewMessage(text);
    
    if (selectedCourse) {
      // Set typing status
      chatService.setTypingStatus(selectedCourse.code, text.length > 0);
      
      // Clear typing status after 3 seconds of no typing
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        chatService.setTypingStatus(selectedCourse.code, false);
      }, 3000);
    }
  };

  // Format time for chat list
  const formatChatListTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Open individual chat
  const openChat = (course) => {
    setSelectedCourse(course);
    setCurrentView('individualChat');
    
    // Clear unread count for this course
    setUnreadCounts(prev => {
      const updated = { ...prev };
      delete updated[course.code];
      return updated;
    });
  };

  // Go back to chat list
  const goBackToChatList = () => {
    setCurrentView('chatList');
    setSelectedCourse(null);
    setNewMessage('');
    setMessages([]);
    setTypingUsers([]);
    
    // Refresh recent messages and unread counts
    loadRecentMessages();
    loadUnreadCounts();
  };

  // Send message with real-time updates
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedCourse || isSending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      const result = await chatService.sendMessage(selectedCourse.code, messageText);
      
      if (!result.success) {
        Alert.alert('Error', 'Failed to send message. Please try again.');
        setNewMessage(messageText); // Restore message on failure
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setNewMessage(messageText); // Restore message on failure
    } finally {
      setIsSending(false);
    }
  };

  // Add message reaction
  const handleAddReaction = async (messageId, emoji) => {
    if (!selectedCourse) return;

    try {
      await chatService.addReaction(selectedCourse.code, messageId, emoji);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  // Render chat list item (WhatsApp style)
  const renderChatListItem = ({ item, index }) => {
    const lastMessage = recentMessages[item.code];
    const unreadCount = unreadCounts[item.code] || 0;
    const hasUnread = unreadCount > 0;

    return (
      <TouchableOpacity
        style={styles.chatListItem}
        onPress={() => openChat(item)}
        activeOpacity={0.7}
      >
        <View style={styles.chatItemLeft}>
          {/* Course Avatar */}
          <View style={[styles.courseAvatar, { backgroundColor: `hsl(${index * 137.5 % 360}, 70%, 50%)` }]}>
            <Text style={styles.courseAvatarText}>
              {item.code.substring(0, 3).toUpperCase()}
            </Text>
          </View>
          
          {/* Chat Info */}
          <View style={styles.chatInfo}>
            <View style={styles.chatHeader}>
              <Text style={styles.courseName} numberOfLines={1}>
                {item.name}
              </Text>
              {lastMessage && (
                <Text style={[styles.lastMessageTime, hasUnread && styles.unreadTime]}>
                  {formatChatListTime(lastMessage.timestamp)}
                </Text>
              )}
            </View>
            
            <View style={styles.chatSubInfo}>
              <Text style={styles.courseCode}>{item.code}</Text>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.courseCredits}>{item.credits} credits</Text>
            </View>
            
            {lastMessage ? (
              <View style={styles.lastMessageContainer}>
                <Text style={[styles.lastMessage, hasUnread && styles.unreadMessage]} numberOfLines={1}>
                  {lastMessage.senderId === user?.uid ? 'You: ' : `${lastMessage.senderName?.split(' ')[0]}: `}
                  {lastMessage.text}
                </Text>
              </View>
            ) : (
              <View style={styles.lastMessageContainer}>
                <Text style={styles.noMessages}>No messages yet</Text>
              </View>
            )}
          </View>
        </View>

        {/* Right side indicators */}
        <View style={styles.chatItemRight}>
          {hasUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={16} color="#C7D2FE" />
        </View>
      </TouchableOpacity>
    );
  };

  // Render individual message
  const renderMessage = ({ item, index }) => {
    const isCurrentUser = item.senderId === user?.uid;
    const showAvatar = !isCurrentUser && (index === 0 || 
      messages[index - 1]?.senderId !== item.senderId);
    const showTimestamp = index === messages.length - 1 || 
      messages[index + 1]?.senderId !== item.senderId ||
      (messages[index + 1]?.timestamp - item.timestamp) > 300000; // 5 minutes
    
    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
      ]}>
        {showAvatar && !isCurrentUser && (
          <View style={styles.messageAvatar}>
            <LinearGradient
              colors={item.senderType === 'lecturer' ? ['#7C3AED', '#A855F7'] : ['#4F46E5', '#6366F1']}
              style={styles.messageAvatarGradient}
            >
              <Text style={styles.messageAvatarText}>
                {item.senderName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'ST'}
              </Text>
            </LinearGradient>
            {item.senderType === 'lecturer' && (
              <View style={styles.lecturerBadge}>
                <Ionicons name="school" size={6} color="#FFFFFF" />
              </View>
            )}
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
          !showAvatar && !isCurrentUser && styles.continuedMessage
        ]}>
          {showAvatar && !isCurrentUser && (
            <View style={styles.messageHeaderInfo}>
              <Text style={styles.senderName}>{item.senderName}</Text>
              {item.senderType === 'lecturer' && (
                <View style={styles.lecturerTag}>
                  <Ionicons name="school" size={8} color="#7C3AED" />
                  <Text style={styles.lecturerTagText}>Lecturer</Text>
                </View>
              )}
            </View>
          )}
          
          <Text style={[
            styles.messageText,
            isCurrentUser ? styles.currentUserText : styles.otherUserText
          ]}>
            {item.text}
          </Text>
          
          {/* Message reactions */}
          {item.reactions && Object.keys(item.reactions).length > 0 && (
            <View style={styles.reactionsContainer}>
              {Object.entries(item.reactions).map(([emoji, users]) => (
                users.length > 0 && (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.reactionButton,
                      users.includes(user?.uid) && styles.reactionButtonActive
                    ]}
                    onPress={() => handleAddReaction(item.id, emoji)}
                  >
                    <Text style={styles.reactionEmoji}>{emoji}</Text>
                    <Text style={styles.reactionCount}>{users.length}</Text>
                  </TouchableOpacity>
                )
              ))}
            </View>
          )}
          
          {showTimestamp && (
            <View style={styles.messageFooter}>
          <Text style={[
                styles.messageTime,
                isCurrentUser ? styles.currentUserTime : styles.otherUserTime
          ]}>
                {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
              {isCurrentUser && (
                <View style={styles.messageStatus}>
                  {item.status === 'sending' && <ActivityIndicator size="small" color="#C7D2FE" />}
                  {item.status === 'sent' && <Ionicons name="checkmark" size={12} color="#C7D2FE" />}
                  {item.status === 'delivered' && <Ionicons name="checkmark-done" size={12} color="#C7D2FE" />}
                  {item.readBy?.length > 1 && <Ionicons name="checkmark-done" size={12} color="#10B981" />}
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  // Render typing indicator
  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;
    
    const typingText = typingUsers.length === 1 
      ? `${typingUsers[0].name} is typing...`
      : `${typingUsers.length} people are typing...`;
    
    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <Text style={styles.typingText}>{typingText}</Text>
          <View style={styles.typingDots}>
            <Animated.View style={[styles.typingDot, styles.dot1]} />
            <Animated.View style={[styles.typingDot, styles.dot2]} />
            <Animated.View style={[styles.typingDot, styles.dot3]} />
          </View>
        </View>
      </View>
    );
  };

  // Chat List View
  if (currentView === 'chatList') {
  return (
    <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        {/* Header */}
        <View style={styles.chatListHeader}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>
              {user?.userType === 'lecturer' ? 'Course Discussions' : 'Courses'}
            </Text>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerButton}>
                <Ionicons name="search" size={24} color="#4F46E5" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={loadRecentMessages}>
                <Ionicons name="refresh" size={24} color="#4F46E5" />
              </TouchableOpacity>
            </View>
      </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search courses..."
              placeholderTextColor="#94A3B8"
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity 
                style={styles.clearSearch}
                onPress={() => setSearchText('')}
              >
                <Ionicons name="close-circle" size={20} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Online Status */}
          <View style={styles.onlineStatusContainer}>
            <View style={styles.onlineIndicator}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>
                {onlineCount} {onlineCount === 1 ? 'person' : 'people'} online
              </Text>
            </View>
          </View>
        </View>

        {/* Course List */}
        <FlatList
          data={filteredCourses}
          renderItem={renderChatListItem}
          keyExtractor={(item) => item.id}
          style={styles.chatList}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
          refreshing={isLoading}
          onRefresh={() => {
            loadRecentMessages();
            loadUnreadCounts();
          }}
        />

        {/* Senior Students Button for Students */}
        {user?.userType !== 'lecturer' && seniorLevels.length > 0 && (
          <TouchableOpacity style={styles.seniorStudentsButton}>
            <LinearGradient
              colors={['#4F46E5', '#6366F1']}
              style={styles.seniorButtonGradient}
            >
              <Ionicons name="school" size={20} color="#FFFFFF" />
              <Text style={styles.seniorButtonText}>Connect with Senior Students</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  // Individual Chat View
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
        
        {/* Individual Chat Header */}
        <LinearGradient
          colors={['#4F46E5', '#6366F1']}
          style={styles.individualChatHeader}
        >
          <View style={styles.chatHeaderContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={goBackToChatList}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.chatHeaderInfo}>
              <Text style={styles.chatHeaderTitle} numberOfLines={1}>
                {selectedCourse?.name}
              </Text>
              <Text style={styles.chatHeaderSubtitle}>
                {selectedCourse?.code} • {onlineCount} online • {messages.length} messages
              </Text>
            </View>
            
            <View style={styles.chatHeaderActions}>
              <TouchableOpacity style={styles.chatHeaderButton}>
                <Ionicons name="videocam" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.chatHeaderButton}>
                <Ionicons name="call" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.chatHeaderButton}>
                <Ionicons name="ellipsis-vertical" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Messages */}
        <View style={styles.messagesContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : messages.length > 0 ? (
            <>
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                style={styles.messagesList}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                maintainVisibleContentPosition={{
                  minIndexForVisible: 0,
                  autoscrollToTopThreshold: 10,
                }}
              />
              {renderTypingIndicator()}
            </>
          ) : (
            <View style={styles.emptyMessagesState}>
              <Ionicons name="chatbubbles-outline" size={64} color="#C7D2FE" />
              <Text style={styles.emptyMessagesTitle}>Start the conversation</Text>
              <Text style={styles.emptyMessagesSubtitle}>
                Be the first to send a message in {selectedCourse?.code}
              </Text>
            </View>
          )}
        </View>

        {/* Message Input */}
        <View style={styles.messageInputContainer}>
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="add" size={24} color="#4F46E5" />
            </TouchableOpacity>
            
            <View style={styles.textInputContainer}>
          <TextInput
            style={styles.messageInput}
                placeholder={`Message ${selectedCourse?.code}...`}
                placeholderTextColor="#94A3B8"
            value={newMessage}
                onChangeText={handleTyping}
            multiline
            maxLength={500}
                editable={!isSending}
          />
              <TouchableOpacity style={styles.emojiButton}>
                <Ionicons name="happy-outline" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            
          <TouchableOpacity
            style={[
              styles.sendButton,
                (newMessage.trim() && !isSending) && styles.sendButtonActive
            ]}
            onPress={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
          >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
            <Ionicons
                  name={newMessage.trim() ? "send" : "mic"}
              size={20}
                  color="#FFFFFF"
            />
              )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  // Chat List Styles
  chatListHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  clearSearch: {
    padding: 4,
  },
  onlineStatusContainer: {
    alignItems: 'center',
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  onlineText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  
  chatList: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  chatListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  chatItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  courseAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  courseName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  lastMessageTime: {
    fontSize: 14,
    color: '#64748B',
  },
  unreadTime: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  chatSubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  courseCode: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  separator: {
    marginHorizontal: 6,
    color: '#94A3B8',
    fontSize: 12,
  },
  courseCredits: {
    fontSize: 14,
    color: '#64748B',
  },
  lastMessageContainer: {
    marginTop: 2,
  },
  lastMessage: {
    fontSize: 15,
    color: '#64748B',
  },
  unreadMessage: {
    color: '#1E293B',
    fontWeight: '500',
  },
  noMessages: {
    fontSize: 15,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  chatItemRight: {
    alignItems: 'center',
    gap: 8,
  },
  unreadBadge: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listSeparator: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 92,
  },
  
  // Senior Students Button
  seniorStudentsButton: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  seniorButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  seniorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Individual Chat Styles
  individualChatHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chatHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  chatHeaderSubtitle: {
    color: '#C7D2FE',
    fontSize: 13,
  },
  chatHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  chatHeaderButton: {
    padding: 8,
  },
  
  // Messages Styles
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  currentUserMessage: {
    justifyContent: 'flex-end',
  },
  otherUserMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    position: 'relative',
    marginRight: 8,
  },
  messageAvatarGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageAvatarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  lecturerBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#7C3AED',
    borderRadius: 6,
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  currentUserBubble: {
    backgroundColor: '#4F46E5',
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  continuedMessage: {
    marginTop: -6,
  },
  messageHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  lecturerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  lecturerTagText: {
    fontSize: 9,
    color: '#7C3AED',
    fontWeight: '600',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  currentUserText: {
    color: '#FFFFFF',
  },
  otherUserText: {
    color: '#1E293B',
  },
  reactionsContainer: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 4,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 2,
  },
  reactionButtonActive: {
    backgroundColor: '#EEF2FF',
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionCount: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  messageTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  currentUserTime: {
    color: '#C7D2FE',
  },
  otherUserTime: {
    color: '#94A3B8',
  },
  messageStatus: {
    marginLeft: 4,
  },
  
  // Typing Indicator
  typingContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    alignSelf: 'flex-start',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  typingText: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
  },
  typingDots: {
    flexDirection: 'row',
    gap: 2,
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4F46E5',
  },
  
  // Empty State
  emptyMessagesState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyMessagesTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessagesSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Message Input
  messageInputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    marginRight: 8,
  },
  emojiButton: {
    padding: 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#4F46E5',
  },
});