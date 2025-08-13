import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  setDoc, 
  deleteDoc,
  where,
  limit,
  getDocs,
  writeBatch,
  arrayUnion,
  arrayRemove,
  getDoc
} from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import { AppState } from 'react-native';

class ChatService {
  constructor() {
    this.messageListeners = new Map();
    this.typingListeners = new Map();
    this.onlineStatusListeners = new Map();
    this.currentUserId = null;
    this.userProfile = null;
    this.heartbeatInterval = null;
    this.appStateSubscription = null;
    
    // Listen to auth state changes
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.currentUserId = user.uid;
        this.initializeUserPresence();
      } else {
        // Immediately cleanup on auth state change to null
        this.immediateCleanup();
      }
    });
  }

  // Initialize user presence system
  async initializeUserPresence() {
    if (!this.currentUserId) return;

    try {
      // Get user profile data
      const userDoc = await getDoc(doc(db, 'users', this.currentUserId));
      if (userDoc.exists()) {
        this.userProfile = { id: this.currentUserId, ...userDoc.data() };
      }

      // Set user as online
      await this.setUserOnlineStatus(true);

      // Set up periodic heartbeat to maintain online status
      this.heartbeatInterval = setInterval(async () => {
        await this.updateHeartbeat();
      }, 30000); // Update every 30 seconds

      // Handle app state changes for React Native
      this.handleAppStateChange = (nextAppState) => {
        if (nextAppState === 'background' || nextAppState === 'inactive') {
          // App is going to background
          this.setUserOnlineStatus(false);
        } else if (nextAppState === 'active') {
          // App is coming to foreground
          this.setUserOnlineStatus(true);
        }
      };

      // Add app state listener
      this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);

    } catch (error) {
      console.error('Error initializing user presence:', error);
    }
  }

  // Set user online/offline status
  async setUserOnlineStatus(isOnline) {
    if (!this.currentUserId) return;

    try {
      const userPresenceRef = doc(db, 'userPresence', this.currentUserId);
      const presenceData = {
        userId: this.currentUserId,
        isOnline,
        lastSeen: serverTimestamp(),
      };

      // Only add profile data if it exists and is not undefined
      if (this.userProfile) {
        if (this.userProfile.fullName || this.userProfile.name) {
          presenceData.name = this.userProfile.fullName || this.userProfile.name;
        }
        if (this.userProfile.userType) {
          presenceData.userType = this.userProfile.userType;
        }
        if (this.userProfile.academicLevel) {
          presenceData.academicLevel = this.userProfile.academicLevel;
        }
        if (this.userProfile.avatar) {
          presenceData.avatar = this.userProfile.avatar;
        }
      }

      await setDoc(userPresenceRef, presenceData, { merge: true });
    } catch (error) {
      console.error('Error setting user online status:', error);
    }
  }

  // Update user heartbeat
  async updateHeartbeat() {
    if (!this.currentUserId) return;

    try {
      const userPresenceRef = doc(db, 'userPresence', this.currentUserId);
      await updateDoc(userPresenceRef, {
        lastSeen: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating heartbeat:', error);
    }
  }

  // Send a message to a course chat
  async sendMessage(courseCode, messageText, messageType = 'text') {
    if (!this.currentUserId || !this.userProfile) {
      throw new Error('User not authenticated');
    }

    try {
      const messagesRef = collection(db, 'chatMessages', courseCode, 'messages');
      
      const messageData = {
        text: messageText,
        type: messageType,
        senderId: this.currentUserId,
        senderName: this.userProfile.fullName || this.userProfile.name,
        senderAvatar: this.userProfile.avatar || null,
        senderType: this.userProfile.userType || 'student',
        academicLevel: this.userProfile.academicLevel || null,
        courseCode,
        timestamp: serverTimestamp(),
        status: 'sent',
        readBy: [this.currentUserId],
        reactions: {}
      };

      const docRef = await addDoc(messagesRef, messageData);
      
      // Update course's last message info
      await this.updateCourseLastMessage(courseCode, messageData);
      
      // Clear typing indicator
      await this.setTypingStatus(courseCode, false);

      return { success: true, messageId: docRef.id };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }

  // Update course's last message information
  async updateCourseLastMessage(courseCode, messageData) {
    try {
      const courseRef = doc(db, 'chatMessages', courseCode);
      await setDoc(courseRef, {
        lastMessage: {
          text: messageData.text,
          timestamp: messageData.timestamp,
          senderId: messageData.senderId,
          senderName: messageData.senderName
        },
        lastActivity: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating course last message:', error);
    }
  }

  // Listen to messages for a specific course
  listenToMessages(courseCode, callback) {
    if (this.messageListeners.has(courseCode)) {
      this.messageListeners.get(courseCode)(); // Unsubscribe previous listener
    }

    const messagesRef = collection(db, 'chatMessages', courseCode, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate?.() || new Date()
        });
      });
      
      callback(messages);
      
      // Mark messages as read
      this.markMessagesAsRead(courseCode, messages);
    }, (error) => {
      console.error('Error listening to messages:', error);
      callback([]);
    });

    this.messageListeners.set(courseCode, unsubscribe);
    return unsubscribe;
  }

  // Mark messages as read
  async markMessagesAsRead(courseCode, messages) {
    if (!this.currentUserId) return;

    try {
      const batch = writeBatch(db);
      
      messages.forEach((message) => {
        if (message.senderId !== this.currentUserId && 
            !message.readBy?.includes(this.currentUserId)) {
          const messageRef = doc(db, 'chatMessages', courseCode, 'messages', message.id);
          batch.update(messageRef, {
            readBy: arrayUnion(this.currentUserId)
          });
        }
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Set typing status
  async setTypingStatus(courseCode, isTyping) {
    if (!this.currentUserId || !this.userProfile) return;

    try {
      const typingRef = doc(db, 'typingIndicators', courseCode, 'users', this.currentUserId);
      
      if (isTyping) {
        await setDoc(typingRef, {
          userId: this.currentUserId,
          userName: this.userProfile.fullName || this.userProfile.name,
          userType: this.userProfile.userType,
          timestamp: serverTimestamp()
        });
      } else {
        await deleteDoc(typingRef);
      }
    } catch (error) {
      console.error('Error setting typing status:', error);
    }
  }

  // Listen to typing indicators
  listenToTypingIndicators(courseCode, callback) {
    if (this.typingListeners.has(courseCode)) {
      this.typingListeners.get(courseCode)();
    }

    const typingRef = collection(db, 'typingIndicators', courseCode, 'users');
    const q = query(typingRef, where('userId', '!=', this.currentUserId || ''));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const typingUsers = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Only include users who were typing in the last 5 seconds
        const now = new Date();
        const typingTime = data.timestamp?.toDate?.() || new Date(0);
        if (now - typingTime < 5000) {
          typingUsers.push({
            id: data.userId,
            name: data.userName,
            userType: data.userType
          });
        }
      });
      
      callback(typingUsers);
    }, (error) => {
      console.error('Error listening to typing indicators:', error);
      callback([]);
    });

    this.typingListeners.set(courseCode, unsubscribe);
    return unsubscribe;
  }

  // Get online users for a course
  async getOnlineUsersForCourse(courseCode, userType = null, academicLevel = null) {
    try {
      const presenceRef = collection(db, 'userPresence');
      let q = query(presenceRef, where('isOnline', '==', true));

      if (userType) {
        q = query(q, where('userType', '==', userType));
      }
      
      if (academicLevel) {
        q = query(q, where('academicLevel', '==', academicLevel));
      }

      const snapshot = await getDocs(q);
      const onlineUsers = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Filter based on last seen (consider online if last seen within 2 minutes)
        const lastSeen = data.lastSeen?.toDate?.() || new Date(0);
        const now = new Date();
        if (now - lastSeen < 120000) { // 2 minutes
          onlineUsers.push({
            id: doc.id,
            ...data,
            lastSeen
          });
        }
      });

      return onlineUsers;
    } catch (error) {
      console.error('Error getting online users:', error);
      return [];
    }
  }

  // Listen to online status for a course
  listenToOnlineStatus(courseCode, userType, academicLevel, callback) {
    const key = `${courseCode}-${userType}-${academicLevel}`;
    
    if (this.onlineStatusListeners.has(key)) {
      this.onlineStatusListeners.get(key)();
    }

    const presenceRef = collection(db, 'userPresence');
    let q = query(presenceRef, where('isOnline', '==', true));

    if (userType) {
      q = query(q, where('userType', '==', userType));
    }
    
    if (academicLevel) {
      q = query(q, where('academicLevel', '==', academicLevel));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const onlineUsers = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const lastSeen = data.lastSeen?.toDate?.() || new Date(0);
        const now = new Date();
        
        if (now - lastSeen < 120000) { // Consider online if last seen within 2 minutes
          onlineUsers.push({
            id: doc.id,
            ...data,
            lastSeen
          });
        }
      });

      callback(onlineUsers.length);
    }, (error) => {
      console.error('Error listening to online status:', error);
      callback(0);
    });

    this.onlineStatusListeners.set(key, unsubscribe);
    return unsubscribe;
  }

  // Add reaction to message
  async addReaction(courseCode, messageId, emoji) {
    if (!this.currentUserId) return;

    try {
      const messageRef = doc(db, 'chatMessages', courseCode, 'messages', messageId);
      const reactionKey = `reactions.${emoji}`;
      
      await updateDoc(messageRef, {
        [reactionKey]: arrayUnion(this.currentUserId)
      });

      return { success: true };
    } catch (error) {
      console.error('Error adding reaction:', error);
      return { success: false, error: error.message };
    }
  }

  // Remove reaction from message
  async removeReaction(courseCode, messageId, emoji) {
    if (!this.currentUserId) return;

    try {
      const messageRef = doc(db, 'chatMessages', courseCode, 'messages', messageId);
      const reactionKey = `reactions.${emoji}`;
      
      await updateDoc(messageRef, {
        [reactionKey]: arrayRemove(this.currentUserId)
      });

      return { success: true };
    } catch (error) {
      console.error('Error removing reaction:', error);
      return { success: false, error: error.message };
    }
  }

  // Get unread message count for a course
  async getUnreadCount(courseCode) {
    if (!this.currentUserId) return 0;

    try {
      const messagesRef = collection(db, 'chatMessages', courseCode, 'messages');
      // Get all messages and filter client-side to avoid Firestore query limitations
      const snapshot = await getDocs(messagesRef);
      
      let unreadCount = 0;
      snapshot.forEach((doc) => {
        const message = doc.data();
        // Count messages that:
        // 1. Were not sent by current user
        // 2. Have not been read by current user (current user not in readBy array)
        if (message.senderId !== this.currentUserId && 
            (!message.readBy || !message.readBy.includes(this.currentUserId))) {
          unreadCount++;
        }
      });

      return unreadCount;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Get recent messages for chat list preview
  async getRecentMessages(courses) {
    const recentMessages = {};

    try {
      for (const course of courses) {
        const messagesRef = collection(db, 'chatMessages', course.code, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));
        
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const lastMessage = snapshot.docs[0].data();
          recentMessages[course.code] = {
            ...lastMessage,
            timestamp: lastMessage.timestamp?.toDate?.() || new Date()
          };
        }
      }

      return recentMessages;
    } catch (error) {
      console.error('Error getting recent messages:', error);
      return {};
    }
  }

  // Immediate cleanup for logout (synchronous)
  immediateCleanup() {
    // Clear user data immediately
    this.currentUserId = null;
    this.userProfile = null;
    
    // Clean up message listeners
    try {
      this.messageListeners.forEach((unsubscribe) => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
      this.messageListeners.clear();
    } catch (error) {
      console.warn('Error cleaning up message listeners:', error);
    }

    // Clean up typing listeners
    try {
      this.typingListeners.forEach((unsubscribe) => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
      this.typingListeners.clear();
    } catch (error) {
      console.warn('Error cleaning up typing listeners:', error);
    }

    // Clean up online status listeners
    try {
      this.onlineStatusListeners.forEach((unsubscribe) => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
      this.onlineStatusListeners.clear();
    } catch (error) {
      console.warn('Error cleaning up online status listeners:', error);
    }

    // Clear heartbeat interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Remove app state listener
    if (this.appStateSubscription) {
      try {
        this.appStateSubscription.remove();
      } catch (error) {
        console.warn('Error removing app state subscription:', error);
      }
      this.appStateSubscription = null;
    }
  }

  // Edit message
  async editMessage(courseCode, messageId, newText) {
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      const messageRef = doc(this.db, 'chatMessages', courseCode, 'messages', messageId);
      
      await updateDoc(messageRef, {
        text: newText.trim(),
        edited: true,
        editedAt: new Date()
      });

      return { success: true };
    } catch (error) {
      console.error('Error editing message:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete message
  async deleteMessage(courseCode, messageId) {
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      const messageRef = doc(this.db, 'chatMessages', courseCode, 'messages', messageId);
      
      await deleteDoc(messageRef);

      return { success: true };
    } catch (error) {
      console.error('Error deleting message:', error);
      return { success: false, error: error.message };
    }
  }

  // Get sorted chat list by recent messages
  async getSortedChatList(courses) {
    const sortedCourses = [...courses];
    
    try {
      const recentMessages = {};
      
      // Get recent message for each course
      for (const course of courses) {
        const recentMessage = await this.getRecentMessages(course.code, 1);
        if (recentMessage.length > 0) {
          recentMessages[course.code] = recentMessage[0];
        }
      }
      
      // Sort courses by most recent message timestamp
      sortedCourses.sort((a, b) => {
        const aTime = recentMessages[a.code]?.timestamp?.toDate?.() || new Date(0);
        const bTime = recentMessages[b.code]?.timestamp?.toDate?.() || new Date(0);
        return bTime - aTime;
      });
      
      return sortedCourses;
    } catch (error) {
      console.error('Error sorting chat list:', error);
      return sortedCourses;
    }
  }

  // Cleanup all listeners (keeps async offline status update)
  cleanup() {
    // Set user offline first if we have a current user
    const currentUserId = this.currentUserId;
    
    // Do immediate cleanup
    this.immediateCleanup();
    
    // Set user offline asynchronously (best effort)
    if (currentUserId) {
      setTimeout(async () => {
        try {
          const userPresenceRef = doc(db, 'userPresence', currentUserId);
          await setDoc(userPresenceRef, {
            userId: currentUserId,
            isOnline: false,
            lastSeen: serverTimestamp(),
          }, { merge: true });
        } catch (error) {
          // Ignore errors during cleanup
          console.warn('Error setting user offline during cleanup:', error);
        }
      }, 0);
    }
  }

  // Get chat statistics
  async getChatStats(courseCode) {
    try {
      const messagesRef = collection(db, 'chatMessages', courseCode, 'messages');
      const snapshot = await getDocs(messagesRef);
      
      let messageCount = 0;
      let participantCount = new Set();
      let lastActivity = null;

      snapshot.forEach((doc) => {
        const data = doc.data();
        messageCount++;
        participantCount.add(data.senderId);
        
        const timestamp = data.timestamp?.toDate?.();
        if (!lastActivity || (timestamp && timestamp > lastActivity)) {
          lastActivity = timestamp;
        }
      });

      return {
        messageCount,
        participantCount: participantCount.size,
        lastActivity
      };
    } catch (error) {
      console.error('Error getting chat stats:', error);
      return {
        messageCount: 0,
        participantCount: 0,
        lastActivity: null
      };
    }
  }
}

// Create and export a singleton instance
const chatService = new ChatService();
export default chatService;
