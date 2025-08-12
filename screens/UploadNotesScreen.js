import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function UploadNotesScreen() {
  const { csModules, user } = useApp();
  const [selectedCourse, setSelectedCourse] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(1);

  // Get modules based on user type
  const getAvailableModules = () => {
    if (user?.userType === 'lecturer') {
      // For lecturers, show all courses they teach
      const teachingCourses = user.teachingCourses || [];
      const courseDetails = [];
      Object.values(csModules).flat().forEach(course => {
        if (teachingCourses.includes(course.id)) {
          courseDetails.push(course);
        }
      });
      return courseDetails;
    } else {
      // For students, show their level modules
      return user?.academicLevel ? csModules[user.academicLevel] || [] : [];
    }
  };

  const currentLevelModules = getAvailableModules();
  
  // Group modules by semester
  const semester1Modules = currentLevelModules.filter(module => module.semester === 1);
  const semester2Modules = currentLevelModules.filter(module => module.semester === 2);
  
  const displayModules = user?.userType === 'lecturer' 
    ? currentLevelModules 
    : (selectedSemester === 1 ? semester1Modules : semester2Modules);

  const handleFileSelection = () => {
    // Simulate file selection
    Alert.alert(
      'Select File Type',
      'Choose the type of file you want to upload',
      [
        { text: 'PDF Document', onPress: () => selectFile('PDF') },
        { text: 'Word Document', onPress: () => selectFile('DOCX') },
        { text: 'PowerPoint', onPress: () => selectFile('PPTX') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const selectFile = (fileType) => {
    setSelectedFile({
      name: `sample-notes.${fileType.toLowerCase()}`,
      type: fileType,
      size: '2.4 MB',
    });
  };

  const handleUpload = () => {
    if (!selectedCourse || !title || !selectedFile) {
      Alert.alert('Error', 'Please fill in all required fields and select a file');
      return;
    }

    // Different messages for lecturers vs students
    const successTitle = user?.userType === 'lecturer' ? 'Material Uploaded! 📚' : 'Upload Successful! 📝';
    const successMessage = user?.userType === 'lecturer' 
      ? `Course material "${title}" has been uploaded for ${selectedCourse}.\n\nStudents will be notified automatically.`
      : `Your notes "${title}" have been uploaded successfully!\n\nOther students can now access your shared notes.`;

    Alert.alert(
      successTitle,
      successMessage,
      [
        {
          text: 'Great!',
          onPress: () => {
            setSelectedCourse('');
            setTitle('');
            setDescription('');
            setSelectedFile(null);
          },
        },
      ]
    );
  };

  const renderCourseOption = (course) => (
    <TouchableOpacity
      key={course.id}
      style={[
        styles.courseOption,
        selectedCourse === course.code && styles.selectedCourseOption,
      ]}
      onPress={() => setSelectedCourse(course.code)}
    >
      <View style={styles.courseOptionContent}>
        <View style={styles.courseHeader}>
          <Text style={[
            styles.courseOptionName,
            selectedCourse === course.code && styles.selectedCourseText,
          ]}>
            {course.name}
          </Text>
          {selectedCourse === course.code && (
            <Ionicons name="checkmark-circle" size={20} color="#4F46E5" />
          )}
        </View>
        <View style={styles.courseDetails}>
          <Text style={[
            styles.courseOptionCode,
            selectedCourse === course.code && styles.selectedCourseSubText,
          ]}>
            {course.code}
          </Text>
          <Text style={[
            styles.courseCredits,
            selectedCourse === course.code && styles.selectedCourseSubText,
          ]}>
            {course.credits} Credits
          </Text>
        </View>
        <Text style={[
          styles.courseInstructor,
          selectedCourse === course.code && styles.selectedCourseSubText,
        ]}>
          {course.instructor}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {user?.userType === 'lecturer' ? 'Course Materials' : 'Upload Notes'}
          </Text>
          <Text style={styles.subtitle}>
            {user?.userType === 'lecturer' 
              ? 'Upload materials for your students to access'
              : `Share your ${user?.academicLevel ? `Level ${user.academicLevel}` : 'course'} study materials with classmates`
            }
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Course *</Text>
            
            {/* Semester Selector - Only for students */}
            {user?.userType !== 'lecturer' && (
              <View style={styles.semesterSelector}>
                <TouchableOpacity
                  style={[styles.semesterTab, selectedSemester === 1 && styles.activeSemesterTab]}
                  onPress={() => setSelectedSemester(1)}
                >
                  <Text style={[styles.semesterTabText, selectedSemester === 1 && styles.activeSemesterText]}>
                    Semester 1
                  </Text>
                  <Text style={[styles.semesterCount, selectedSemester === 1 && styles.activeSemesterCount]}>
                    {semester1Modules.length} modules
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.semesterTab, selectedSemester === 2 && styles.activeSemesterTab]}
                  onPress={() => setSelectedSemester(2)}
                >
                  <Text style={[styles.semesterTabText, selectedSemester === 2 && styles.activeSemesterText]}>
                    Semester 2
                  </Text>
                  <Text style={[styles.semesterCount, selectedSemester === 2 && styles.activeSemesterCount]}>
                    {semester2Modules.length} modules
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Course Level Organization for Lecturers */}
            {user?.userType === 'lecturer' && (
              <View style={styles.lecturerCoursesHeader}>
                <Text style={styles.lecturerCoursesTitle}>Your Teaching Courses</Text>
                <Text style={styles.lecturerCoursesSubtitle}>
                  {currentLevelModules.length} courses across multiple levels
                </Text>
              </View>
            )}
            
            <View style={styles.courseList}>
              {displayModules.map(renderCourseOption)}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {user?.userType === 'lecturer' ? 'Material Title *' : 'Note Title *'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={user?.userType === 'lecturer' 
                ? "e.g., Lecture 5: Introduction to Linked Lists"
                : "e.g., Chapter 5 - Data Structures Summary"
              }
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={user?.userType === 'lecturer'
                ? "Add a brief description of the material content..."
                : "Add a brief description of your notes..."
              }
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {user?.userType === 'lecturer' ? 'Upload Material *' : 'Upload File *'}
            </Text>
            <TouchableOpacity style={styles.fileUpload} onPress={handleFileSelection}>
              <View style={styles.fileUploadContent}>
                <Ionicons
                  name={selectedFile ? 'document' : (user?.userType === 'lecturer' ? 'folder-outline' : 'cloud-upload-outline')}
                  size={32}
                  color={selectedFile ? '#4F46E5' : '#94A3B8'}
                />
                <Text style={styles.fileUploadText}>
                  {selectedFile ? selectedFile.name : 'Tap to select file'}
                </Text>
                {selectedFile && (
                  <Text style={styles.fileDetails}>
                    {selectedFile.type} • {selectedFile.size}
                  </Text>
                )}
                {!selectedFile && (
                  <Text style={styles.fileUploadSubtext}>
                    {user?.userType === 'lecturer' 
                      ? 'Supports PDF, DOCX, PPTX, videos, and images'
                      : 'Supports PDF, DOCX, PPTX files'
                    }
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {selectedFile && (
            <TouchableOpacity
              style={styles.removeFileButton}
              onPress={() => setSelectedFile(null)}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={styles.removeFileText}>Remove File</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.uploadButton,
            (!selectedCourse || !title || !selectedFile) && styles.disabledButton,
          ]}
          onPress={handleUpload}
          disabled={!selectedCourse || !title || !selectedFile}
        >
          <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
          <Text style={styles.uploadButtonText}>
            {user?.userType === 'lecturer' ? 'Upload Material' : 'Upload Notes'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 22,
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  semesterSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  semesterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  activeSemesterTab: {
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  semesterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  activeSemesterText: {
    color: '#FFFFFF',
  },
  semesterCount: {
    fontSize: 12,
    color: '#94A3B8',
  },
  activeSemesterCount: {
                color: '#C7D2FE',
  },
  lecturerCoursesHeader: {
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
  },
  lecturerCoursesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 4,
  },
  lecturerCoursesSubtitle: {
    fontSize: 13,
    color: '#6366F1',
  },
  courseList: {
    gap: 12,
  },
  courseOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedCourseOption: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOpacity: 0.2,
  },
  courseOptionContent: {
    flex: 1,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  courseOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 20,
    flex: 1,
    marginRight: 8,
  },
  courseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  courseOptionCode: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4F46E5',
  },
  courseCredits: {
    fontSize: 14,
    color: '#64748B',
  },
  courseInstructor: {
    fontSize: 13,
    color: '#94A3B8',
  },
  selectedCourseText: {
    color: '#4F46E5',
  },
  selectedCourseSubText: {
    color: '#6366F1',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  textArea: {
    height: 120,
    paddingTop: 18,
    textAlignVertical: 'top',
  },
  fileUpload: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  fileUploadContent: {
    alignItems: 'center',
  },
  fileUploadText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    marginTop: 12,
    textAlign: 'center',
  },
  fileDetails: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  fileUploadSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
  removeFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  removeFileText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  uploadButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
