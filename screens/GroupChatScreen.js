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
  Vibration,
  Modal,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { setStringAsync } from 'expo-clipboard';
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
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageActions, setShowMessageActions] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [inputHeight, setInputHeight] = useState(44);
  const [sortedCourses, setSortedCourses] = useState([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const recordingRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const inputRef = useRef(null);
  const keyboardHeightAnimated = useRef(new Animated.Value(0)).current;

  // Get modules based on user type with general channels
  const getAvailableModules = () => {
    let courses = [];
    
    // Add general collaboration channels
    if (user?.userType === 'lecturer') {
      courses.push({
        id: 'general-lecturers',
        code: 'FACULTY',
        name: '👨‍🏫 All Lecturers',
        credits: 0,
        semester: 'General',
        instructor: 'All Faculty',
        description: 'General collaboration space for all lecturers'
      });
      
      // Add teaching courses
      const teachingCourses = user.teachingCourses || [];
      Object.values(csModules).flat().forEach(course => {
        if (teachingCourses.includes(course.id)) {
          courses.push(course);
        }
      });
    } else {
      courses.push({
        id: 'general-students',
        code: 'GENERAL',
        name: '🎓 All Students',
        credits: 0,
        semester: 'General',
        instructor: 'Student Community',
        description: 'General collaboration space for all students'
      });
      
      // Add level-specific courses
      if (user?.academicLevel && csModules[user.academicLevel]) {
        courses.push(...csModules[user.academicLevel]);
      }
    }
    
    return courses;
  };

  const currentLevelModules = getAvailableModules();

  // Initialize chat service and load data
  useEffect(() => {
    if (user?.uid) {
      chatService.initializeUserPresence(user.uid, user);
      loadSortedChatList();
      loadRecentMessages();
      loadUnreadCounts();
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [user?.uid]);

  // Handle keyboard events for better positioning
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        Animated.timing(keyboardHeightAnimated, {
          toValue: e.endCoordinates.height,
          duration: e.duration || 250,
          useNativeDriver: false,
        }).start();
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (e) => {
        setKeyboardHeight(0);
        Animated.timing(keyboardHeightAnimated, {
          toValue: 0,
          duration: e.duration || 250,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [currentView]);

  // Load and sort chat list by timestamp
  const loadSortedChatList = async () => {
    try {
      const sorted = await chatService.getSortedChatList(currentLevelModules);
      setSortedCourses(sorted);
    } catch (error) {
      console.error('Error loading sorted chat list:', error);
      setSortedCourses(currentLevelModules);
    }
  };

  // Load recent messages for chat list
  const loadRecentMessages = async () => {
    const messages = {};
    for (const course of currentLevelModules) {
      try {
        const recent = await chatService.getRecentMessages(course.code, 1);
        if (recent.length > 0) {
          messages[course.code] = recent[0];
        }
      } catch (error) {
        console.error(`Error loading recent messages for ${course.code}:`, error);
      }
    }
    setRecentMessages(messages);
  };

  // Load unread counts
  const loadUnreadCounts = async () => {
    const counts = {};
    for (const course of currentLevelModules) {
      try {
        const count = await chatService.getUnreadCount(course.code, user?.uid);
        counts[course.code] = count;
      } catch (error) {
        console.error(`Error loading unread count for ${course.code}:`, error);
      }
    }
    setUnreadCounts(counts);
  };

  // Open individual chat
  const openChat = async (course) => {
    setSelectedCourse(course);
    setCurrentView('chat');
    setIsLoading(true);

    try {
      // Mark messages as read
      await chatService.markMessagesAsRead(course.code, user?.uid);
      
      // Update unread count
      setUnreadCounts(prev => ({ ...prev, [course.code]: 0 }));

      // Listen to messages
      const unsubscribe = chatService.listenToMessages(course.code, (newMessages) => {
        setMessages(newMessages);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });

      // Listen to typing indicators
      chatService.listenToTypingIndicators(course.code, (typingUsersList) => {
        setTypingUsers(typingUsersList.filter(typingUser => typingUser.userId !== user?.uid));
      });

    } catch (error) {
      console.error('Error opening chat:', error);
      Alert.alert('Error', 'Failed to load chat messages');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle message sending with edit/reply support
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedCourse || isSending) return;

    const messageText = newMessage.trim();
    setIsSending(true);

    try {
      if (editingMessage) {
        // Edit existing message
        const result = await chatService.editMessage(selectedCourse.code, editingMessage.id, messageText);
        if (result.success) {
          setEditingMessage(null);
          setNewMessage('');
        } else {
          Alert.alert('Error', 'Failed to edit message');
        }
      } else {
        // Send new message (with optional reply)
        const messageData = {
          text: messageText,
          ...(replyToMessage && { replyTo: replyToMessage })
        };
        
        const result = await chatService.sendMessage(selectedCourse.code, messageData);
        if (result.success) {
          setNewMessage('');
          setReplyToMessage(null);
          setInputHeight(44);
          
          // Update recent messages and reload sorted list
          loadRecentMessages();
          loadSortedChatList();
        } else {
          Alert.alert('Error', 'Failed to send message');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // Handle typing with better debouncing
  const handleTyping = (text) => {
    setNewMessage(text);
    
    if (selectedCourse && user?.uid) {
      // Set typing status
      chatService.setTypingStatus(selectedCourse.code, user.uid, true);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to clear typing status
      typingTimeoutRef.current = setTimeout(() => {
        chatService.setTypingStatus(selectedCourse.code, user.uid, false);
      }, 2000);
    }
  };

  // Message Actions
  const handleLongPressMessage = (message) => {
    setSelectedMessage(message);
    setShowMessageActions(true);
    Vibration.vibrate(50);
  };

  const copyMessage = async (message) => {
    try {
      await setStringAsync(message.text);
      Alert.alert('Copied', 'Message copied to clipboard');
      setShowMessageActions(false);
    } catch (error) {
      console.error('Clipboard error:', error);
      Alert.alert('Error', 'Could not copy message');
    }
  };

  const replyToMessageHandler = (message) => {
    setReplyToMessage(message);
    setShowMessageActions(false);
    inputRef.current?.focus();
  };

  const editMessageHandler = (message) => {
    if (message.senderId !== user?.uid) {
      Alert.alert('Error', 'You can only edit your own messages');
      return;
    }
    
    setEditingMessage(message);
    setNewMessage(message.text);
    setShowMessageActions(false);
    inputRef.current?.focus();
  };

  const deleteMessageHandler = async (message) => {
    if (message.senderId !== user?.uid) {
      Alert.alert('Error', 'You can only delete your own messages');
      return;
    }

    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await chatService.deleteMessage(selectedCourse.code, message.id);
              if (result.success) {
                setShowMessageActions(false);
              } else {
                Alert.alert('Error', 'Failed to delete message');
              }
            } catch (error) {
              Alert.alert('Error', 'Could not delete message');
            }
          }
        }
      ]
    );
  };

  const cancelReply = () => {
    setReplyToMessage(null);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setNewMessage('');
    setInputHeight(44);
  };

  // Format time for chat list
  const formatChatListTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : timestamp;
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'now';
    if (diffHours < 24) return `${Math.floor(diffHours)}h`;
    if (diffHours < 168) return `${Math.floor(diffHours / 24)}d`;
    return date.toLocaleDateString();
  };

  // Add reaction to message
  const handleAddReaction = async (messageId, emoji) => {
    try {
      await chatService.addReaction(selectedCourse.code, messageId, user?.uid, emoji);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  // Handle emoji picker
  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const insertEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  // Voice recording (placeholder)
  const startRecording = () => {
    setIsRecording(true);
    setRecordingDuration(0);
    Vibration.vibrate(100);
    
    recordingTimerRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    setRecordingDuration(0);
    Alert.alert('Voice Message', 'Voice recording feature coming soon!');
  };

  // Render chat list item with modern design
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
          <LinearGradient
            colors={[
              `hsl(${index * 137.5 % 360}, 70%, 55%)`,
              `hsl(${index * 137.5 % 360}, 70%, 45%)`
            ]}
            style={styles.courseAvatar}
          >
            <Text style={styles.courseAvatarText}>
              {item.code.substring(0, 3).toUpperCase()}
            </Text>
          </LinearGradient>
          
          {/* Chat Info */}
          <View style={styles.chatInfo}>
            <View style={styles.chatHeader}>
              <Text style={[styles.courseName, hasUnread && styles.unreadCourseName]} numberOfLines={1}>
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
                  {lastMessage.senderName ? `${lastMessage.senderName}: ${lastMessage.text}` : lastMessage.text}
                </Text>
              </View>
            ) : (
              <Text style={styles.noMessages}>No messages yet</Text>
            )}
          </View>
        </View>
        
        {/* Unread Badge */}
        <View style={styles.chatItemRight}>
          {hasUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={16} color="#C7D2FE" />
        </View>
      </TouchableOpacity>
    );
  };

  // Render individual message with modern bubble design
  const renderMessage = ({ item, index }) => {
    const isCurrentUser = item.senderId === user?.uid;
    const showAvatar = !isCurrentUser && (index === 0 || 
      messages[index - 1]?.senderId !== item.senderId);
    const showTimestamp = index === messages.length - 1 || 
      messages[index + 1]?.senderId !== item.senderId ||
      (messages[index + 1]?.timestamp - item.timestamp) > 300000; // 5 minutes
    const isSelected = selectedMessage?.id === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
          isSelected && styles.selectedMessage
        ]}
        onLongPress={() => handleLongPressMessage(item)}
        onPress={() => setShowMessageActions(false)}
        activeOpacity={0.8}
      >
        {showAvatar && !isCurrentUser && (
          <LinearGradient
            colors={item.senderType === 'lecturer' ? ['#7C3AED', '#A855F7'] : ['#4F46E5', '#6366F1']}
            style={styles.messageAvatar}
          >
            <Text style={styles.messageAvatarText}>
              {item.senderName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
            </Text>
          </LinearGradient>
        )}
        
        <View style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
          !showAvatar && !isCurrentUser && styles.continuedMessage,
          isSelected && styles.selectedBubble
        ]}>
          {/* Reply preview */}
          {item.replyTo && (
            <View style={styles.replyPreview}>
              <View style={styles.replyLine} />
              <View style={styles.replyContent}>
                <Text style={styles.replyAuthor}>{item.replyTo.senderName}</Text>
                <Text style={styles.replyText} numberOfLines={2}>
                  {item.replyTo.text}
                </Text>
              </View>
            </View>
          )}
          
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
          
          <Text
            style={[
              styles.messageText,
              isCurrentUser ? styles.currentUserText : styles.otherUserText
            ]}
            selectable={true}
          >
            {item.text}
          </Text>
          
          {/* Edit indicator */}
          {item.edited && (
            <Text style={styles.editedText}>edited</Text>
          )}
          
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
      </TouchableOpacity>
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
            <Animated.View style={[styles.typingDot, styles.typingDot1]} />
            <Animated.View style={[styles.typingDot, styles.typingDot2]} />
            <Animated.View style={[styles.typingDot, styles.typingDot3]} />
          </View>
        </View>
      </View>
    );
  };

  // Main render
  if (currentView === 'chatList') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Chat</Text>
            <Text style={styles.headerSubtitle}>
              {user?.userType === 'lecturer' ? 'Teaching Courses' : `Level ${user?.academicLevel || '100'} Courses`}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => {/* TODO: Implement search */}}
          >
            <Ionicons name="search" size={24} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        {/* Chat List */}
        <FlatList
          data={sortedCourses}
          renderItem={renderChatListItem}
          keyExtractor={(item) => item.id}
          style={styles.chatList}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
          refreshing={isLoading}
          onRefresh={() => {
            loadSortedChatList();
            loadRecentMessages();
            loadUnreadCounts();
          }}
        />
      </SafeAreaView>
    );
  }

  // Individual Chat View
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.keyboardAvoidingView}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentView('chatList')}
          >
            <Ionicons name="chevron-back" size={24} color="#4F46E5" />
          </TouchableOpacity>
          
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatTitle} numberOfLines={1}>
              {selectedCourse?.name}
            </Text>
            <Text style={styles.chatSubtitle}>
              {onlineCount > 0 ? `${onlineCount} online` : selectedCourse?.code}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.chatMenuButton}>
            <Ionicons name="ellipsis-vertical" size={20} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          showsVerticalScrollIndicator={false}
          inverted={false}
          onContentSizeChange={() => {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }}
          ListFooterComponent={renderTypingIndicator}
        />

        {/* Input Area */}
        <Animated.View style={[
          styles.inputContainer,
          { marginBottom: keyboardHeightAnimated }
        ]}>
          {/* Reply Bar */}
          {replyToMessage && (
            <View style={styles.replyBar}>
              <View style={styles.replyBarContent}>
                <View style={styles.replyBarLine} />
                <View style={styles.replyBarText}>
                  <Text style={styles.replyBarAuthor}>
                    Replying to {replyToMessage.senderName}
                  </Text>
                  <Text style={styles.replyBarMessage} numberOfLines={1}>
                    {replyToMessage.text}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.cancelReplyButton} onPress={cancelReply}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
          )}

          {/* Edit Bar */}
          {editingMessage && (
            <View style={styles.editBar}>
              <View style={styles.editBarContent}>
                <Ionicons name="pencil" size={16} color="#F59E0B" />
                <Text style={styles.editBarText}>Edit message</Text>
              </View>
              <TouchableOpacity style={styles.cancelEditButton} onPress={cancelEdit}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
          )}

          {/* Input Row */}
          <View style={styles.inputRow}>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="add" size={24} color="#4F46E5" />
            </TouchableOpacity>
            
            <View style={[styles.textInputContainer, { minHeight: Math.max(44, inputHeight + 16) }]}>
              <TextInput
                ref={inputRef}
                style={[
                  styles.messageInput,
                  { height: Math.max(44, inputHeight) }
                ]}
                placeholder={
                  editingMessage 
                    ? 'Edit your message...'
                    : replyToMessage 
                    ? 'Reply...' 
                    : `Message ${selectedCourse?.code}...`
                }
                placeholderTextColor="#94A3B8"
                value={newMessage}
                onChangeText={handleTyping}
                onContentSizeChange={(event) => {
                  setInputHeight(Math.min(120, Math.max(44, event.nativeEvent.contentSize.height)));
                }}
                multiline={true}
                maxLength={500}
                editable={!isSending && !isRecording}
                textAlignVertical="center"
                selectionColor="#4F46E5"
                scrollEnabled={false}
              />
              
              {newMessage.length > 0 && (
                <View style={styles.characterCount}>
                  <Text style={styles.characterCountText}>
                    {newMessage.length}/500
                  </Text>
                </View>
              )}
              
              <TouchableOpacity 
                style={[
                  styles.emojiPickerButton,
                  showEmojiPicker && styles.emojiPickerButtonActive
                ]}
                onPress={toggleEmojiPicker}
              >
                <Ionicons 
                  name={showEmojiPicker ? "happy" : "happy-outline"} 
                  size={20} 
                  color={showEmojiPicker ? "#4F46E5" : "#64748B"} 
                />
              </TouchableOpacity>
            </View>
            
            {newMessage.trim() ? (
              <TouchableOpacity
                style={[styles.sendButton, styles.sendButtonActive]}
                onPress={handleSendMessage}
                disabled={isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons 
                    name={editingMessage ? "checkmark" : "send"} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.micButton, isRecording && styles.micButtonRecording]}
                onPressIn={startRecording}
                onPressOut={stopRecording}
              >
                <Ionicons 
                  name="mic" 
                  size={20} 
                  color="#FFFFFF" 
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <View style={styles.emojiPicker}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.emojiRow}>
                  {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥'].map(emoji => (
                    <TouchableOpacity
                      key={emoji}
                      style={styles.emojiButton}
                      onPress={() => insertEmoji(emoji)}
                    >
                      <Text style={styles.emoji}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </Animated.View>

        {/* Message Actions Modal */}
        <Modal
          visible={showMessageActions}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowMessageActions(false)}
        >
          <View style={styles.messageActionsOverlay}>
            <TouchableOpacity 
              style={styles.messageActionsBackdrop}
              onPress={() => setShowMessageActions(false)}
            />
            <View style={styles.messageActionsModal}>
              <View style={styles.messageActionsHeader}>
                <Text style={styles.messageActionsTitle}>Message Actions</Text>
                <TouchableOpacity 
                  onPress={() => setShowMessageActions(false)}
                  style={styles.closeActionsButton}
                >
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.messageActionsGrid}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => copyMessage(selectedMessage)}
                >
                  <View style={[styles.actionIcon, { backgroundColor: '#3B82F6' }]}>
                    <Ionicons name="copy" size={20} color="#FFFFFF" />
                  </View>
                  <Text style={styles.actionText}>Copy</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => replyToMessageHandler(selectedMessage)}
                >
                  <View style={[styles.actionIcon, { backgroundColor: '#10B981' }]}>
                    <Ionicons name="arrow-undo" size={20} color="#FFFFFF" />
                  </View>
                  <Text style={styles.actionText}>Reply</Text>
                </TouchableOpacity>

                {selectedMessage?.senderId === user?.uid && (
                  <>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => editMessageHandler(selectedMessage)}
                    >
                      <View style={[styles.actionIcon, { backgroundColor: '#F59E0B' }]}>
                        <Ionicons name="pencil" size={20} color="#FFFFFF" />
                      </View>
                      <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => deleteMessageHandler(selectedMessage)}
                    >
                      <View style={[styles.actionIcon, { backgroundColor: '#EF4444' }]}>
                        <Ionicons name="trash" size={20} color="#FFFFFF" />
                      </View>
                      <Text style={styles.actionText}>Delete</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {/* Quick Reactions */}
              <View style={styles.quickReactionsContainer}>
                <Text style={styles.quickReactionsTitle}>Quick Reactions</Text>
                <View style={styles.quickReactionsRow}>
                  {['👍', '❤️', '😄', '😮', '😢', '🔥'].map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={styles.quickReactionButton}
                      onPress={() => {
                        handleAddReaction(selectedMessage?.id, emoji);
                        setShowMessageActions(false);
                      }}
                    >
                      <Text style={styles.quickReactionEmoji}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  // Header Styles
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // Chat List Styles
  chatList: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  chatListItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  unreadCourseName: {
    fontWeight: '700',
    color: '#0F172A',
  },
  lastMessageTime: {
    fontSize: 13,
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
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '600',
  },
  separator: {
    marginHorizontal: 6,
    color: '#94A3B8',
    fontSize: 12,
  },
  courseCredits: {
    fontSize: 13,
    color: '#64748B',
  },
  lastMessageContainer: {
    marginTop: 2,
  },
  lastMessage: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 18,
  },
  unreadMessage: {
    color: '#1E293B',
    fontWeight: '500',
  },
  noMessages: {
    fontSize: 14,
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

  // Chat Header (Individual Chat)
  chatHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  chatSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 1,
  },
  chatMenuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // Messages List
  messagesList: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  // Message Styles
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 2,
    alignItems: 'flex-end',
  },
  currentUserMessage: {
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  otherUserMessage: {
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  selectedMessage: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    marginHorizontal: -8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  messageAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageBubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    borderColor: '#F1F5F9',
  },
  continuedMessage: {
    borderTopLeftRadius: 6,
    marginLeft: 40,
  },
  selectedBubble: {
    borderColor: '#4F46E5',
    borderWidth: 2,
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
    color: '#4F46E5',
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
    fontSize: 10,
    color: '#7C3AED',
    fontWeight: '500',
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
  editedText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 8,
  },
  messageTime: {
    fontSize: 11,
  },
  currentUserTime: {
    color: '#C7D2FE',
  },
  otherUserTime: {
    color: '#94A3B8',
  },
  messageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Reply Preview
  replyPreview: {
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    flexDirection: 'row',
    borderLeftWidth: 3,
    borderLeftColor: '#4F46E5',
  },
  replyLine: {
    width: 3,
    backgroundColor: '#4F46E5',
    borderRadius: 2,
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  replyAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 2,
  },
  replyText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 16,
  },

  // Reactions
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 4,
  },
  reactionButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reactionButtonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionCount: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },

  // Typing Indicator
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingBubble: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
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
    backgroundColor: '#94A3B8',
  },

  // Input Container
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    paddingBottom: 8,
    minHeight: 60,
    position: 'relative',
    zIndex: 1000,
  },
  replyBar: {
    backgroundColor: '#EEF2FF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  replyBarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyBarLine: {
    width: 3,
    height: 32,
    backgroundColor: '#4F46E5',
    borderRadius: 2,
    marginRight: 8,
  },
  replyBarText: {
    flex: 1,
  },
  replyBarAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  replyBarMessage: {
    fontSize: 13,
    color: '#64748B',
  },
  cancelReplyButton: {
    padding: 8,
  },
  editBar: {
    backgroundColor: '#FEF3C7',
    borderTopWidth: 1,
    borderTopColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editBarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editBarText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F59E0B',
  },
  cancelEditButton: {
    padding: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    paddingRight: 80,
    fontWeight: '400',
    lineHeight: 20,
    textAlignVertical: 'center',
  },
  characterCount: {
    position: 'absolute',
    bottom: 4,
    right: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  characterCountText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  emojiPickerButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiPickerButtonActive: {
    backgroundColor: '#EEF2FF',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  sendButtonActive: {
    backgroundColor: '#4F46E5',
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  micButtonRecording: {
    backgroundColor: '#EF4444',
    transform: [{ scale: 1.1 }],
  },

  // Emoji Picker
  emojiPicker: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingVertical: 12,
  },
  emojiRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  emojiButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
  },
  emoji: {
    fontSize: 20,
  },

  // Message Actions Modal
  messageActionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  messageActionsBackdrop: {
    flex: 1,
  },
  messageActionsModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: height * 0.6,
  },
  messageActionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  messageActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  closeActionsButton: {
    padding: 4,
  },
  messageActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
    width: (width - 80) / 3,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
  },
  quickReactionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  quickReactionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
  },
  quickReactionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickReactionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickReactionEmoji: {
    fontSize: 20,
  },
});