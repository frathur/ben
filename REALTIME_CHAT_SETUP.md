# 🚀 Real-Time Chat Functionality Setup Guide

This guide will help you set up the complete real-time chat functionality for the UniConnect app using Firebase Firestore.

## 📋 Prerequisites

1. **Firebase Project**: Make sure you have a Firebase project set up
2. **Firestore Database**: Firestore should be enabled in your Firebase project
3. **Authentication**: Firebase Authentication should be configured

## 🔧 Firebase Configuration

### 1. Firestore Security Rules

Update your Firestore rules in the Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Chat messages collection
    match /chatMessages/{courseCode} {
      allow read, write: if request.auth != null;
      
      match /messages/{messageId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null && 
                     request.auth.uid == request.resource.data.senderId;
        allow update: if request.auth != null && (
          // Allow users to update readBy array
          request.auth.uid != resource.data.senderId ||
          // Allow adding reactions
          'reactions' in request.resource.data
        );
      }
    }
    
    // Typing indicators
    match /typingIndicators/{courseCode} {
      allow read, write: if request.auth != null;
      
      match /users/{userId} {
        allow read, write: if request.auth != null;
        allow delete: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // User presence
    match /userPresence/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 2. Firestore Indexes

Create these composite indexes in the Firebase Console:

#### For Chat Messages:
- Collection: `chatMessages/{courseCode}/messages`
- Fields: `timestamp` (Ascending), `senderId` (Ascending)

#### For User Presence:
- Collection: `userPresence`
- Fields: `isOnline` (Ascending), `userType` (Ascending), `academicLevel` (Ascending)

#### For Typing Indicators:
- Collection: `typingIndicators/{courseCode}/users`
- Fields: `userId` (Ascending), `timestamp` (Descending)

## 🛠️ Installation

### 1. Install Required Dependencies

Make sure these packages are installed:

```bash
# If using npm
npm install firebase @react-native-async-storage/async-storage

# If using pnpm
pnpm install firebase @react-native-async-storage/async-storage
```

### 2. Firebase Configuration

Update your `config/firebaseConfig.js` with your Firebase project credentials:

```javascript
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
const db = getFirestore(app);

export { auth, db };
export default app;
```

## 🔄 Real-Time Features Implemented

### ✅ 1. Real-Time Messaging
- **Send Messages**: Messages are instantly sent to Firestore
- **Receive Messages**: Real-time listeners update the UI immediately
- **Message Status**: Shows sent, delivered, and read status
- **Message Persistence**: All messages are stored in Firestore

### ✅ 2. Typing Indicators
- **Real-Time Typing**: Shows when users are typing
- **Auto-Clear**: Typing indicators disappear after 3 seconds of inactivity
- **Multiple Users**: Displays multiple users typing simultaneously

### ✅ 3. Online Presence
- **Online Status**: Tracks which users are currently online
- **Heartbeat System**: Updates user presence every 30 seconds
- **Last Seen**: Shows when users were last active
- **Course-Specific**: Shows online count for each course

### ✅ 4. Message Features
- **Read Receipts**: Track which users have read messages
- **Message Reactions**: Add emoji reactions to messages (👍, ❤️, 😄, etc.)
- **Unread Counts**: Show unread message counts in chat list
- **Message History**: Persistent message history

### ✅ 5. WhatsApp-Style UI
- **Chat List**: Vertical list of courses with last messages
- **Individual Chats**: Dedicated chat view for each course
- **Message Bubbles**: Different styles for sent/received messages
- **Time Stamps**: Smart time formatting (minutes, hours, days)
- **Search**: Search through courses in chat list

## 📊 Data Structure

### Chat Messages
```javascript
// Collection: chatMessages/{courseCode}
{
  courseCode: "CSM101",
  lastMessage: {
    text: "Hello everyone!",
    timestamp: Timestamp,
    senderId: "userId123",
    senderName: "John Doe"
  },
  lastActivity: Timestamp,
  participantCount: 25
}

// Subcollection: chatMessages/{courseCode}/messages
{
  id: "messageId123",
  text: "Hello everyone!",
  type: "text", // "text", "image", "file"
  senderId: "userId123",
  senderName: "John Doe",
  senderAvatar: "https://...",
  senderType: "student", // "student", "lecturer"
  academicLevel: "100", // for students
  courseCode: "CSM101",
  timestamp: Timestamp,
  status: "delivered", // "sent", "delivered", "read"
  readBy: ["userId123", "userId456"],
  reactions: {
    "👍": ["userId123", "userId456"],
    "❤️": ["userId789"]
  }
}
```

### User Presence
```javascript
// Collection: userPresence
{
  userId: "userId123",
  isOnline: true,
  lastSeen: Timestamp,
  name: "John Doe",
  userType: "student",
  academicLevel: "100",
  avatar: "https://..."
}
```

### Typing Indicators
```javascript
// Collection: typingIndicators/{courseCode}/users
{
  userId: "userId123",
  userName: "John Doe",
  userType: "student",
  timestamp: Timestamp
}
```

## 🚀 Usage Examples

### Sending a Message
```javascript
const result = await chatService.sendMessage('CSM101', 'Hello everyone!');
if (result.success) {
  console.log('Message sent successfully');
} else {
  console.error('Failed to send message:', result.error);
}
```

### Listening to Messages
```javascript
const unsubscribe = chatService.listenToMessages('CSM101', (messages) => {
  setMessages(messages);
});

// Don't forget to unsubscribe when component unmounts
useEffect(() => {
  return () => unsubscribe();
}, []);
```

### Setting Typing Status
```javascript
// User started typing
await chatService.setTypingStatus('CSM101', true);

// User stopped typing
await chatService.setTypingStatus('CSM101', false);
```

### Adding Reactions
```javascript
await chatService.addReaction('CSM101', 'messageId123', '👍');
```

## 🔧 Customization

### Adding New Message Types
To support image or file messages, update the `sendMessage` method in `chatService.js`:

```javascript
async sendMessage(courseCode, content, messageType = 'text', metadata = {}) {
  const messageData = {
    text: messageType === 'text' ? content : '',
    type: messageType,
    imageUrl: messageType === 'image' ? content : null,
    fileUrl: messageType === 'file' ? content : null,
    fileName: metadata.fileName || null,
    fileSize: metadata.fileSize || null,
    // ... other fields
  };
  // ... rest of the method
}
```

### Adding More Reactions
Update the reaction emojis in `GroupChatScreen.js`:

```javascript
const availableReactions = ['👍', '❤️', '😄', '😮', '😢', '😡', '🔥', '🎉'];
```

## 🐛 Troubleshooting

### Common Issues

1. **Messages not appearing in real-time**
   - Check Firestore security rules
   - Verify internet connection
   - Check Firebase console for errors

2. **Typing indicators not working**
   - Ensure proper cleanup of typing timeouts
   - Check if typing collection exists in Firestore

3. **Online status not updating**
   - Verify user presence listeners are set up correctly
   - Check heartbeat interval is running

4. **Permission denied errors**
   - Review Firestore security rules
   - Ensure user is properly authenticated

### Debug Mode
Enable debug logging in `chatService.js`:

```javascript
// Add this at the top of chatService.js
const DEBUG = true;

const log = (message, data = '') => {
  if (DEBUG) {
    console.log(`[ChatService] ${message}`, data);
  }
};
```

## 📱 Testing

### Test Real-Time Features
1. Open the app on multiple devices/simulators
2. Sign in with different user accounts
3. Join the same course chat
4. Send messages and verify they appear instantly
5. Test typing indicators by typing in one device
6. Check online status updates

### Test Data Initialization
Run the initialization script to populate sample data:

```bash
node scripts/initializeChatData.js
```

## 🔒 Security Considerations

1. **Input Validation**: Always validate message content before sending
2. **Rate Limiting**: Consider implementing rate limiting for message sending
3. **Content Moderation**: Add content filtering for inappropriate messages
4. **User Permissions**: Verify users have access to specific course chats
5. **Data Privacy**: Ensure compliance with data protection regulations

## 🎯 Performance Optimization

1. **Message Pagination**: Implement pagination for large chat histories
2. **Listener Management**: Properly clean up Firestore listeners
3. **Caching**: Use local caching for frequently accessed data
4. **Batch Operations**: Use batch writes for multiple operations
5. **Offline Support**: Consider implementing offline message queuing

## 🚀 Deployment

Before deploying to production:

1. Update Firebase security rules for production
2. Set up proper error monitoring
3. Configure backup strategies for chat data
4. Test with production data volumes
5. Set up monitoring for real-time performance

---

## 🎉 You're All Set!

Your real-time chat functionality is now ready! Users can:
- ✅ Send and receive messages instantly
- ✅ See typing indicators in real-time
- ✅ Track online status of coursemates
- ✅ View message read receipts
- ✅ Add reactions to messages
- ✅ Navigate WhatsApp-style chat interface

Enjoy your real-time university collaboration platform! 🎓💬
