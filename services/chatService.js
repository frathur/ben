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

class ChatService {
  constructor() {
    this.messageListeners = new Map();
    this.typingListeners = new Map();
    this.onlineStatusListeners = new Map();
    this.currentUserId = null;
    this.userProfile = null;
    
    // Listen to auth state changes
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.currentUserId = user.uid;
        this.initializeUserPresence();
      } else {
        this.currentUserId = null;
        this.userProfile = null;
        this.cleanup();
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

      // Listen for when user goes offline
      window.addEventListener('beforeunload', () => {
        this.setUserOnlineStatus(false);
      });

      // Set up periodic heartbeat to maintain online status
      this.heartbeatInterval = setInterval(async () => {
        await this.updateHeartbeat();
      }, 30000); // Update every 30 seconds

    } catch (error) {
      console.error('Error initializing user presence:', error);
    }
  }

  // Set user online/offline status
  async setUserOnlineStatus(isOnline) {
    if (!this.currentUserId) return;

    try {
      const userPresenceRef = doc(db, 'userPresence', this.currentUserId);
      await setDoc(userPresenceRef, {
        userId: this.currentUserId,
        isOnline,
        lastSeen: serverTimestamp(),
        ...(this.userProfile && {
          name: this.userProfile.fullName || this.userProfile.name,
          userType: this.userProfile.userType,
          academicLevel: this.userProfile.academicLevel,
          avatar: this.userProfile.avatar
        })
      }, { merge: true });
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
      const q = query(
        messagesRef, 
        where('readBy', 'not-in', [[this.currentUserId]]),
        where('senderId', '!=', this.currentUserId)
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
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

  // Cleanup all listeners
  cleanup() {
    // Clean up message listeners
    this.messageListeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.messageListeners.clear();

    // Clean up typing listeners
    this.typingListeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.typingListeners.clear();

    // Clean up online status listeners
    this.onlineStatusListeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.onlineStatusListeners.clear();

    // Clear heartbeat interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Set user offline
    if (this.currentUserId) {
      this.setUserOnlineStatus(false);
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
