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
  const { selectedCourses } = useApp();
  const [selectedCourse, setSelectedCourse] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

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

    // Simulate upload process
    Alert.alert(
      'Upload Successful',
      'Your notes have been uploaded successfully!',
      [
        {
          text: 'OK',
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
        <Text style={[
          styles.courseOptionName,
          selectedCourse === course.code && styles.selectedCourseText,
        ]}>
          {course.name}
        </Text>
        <Text style={[
          styles.courseOptionCode,
          selectedCourse === course.code && styles.selectedCourseSubText,
        ]}>
          {course.code}
        </Text>
      </View>
      {selectedCourse === course.code && (
        <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Upload Notes</Text>
          <Text style={styles.subtitle}>Share your study materials with classmates</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Course *</Text>
            <View style={styles.courseList}>
              {selectedCourses.map(renderCourseOption)}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Note Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Chapter 5 - Data Structures Summary"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add a brief description of your notes..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upload File *</Text>
            <TouchableOpacity style={styles.fileUpload} onPress={handleFileSelection}>
              <View style={styles.fileUploadContent}>
                <Ionicons
                  name={selectedFile ? 'document' : 'cloud-upload-outline'}
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
                    Supports PDF, DOCX, PPTX files
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
          <Text style={styles.uploadButtonText}>Upload Notes</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  form: {
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  courseList: {
    gap: 8,
  },
  courseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCourseOption: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  courseOptionContent: {
    flex: 1,
  },
  courseOptionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 4,
  },
  courseOptionCode: {
    fontSize: 14,
    color: '#64748B',
  },
  selectedCourseText: {
    color: '#4F46E5',
  },
  selectedCourseSubText: {
    color: '#6366F1',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textArea: {
    height: 100,
    paddingTop: 16,
  },
  fileUpload: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    padding: 32,
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
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  uploadButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
