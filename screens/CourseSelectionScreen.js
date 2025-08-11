import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function CourseSelectionScreen({ onCoursesSelected }) {
  const { availableCourses, setSelectedCourses } = useApp();
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);

  const toggleCourse = (courseId) => {
    setSelectedCourseIds(prev => 
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleContinue = () => {
    if (selectedCourseIds.length === 0) {
      alert('Please select at least one course');
      return;
    }
    
    const selected = availableCourses.filter(course => 
      selectedCourseIds.includes(course.id)
    );
    setSelectedCourses(selected);
    onCoursesSelected();
  };

  const renderCourse = ({ item }) => {
    const isSelected = selectedCourseIds.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.courseCard, isSelected && styles.selectedCourse]}
        onPress={() => toggleCourse(item.id)}
      >
        <View style={styles.courseInfo}>
          <Text style={[styles.courseName, isSelected && styles.selectedText]}>
            {item.name}
          </Text>
          <Text style={[styles.courseCode, isSelected && styles.selectedSubText]}>
            {item.code} • {item.instructor}
          </Text>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
          {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Your Courses</Text>
        <Text style={styles.subtitle}>
          Choose the courses you're enrolled in this semester
        </Text>
      </View>

      <FlatList
        data={availableCourses}
        renderItem={renderCourse}
        keyExtractor={(item) => item.id}
        style={styles.courseList}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <Text style={styles.selectedCount}>
          {selectedCourseIds.length} course{selectedCourseIds.length !== 1 ? 's' : ''} selected
        </Text>
        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedCourseIds.length === 0 && styles.disabledButton
          ]}
          onPress={handleContinue}
          disabled={selectedCourseIds.length === 0}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
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
    lineHeight: 22,
  },
  courseList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCourse: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  courseCode: {
    fontSize: 14,
    color: '#64748B',
  },
  selectedText: {
    color: '#4F46E5',
  },
  selectedSubText: {
    color: '#6366F1',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  selectedCount: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  continueButton: {
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
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
