// Run this script once to initialize your Firestore database with sample data
// You can run this with Node.js: node scripts/initializeFirestore.js

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./path-to-your-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function initializeDatabase() {
  try {
    // Initialize CS Modules/Courses
    const courses = {
      // Level 100 Courses
      'csm101': {
        id: 'csm101',
        code: 'CSM101',
        name: 'Introduction to Computer Science',
        credits: 3,
        semester: 1,
        level: '100',
        instructor: 'Dr. Sarah Johnson',
        description: 'Fundamentals of computer science and programming concepts'
      },
      'csm102': {
        id: 'csm102',
        code: 'CSM102',
        name: 'Programming Fundamentals',
        credits: 4,
        semester: 1,
        level: '100',
        instructor: 'Prof. Michael Chen',
        description: 'Basic programming concepts using Python'
      },
      'csm111': {
        id: 'csm111',
        code: 'CSM111',
        name: 'Mathematics for Computing',
        credits: 3,
        semester: 2,
        level: '100',
        instructor: 'Dr. Emily Davis',
        description: 'Mathematical foundations for computer science'
      },
      'csm121': {
        id: 'csm121',
        code: 'CSM121',
        name: 'Computer Systems',
        credits: 3,
        semester: 2,
        level: '100',
        instructor: 'Dr. Robert Wilson',
        description: 'Introduction to computer hardware and systems'
      },

      // Level 200 Courses
      'csm201': {
        id: 'csm201',
        code: 'CSM201',
        name: 'Object-Oriented Programming',
        credits: 4,
        semester: 1,
        level: '200',
        instructor: 'Dr. Lisa Anderson',
        description: 'Advanced programming using Java and OOP principles'
      },
      'csm211': {
        id: 'csm211',
        code: 'CSM211',
        name: 'Discrete Mathematics',
        credits: 3,
        semester: 1,
        level: '200',
        instructor: 'Prof. David Brown',
        description: 'Logic, sets, relations, and graph theory'
      },
      'csm221': {
        id: 'csm221',
        code: 'CSM221',
        name: 'Computer Architecture',
        credits: 3,
        semester: 2,
        level: '200',
        instructor: 'Dr. Jennifer Lee',
        description: 'Computer organization and assembly language'
      },
      'csm231': {
        id: 'csm231',
        code: 'CSM231',
        name: 'Database Systems',
        credits: 3,
        semester: 2,
        level: '200',
        instructor: 'Dr. Kevin Wong',
        description: 'Database design and SQL fundamentals'
      },

      // Level 300 Courses
      'csm301': {
        id: 'csm301',
        code: 'CSM301',
        name: 'Data Structures and Algorithms',
        credits: 4,
        semester: 1,
        level: '300',
        instructor: 'Prof. Maria Garcia',
        description: 'Advanced data structures and algorithmic analysis'
      },
      'csm311': {
        id: 'csm311',
        code: 'CSM311',
        name: 'Software Engineering',
        credits: 3,
        semester: 1,
        level: '300',
        instructor: 'Dr. Thomas Miller',
        description: 'Software development lifecycle and methodologies'
      },
      'csm321': {
        id: 'csm321',
        code: 'CSM321',
        name: 'Operating Systems',
        credits: 3,
        semester: 2,
        level: '300',
        instructor: 'Dr. Angela Taylor',
        description: 'Operating system concepts and implementation'
      },
      'csm331': {
        id: 'csm331',
        code: 'CSM331',
        name: 'Computer Networks',
        credits: 3,
        semester: 2,
        level: '300',
        instructor: 'Prof. James Rodriguez',
        description: 'Network protocols and distributed systems'
      },

      // Level 400 Courses
      'csm401': {
        id: 'csm401',
        code: 'CSM401',
        name: 'Machine Learning',
        credits: 3,
        semester: 1,
        level: '400',
        instructor: 'Dr. Susan Chang',
        description: 'Introduction to machine learning algorithms'
      },
      'csm411': {
        id: 'csm411',
        code: 'CSM411',
        name: 'Artificial Intelligence',
        credits: 3,
        semester: 1,
        level: '400',
        instructor: 'Prof. Daniel Kim',
        description: 'AI principles and applications'
      },
      'csm421': {
        id: 'csm421',
        code: 'CSM421',
        name: 'Cybersecurity',
        credits: 3,
        semester: 2,
        level: '400',
        instructor: 'Dr. Rachel Green',
        description: 'Information security and cryptography'
      },
      'csm495': {
        id: 'csm495',
        code: 'CSM495',
        name: 'Final Year Project',
        credits: 6,
        semester: 2,
        level: '400',
        instructor: 'Various Supervisors',
        description: 'Capstone project in chosen specialization'
      }
    };

    // Add courses to Firestore
    console.log('Adding courses to Firestore...');
    const batch = db.batch();
    
    Object.values(courses).forEach(course => {
      const courseRef = db.collection('courses').doc(course.id);
      batch.set(courseRef, course);
    });

    await batch.commit();
    console.log('✅ Courses added successfully!');

    // Add sample notifications
    console.log('Adding sample notifications...');
    const notifications = [
      {
        id: 'notif1',
        title: 'New Assignment Posted',
        message: 'CSM301 Data Structures Assignment 3 has been posted. Due date: Next Friday.',
        course: 'CSM301',
        type: 'assignment',
        timestamp: new Date(),
        forAllUsers: true,
        read: false
      },
      {
        id: 'notif2',
        title: 'Lecture Material Updated',
        message: 'New slides for Week 8 have been uploaded to CSM221 Computer Architecture.',
        course: 'CSM221',
        type: 'material',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        forAllUsers: true,
        read: false
      }
    ];

    const notifBatch = db.batch();
    notifications.forEach(notif => {
      const notifRef = db.collection('notifications').doc(notif.id);
      notifBatch.set(notifRef, notif);
    });

    await notifBatch.commit();
    console.log('✅ Sample notifications added!');

    console.log('🎉 Database initialization complete!');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  }
}

// Run the initialization
initializeDatabase();
