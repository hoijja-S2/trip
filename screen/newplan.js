import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../firebaseConfig';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';

export default function NewPlanScreen({ route, navigation }) {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  // 수정 모드 여부
  const isEditMode = route.params?.isEditMode || false;
  const diaryId = route.params?.diaryId;
  const diary = route.params?.diary;

  // 수정 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (isEditMode && diary) {
      setTitle(diary.title || '');
      setStartDate(diary.startDate || '');
      setEndDate(diary.endDate || '');
    }
  }, [isEditMode, diary]);

  const handleSaveTravel = async () => {
    if (!title.trim() || !startDate.trim() || !endDate.trim()) {
      Alert.alert('입력 오류', '모든 항목을 입력해주세요');
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      Alert.alert('날짜 형식 오류', '날짜를 YYYY-MM-DD 형식으로 입력해주세요');
      return;
    }

    setLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('오류', '사용자 정보를 찾을 수 없습니다');
        return;
      }

      if (isEditMode) {
        // 수정 모드
        await updateDoc(doc(db, 'travelDiaries', diaryId), {
          title: title.trim(),
          startDate: startDate,
          endDate: endDate,
        });

        Alert.alert('성공', '여행 일정이 수정되었습니다', [
          {
            text: '확인',
            onPress: () => navigation.goBack()
          }
        ]);
      } else {
        // 새로 작성 모드
        const newTravel = {
          userId: userId,
          title: title.trim(),
          location: '',
          startDate: startDate,
          endDate: endDate,
          entries: 0,
          createdAt: new Date()
        };

        await addDoc(collection(db, 'travelDiaries'), newTravel);
        
        Alert.alert('성공', '새로운 여행 일정이 추가되었습니다', [
          {
            text: '확인',
            onPress: () => navigation.goBack()
          }
        ]);
      }
    } catch (error) {
      console.error('저장 오류:', error);
      Alert.alert('오류', '저장에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? '여행 일정 수정' : '새로운 여행 일정'}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.label}>여행 제목</Text>
          <TextInput
            style={styles.input}
            placeholder="예: 서울 3일 여행"
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
            editable={!loading}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>시작 날짜</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD (예: 2024-01-15)"
            placeholderTextColor="#999"
            value={startDate}
            onChangeText={setStartDate}
            editable={!loading}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>종료 날짜</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD (예: 2024-01-20)"
            placeholderTextColor="#999"
            value={endDate}
            onChangeText={setEndDate}
            editable={!loading}
          />
        </View>

        <TouchableOpacity 
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleSaveTravel}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.createButtonText}>
              {isEditMode ? '수정 완료' : '여행 일정 추가'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>취소</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 15,
    marginTop: 30,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
  },
  createButton: {
    backgroundColor: '#42b1fa',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 12,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'white',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
});