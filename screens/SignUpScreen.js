import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function SignUpScreen({ navigation }) {
  const [formData, setFormData] = useState({
    fullName: '',
    identifier: '', // Student ID or Staff ID
    email: '',
    password: '',
    confirmPassword: '',
    userType: '', // 'student' or 'lecturer'
    academicLevel: '', // For students only
    teachingCourses: [], // For lecturers only
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useApp();

  const userTypes = [
    { id: 'student', title: 'Student', description: 'I am a student', icon: 'school' },
    { id: 'lecturer', title: 'Lecturer', description: 'I am a lecturer/instructor', icon: 'library' },
  ];

  const academicLevels = [
    { id: '100', level: '100 Level', description: 'First Year - Foundation' },
    { id: '200', level: '200 Level', description: 'Second Year - Core Fundamentals' },
    { id: '300', level: '300 Level', description: 'Third Year - Specialization' },
    { id: '400', level: '400 Level', description: 'Fourth Year - Advanced Studies' },
  ];

  // Available courses for lecturers to teach (from all levels)
  const allCourses = [
    // 100 Level
    { id: 'csm151', code: 'CSM151', name: 'Information Technology I', level: '100' },
    { id: 'csm153', code: 'CSM153', name: 'Circuit Theory', level: '100' },
    { id: 'csm157', code: 'CSM157', name: 'Introduction to Structured Program Design', level: '100' },
    { id: 'math163', code: 'MATH163', name: 'Discrete Mathematics I', level: '100' },
    { id: 'csm152', code: 'CSM152', name: 'Information Technology II', level: '100' },
    { id: 'csm158', code: 'CSM158', name: 'Programming with C++', level: '100' },
    
    // 200 Level
    { id: 'csm251', code: 'CSM251', name: 'Introductory Electronics', level: '200' },
    { id: 'csm281', code: 'CSM281', name: 'Object Oriented Programming with JAVA', level: '200' },
    { id: 'csm255', code: 'CSM255', name: 'Open Source Operating Systems', level: '200' },
    { id: 'csm297', code: 'CSM297', name: 'Database Concepts and Technologies I', level: '200' },
    { id: 'csm254', code: 'CSM254', name: 'Programming with Assembly Language', level: '200' },
    { id: 'csm264', code: 'CSM264', name: 'Programming with VISUAL BASIC', level: '200' },
    
    // 300 Level
    { id: 'csm387', code: 'CSM387', name: 'Data Structures I', level: '300' },
    { id: 'csm395', code: 'CSM395', name: 'Introduction to Artificial Intelligence', level: '300' },
    { id: 'csm357', code: 'CSM357', name: 'Human Computer Interaction', level: '300' },
    { id: 'csm399', code: 'CSM399', name: 'Web-Based Concept and Development', level: '300' },
    { id: 'csm352', code: 'CSM352', name: 'Computer Architecture', level: '300' },
    { id: 'csm388', code: 'CSM388', name: 'Data Structures II', level: '300' },
    
    // 400 Level
    { id: 'csm477', code: 'CSM477', name: 'Data Communications', level: '400' },
    { id: 'csm481', code: 'CSM481', name: 'Information Systems I', level: '400' },
    { id: 'csm483', code: 'CSM483', name: 'Operating Systems', level: '400' },
    { id: 'csm489', code: 'CSM489', name: 'Project I', level: '400' },
    { id: 'csm495', code: 'CSM495', name: 'Introduction to Software Engineering', level: '400' },
    { id: 'csm478', code: 'CSM478', name: 'Computer Networks', level: '400' },
  ];

  const toggleCourseSelection = (courseId) => {
    setFormData(prev => ({
      ...prev,
      teachingCourses: prev.teachingCourses.includes(courseId)
        ? prev.teachingCourses.filter(id => id !== courseId)
        : [...prev.teachingCourses, courseId]
    }));
  };

  const validateForm = () => {
    const { fullName, identifier, email, password, confirmPassword, userType, academicLevel, teachingCourses } = formData;

    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }

    if (!userType) {
      Alert.alert('Error', 'Please select if you are a student or lecturer');
      return false;
    }

    if (!identifier.trim()) {
      Alert.alert('Error', userType === 'student' ? 'Please enter your student ID' : 'Please enter your staff ID');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return false;
    }

    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (userType === 'student' && !academicLevel) {
      Alert.alert('Error', 'Please select your academic level');
      return false;
    }

    if (userType === 'lecturer' && teachingCourses.length === 0) {
      Alert.alert('Error', 'Please select at least one course you teach');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const userData = {
        fullName: formData.fullName.trim(),
        identifier: formData.identifier.trim(),
        userType: formData.userType,
        ...(formData.userType === 'student' 
          ? { academicLevel: formData.academicLevel }
          : { teachingCourses: formData.teachingCourses }
        ),
      };

      const result = await signUp(formData.email.trim(), formData.password, userData);

      if (result.success) {
        // Success! Firebase auth state will automatically trigger dashboard
        Alert.alert(
          '🎉 Welcome to UniConnect!',
          'Your account has been created successfully!',
          [{ text: 'Get Started', style: 'default' }]
        );
      } else {
        Alert.alert('Registration Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#4F46E5" />
          </TouchableOpacity>
          <Ionicons name="person-add" size={60} color="#4F46E5" />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the UniConnect community</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={formData.fullName}
              onChangeText={(value) => updateFormData('fullName', value)}
              autoCapitalize="words"
            />
          </View>

          {/* User Type Selection */}
          <View style={styles.userTypeSection}>
            <Text style={styles.sectionTitle}>I am a...</Text>
            <View style={styles.userTypeGrid}>
              {userTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.userTypeCard,
                    formData.userType === type.id && styles.userTypeCardSelected
                  ]}
                  onPress={() => updateFormData('userType', type.id)}
                >
                  <View style={[
                    styles.userTypeIcon,
                    formData.userType === type.id && styles.userTypeIconSelected
                  ]}>
                    <Ionicons 
                      name={type.icon} 
                      size={24} 
                      color={formData.userType === type.id ? '#FFFFFF' : '#64748B'} 
                    />
                  </View>
                  <Text style={[
                    styles.userTypeTitle,
                    formData.userType === type.id && styles.userTypeTitleSelected
                  ]}>
                    {type.title}
                  </Text>
                  <Text style={[
                    styles.userTypeDesc,
                    formData.userType === type.id && styles.userTypeDescSelected
                  ]}>
                    {type.description}
                  </Text>
                  {formData.userType === type.id && (
                    <View style={styles.checkmark}>
                      <Ionicons name="checkmark-circle" size={20} color="#4F46E5" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons 
              name={formData.userType === 'lecturer' ? "briefcase-outline" : "school-outline"} 
              size={20} 
              color="#64748B" 
              style={styles.inputIcon} 
            />
            <TextInput
              style={styles.input}
              placeholder={formData.userType === 'lecturer' ? "Staff ID" : "Student ID"}
              value={formData.identifier}
              onChangeText={(value) => updateFormData('identifier', value)}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="University Email"
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Conditional Content Based on User Type */}
          {formData.userType === 'student' && (
            <View style={styles.levelSection}>
              <Text style={styles.sectionTitle}>Select Your Academic Level</Text>
              <View style={styles.levelGrid}>
                {academicLevels.map((levelOption) => (
                  <TouchableOpacity
                    key={levelOption.id}
                    style={[
                      styles.levelCard,
                      formData.academicLevel === levelOption.id && styles.levelCardSelected
                    ]}
                    onPress={() => updateFormData('academicLevel', levelOption.id)}
                  >
                    <View style={[
                      styles.levelIcon,
                      formData.academicLevel === levelOption.id && styles.levelIconSelected
                    ]}>
                      <Text style={[
                        styles.levelNumber,
                        formData.academicLevel === levelOption.id && styles.levelNumberSelected
                      ]}>
                        {levelOption.id}
                      </Text>
                    </View>
                    <Text style={[
                      styles.levelTitle,
                      formData.academicLevel === levelOption.id && styles.levelTitleSelected
                    ]}>
                      {levelOption.level}
                    </Text>
                    <Text style={[
                      styles.levelDescription,
                      formData.academicLevel === levelOption.id && styles.levelDescriptionSelected
                    ]}>
                      {levelOption.description}
                    </Text>
                    {formData.academicLevel === levelOption.id && (
                      <View style={styles.checkmark}>
                        <Ionicons name="checkmark-circle" size={20} color="#4F46E5" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {formData.userType === 'lecturer' && (
            <View style={styles.coursesSection}>
              <Text style={styles.sectionTitle}>Select Courses You Teach</Text>
              <Text style={styles.sectionSubtitle}>You can select multiple courses across different levels</Text>
              <ScrollView style={styles.coursesScrollView} nestedScrollEnabled>
                {['100', '200', '300', '400'].map(level => (
                  <View key={level} style={styles.levelGroup}>
                    <Text style={styles.levelGroupTitle}>Level {level} Courses</Text>
                    <View style={styles.coursesGrid}>
                      {allCourses.filter(course => course.level === level).map(course => (
                        <TouchableOpacity
                          key={course.id}
                          style={[
                            styles.courseCard,
                            formData.teachingCourses.includes(course.id) && styles.courseCardSelected
                          ]}
                          onPress={() => toggleCourseSelection(course.id)}
                        >
                          <Text style={[
                            styles.courseCode,
                            formData.teachingCourses.includes(course.id) && styles.courseCodeSelected
                          ]}>
                            {course.code}
                          </Text>
                          <Text style={[
                            styles.courseName,
                            formData.teachingCourses.includes(course.id) && styles.courseNameSelected
                          ]} numberOfLines={2}>
                            {course.name}
                          </Text>
                          {formData.teachingCourses.includes(course.id) && (
                            <View style={styles.courseCheckmark}>
                              <Ionicons name="checkmark-circle" size={16} color="#4F46E5" />
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={formData.password}
              onChangeText={(value) => updateFormData('password', value)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? "eye" : "eye-off"} 
                size={20} 
                color="#64748B" 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(value) => updateFormData('confirmPassword', value)}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons 
                name={showConfirmPassword ? "eye" : "eye-off"} 
                size={20} 
                color="#64748B" 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.signUpButton, isLoading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            <Text style={styles.signUpButtonText}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View style={styles.loginPrompt}>
            <Text style={styles.loginPromptText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: -20,
    left: 0,
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  eyeIcon: {
    padding: 4,
  },
  signUpButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#94A3B8',
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginPromptText: {
    fontSize: 14,
    color: '#64748B',
  },
  loginLink: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  userTypeSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  userTypeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  userTypeCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    position: 'relative',
  },
  userTypeCardSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  userTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  userTypeIconSelected: {
    backgroundColor: '#4F46E5',
  },
  userTypeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
    textAlign: 'center',
  },
  userTypeTitleSelected: {
    color: '#4F46E5',
  },
  userTypeDesc: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 14,
  },
  userTypeDescSelected: {
    color: '#6366F1',
  },
  levelSection: {
    marginBottom: 24,
  },
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  levelCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    position: 'relative',
  },
  levelCardSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  levelIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelIconSelected: {
    backgroundColor: '#4F46E5',
  },
  levelNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748B',
  },
  levelNumberSelected: {
    color: '#FFFFFF',
  },
  levelTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
    textAlign: 'center',
  },
  levelTitleSelected: {
    color: '#4F46E5',
  },
  levelDescription: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 14,
  },
  levelDescriptionSelected: {
    color: '#6366F1',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  coursesSection: {
    marginBottom: 24,
  },
  coursesScrollView: {
    maxHeight: 200,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    padding: 12,
  },
  levelGroup: {
    marginBottom: 16,
  },
  levelGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  coursesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: '30%',
    position: 'relative',
  },
  courseCardSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  courseCode: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  courseCodeSelected: {
    color: '#4F46E5',
  },
  courseName: {
    fontSize: 9,
    color: '#64748B',
    lineHeight: 12,
  },
  courseNameSelected: {
    color: '#6366F1',
  },
  courseCheckmark: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
}); 