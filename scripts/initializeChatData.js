/**
 * Chat Data Initialization Script
 * 
 * This script initializes sample chat data for testing the real-time chat functionality.
 * Run this in a Node.js environment with Firebase Admin SDK.
 * 
 * To run:
 * 1. Install Firebase Admin SDK: npm install firebase-admin
 * 2. Download your Firebase service account key
 * 3. Update the path to your service account key below
 * 4. Run: node scripts/initializeChatData.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Replace with your service account key path
const serviceAccount = require('./path/to/your/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'uniconnect-cedf3' // Replace with your project ID
});

const db = admin.firestore();

async function initializeChatData() {
  try {
    console.log('🚀 Initializing chat data...');

    // Sample course codes
    const courseCodes = ['CSM101', 'CSM102', 'CSM201', 'CSM202', 'CSM301', 'CSM302', 'CSM401', 'CSM402'];

    // Sample users
    const sampleUsers = [
      {
        id: 'user1',
        fullName: 'John Doe',
        userType: 'student',
        academicLevel: '100',
        avatar: null
      },
      {
        id: 'user2',
        fullName: 'Jane Smith',
        userType: 'student',
        academicLevel: '200',
        avatar: null
      },
      {
        id: 'lecturer1',
        fullName: 'Dr. Alice Johnson',
        userType: 'lecturer',
        teachingCourses: ['CSM101', 'CSM201'],
        avatar: null
      },
      {
        id: 'lecturer2',
        fullName: 'Prof. Bob Wilson',
        userType: 'lecturer',
        teachingCourses: ['CSM301', 'CSM401'],
        avatar: null
      }
    ];

    // Sample messages for each course
    const sampleMessages = [
      {
        text: "Welcome to the course! Looking forward to working with everyone this semester.",
        senderId: 'lecturer1',
        senderName: 'Dr. Alice Johnson',
        senderType: 'lecturer',
        type: 'text'
      },
      {
        text: "Hi everyone! Excited to be in this class. Has anyone started reading the course materials?",
        senderId: 'user1',
        senderName: 'John Doe',
        senderType: 'student',
        academicLevel: '100',
        type: 'text'
      },
      {
        text: "Yes, I've gone through the first two chapters. The concepts are quite interesting!",
        senderId: 'user2',
        senderName: 'Jane Smith',
        senderType: 'student',
        academicLevel: '200',
        type: 'text'
      },
      {
        text: "Great to hear! Don't hesitate to ask questions if anything is unclear.",
        senderId: 'lecturer1',
        senderName: 'Dr. Alice Johnson',
        senderType: 'lecturer',
        type: 'text'
      }
    ];

    // Initialize chat data for each course
    for (const courseCode of courseCodes) {
      console.log(`📚 Setting up chat for ${courseCode}...`);

      // Create course document
      await db.collection('chatMessages').doc(courseCode).set({
        courseCode,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastActivity: admin.firestore.FieldValue.serverTimestamp(),
        participantCount: 0
      });

      // Add sample messages
      const messagesRef = db.collection('chatMessages').doc(courseCode).collection('messages');
      
      for (let i = 0; i < sampleMessages.length; i++) {
        const message = sampleMessages[i];
        const messageData = {
          ...message,
          courseCode,
          timestamp: admin.firestore.Timestamp.fromDate(
            new Date(Date.now() - (sampleMessages.length - i) * 60000) // Messages 1 minute apart
          ),
          status: 'delivered',
          readBy: [message.senderId],
          reactions: {}
        };

        await messagesRef.add(messageData);
      }

      // Update last message info
      const lastMessage = sampleMessages[sampleMessages.length - 1];
      await db.collection('chatMessages').doc(courseCode).update({
        lastMessage: {
          text: lastMessage.text,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          senderId: lastMessage.senderId,
          senderName: lastMessage.senderName
        }
      });
    }

    console.log('✅ Chat data initialization completed!');
    console.log(`📊 Initialized ${courseCodes.length} courses with sample messages`);
    
  } catch (error) {
    console.error('❌ Error initializing chat data:', error);
  } finally {
    process.exit(0);
  }
}

// Run the initialization
initializeChatData();
