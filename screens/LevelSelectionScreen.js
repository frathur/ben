import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

const academicLevels = [
  {
    id: '100',
    level: '100 Level',
    description: 'First Year - Foundation Courses',
    icon: 'school-outline',
    color: '#10B981',
  },
  {
    id: '200',
    level: '200 Level', 
    description: 'Second Year - Core Fundamentals',
    icon: 'code-slash-outline',
    color: '#3B82F6',
  },
  {
    id: '300',
    level: '300 Level',
    description: 'Third Year - Advanced Topics', 
    icon: 'hardware-chip-outline',
    color: '#8B5CF6',
  },
  {
    id: '400',
    level: '400 Level',
    description: 'Final Year - Specialization',
    icon: 'trophy-outline',
    color: '#F59E0B',
  },
];

export default function LevelSelectionScreen() {
  const [selectedLevel, setSelectedLevel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, setUser } = useApp();
  
  // Safety check - if user is null, show loading
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleContinue = async () => {
    if (!selectedLevel) {
      Alert.alert('Level Required', 'Please select your current academic level to continue');
      return;
    }

    setIsLoading(true);

    try {
      // Update user with selected level locally
      const levelInfo = academicLevels.find(l => l.id === selectedLevel);
      const updatedUser = {
        ...user,
        academicLevel: selectedLevel,
        levelDescription: levelInfo?.description || '',
      };
      
      setUser(updatedUser);

      // TODO: Save to Firebase/Firestore
      // When you have Firestore configured, uncomment this:
      // import { doc, updateDoc } from 'firebase/firestore';
      // import { db } from '../config/firebaseConfig';
      // await updateDoc(doc(db, 'users', user.uid), {
      //   academicLevel: selectedLevel,
      //   levelDescription: levelInfo?.description
      // });
      
      // Show success message and navigate automatically
      setTimeout(() => {
        setIsLoading(false);
        Alert.alert(
          '🎉 Welcome to UniConnect!',
          `You're all set! Explore your ${levelInfo?.level} modules and connect with classmates.`,
          [{ text: 'Get Started', style: 'default' }]
        );
      }, 1000);
      
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', 'Failed to save your level. Please try again.');
    }
  };

  const renderLevelCard = (levelData) => {
    const isSelected = selectedLevel === levelData.id;
    
    return (
      <TouchableOpacity
        key={levelData.id}
        style={[
          styles.levelCard, 
          isSelected && styles.selectedLevelCard,
          { borderColor: isSelected ? levelData.color : '#E2E8F0' }
        ]}
        onPress={() => setSelectedLevel(levelData.id)}
        activeOpacity={0.7}
      >
        <View style={styles.levelHeader}>
          <View style={[styles.levelIcon, { backgroundColor: levelData.color }]}>
            <Ionicons name={levelData.icon} size={28} color="#FFFFFF" />
          </View>
          <View style={styles.checkboxContainer}>
            <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
              {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </View>
          </View>
        </View>
        
        <Text style={[styles.levelTitle, isSelected && styles.selectedLevelTitle]}>
          {levelData.level}
        </Text>
        
        <Text style={[styles.levelDescription, isSelected && styles.selectedLevelDescription]}>
          {levelData.description}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="graduation-cap" size={60} color="#4F46E5" />
        <Text style={styles.welcomeText}>Welcome to UniConnect! 🎉</Text>
        <Text style={styles.title}>Select Your Academic Level</Text>
        <Text style={styles.subtitle}>
          Choose your current level in Computer Science to get started with relevant modules and connect with classmates
        </Text>
      </View>

      <ScrollView 
        style={styles.levelsContainer}
        contentContainerStyle={styles.levelsContent}
        showsVerticalScrollIndicator={false}
      >
        {academicLevels.map(renderLevelCard)}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton, 
            (!selectedLevel || isLoading) && styles.buttonDisabled
          ]}
          onPress={handleContinue}
          disabled={!selectedLevel || isLoading}
        >
          <Text style={[
            styles.continueButtonText,
            (!selectedLevel || isLoading) && styles.buttonDisabledText
          ]}>
            {isLoading ? 'Saving...' : selectedLevel ? 'Continue to Dashboard' : 'Select a Level to Continue'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.infoText}>
          You can update your level later in your profile settings
        </Text>
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
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginTop: 16,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  levelsContainer: {
    flex: 1,
  },
  levelsContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  levelCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  selectedLevelCard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 2,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxContainer: {
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  selectedLevelTitle: {
    color: '#4F46E5',
  },
  levelDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  selectedLevelDescription: {
    color: '#1E40AF',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  continueButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  buttonDisabledText: {
    color: '#94A3B8',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 