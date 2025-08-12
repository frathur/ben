# Firebase Authentication Setup for UniConnect

## 🔥 Firebase Project Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `uniconnect` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication
1. In your Firebase project, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** authentication
3. Save changes

### 3. Add Your App to Firebase
1. Click the **Web icon** (</>) in project overview
2. Register your app with nickname: `UniConnect`
3. Copy the Firebase configuration object

### 4. Update Configuration
Replace the placeholder values in `config/firebaseConfig.js` with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id"
};
```

## 📦 Required Packages

Make sure to install the required packages:

```bash
pnpm add firebase @react-native-async-storage/async-storage
```

## 🚀 Features Implemented

### ✅ Authentication Features
- **Email/Password Registration** - Users can create accounts with email and password
- **Email/Password Login** - Users can sign in with existing credentials
- **Password Reset** - Users can reset passwords via email
- **Authentication Persistence** - Users stay logged in between app sessions
- **Real-time Auth State** - App responds immediately to authentication changes

### ✅ User Data Management
- **Firestore Integration** - User profiles stored in Firestore database
- **Profile Management** - Full name, student ID, and email stored
- **Course Selection** - Selected courses saved per user

### ✅ Error Handling
- **User-friendly Error Messages** - Clear feedback for all authentication errors
- **Network Error Handling** - Graceful handling of network issues
- **Form Validation** - Client-side validation before Firebase calls

## 🔧 How It Works

### Authentication Flow
1. **App Launch** → Check if user is authenticated
2. **Not Authenticated** → Show Login/SignUp/ForgotPassword screens
3. **Authenticated** → Check if courses selected
4. **No Courses** → Show Course Selection screen
5. **Has Courses** → Show Main App (Dashboard, Chat, etc.)

### Firebase Services Used
- **Firebase Auth** - Email/password authentication
- **Firestore** - User profile and app data storage
- **AsyncStorage** - Local authentication persistence

### Security Features
- **Server-side Validation** - Firebase handles all authentication security
- **Secure Password Storage** - Passwords hashed by Firebase
- **Email Verification** - Can be enabled in Firebase Console
- **Rate Limiting** - Firebase automatically handles abuse prevention

## 🎯 Testing Your Setup

### Test Authentication Flow:
1. **Sign Up** - Create a new account with valid email/password
2. **Check Firebase Console** - Verify user appears in Authentication tab
3. **Sign Out** - Ensure user is logged out properly
4. **Sign In** - Log back in with same credentials
5. **Password Reset** - Test forgot password functionality

### Firestore Data:
1. Go to **Firestore Database** in Firebase Console
2. You should see a `users` collection
3. Each user document contains: fullName, studentId, email, createdAt, selectedCourses

## 🔒 Security Rules (Optional)

Add these Firestore security rules to protect user data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🐛 Troubleshooting

### Common Issues:
1. **"Network request failed"** - Check internet connection
2. **"Invalid API key"** - Verify firebaseConfig values
3. **"Operation not allowed"** - Enable Email/Password in Firebase Console
4. **App crashes on start** - Ensure AsyncStorage is properly installed

### Debug Tips:
- Check Firebase Console > Authentication for user creation
- Check Firebase Console > Firestore for user data
- Use Alert.alert() to debug authentication responses
- Check console logs for Firebase errors

## 🎉 You're All Set!

Your UniConnect app now has fully functional Firebase authentication with:
- ✅ User registration and login
- ✅ Password reset functionality  
- ✅ Persistent authentication state
- ✅ User profile storage in Firestore
- ✅ Real-time authentication state management

Users can now create accounts, sign in, and their authentication state will persist across app sessions! 