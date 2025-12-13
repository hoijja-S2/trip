import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth, storage } from '../firebaseConfig';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { useFocusEffect } from '@react-navigation/native';

export default function DiaryListScreen({ navigation }) {
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDiaries();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadDiaries();
    }, [])
  );

  const loadDiaries = async () => {
    setLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        setLoading(false);
        return;
      }

      // travelDiaries 컬렉션에서 현재 사용자의 여행일기 가져오기
      const q = query(collection(db, 'travelDiaries'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      
      const diariesData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          // 각 diary의 entries 개수를 실시간으로 계산
          const entriesRef = collection(db, 'travelDiaries', doc.id, 'entries');
          const entriesSnapshot = await getDocs(entriesRef);
          
          return {
            id: doc.id,
            ...doc.data(),
            entriesCount: entriesSnapshot.docs.length
          };
        })
      );

      setDiaries(diariesData);
    } catch (error) {
      console.error('여행일기 로드 오류:', error);
      Alert.alert('오류', '여행일기를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTravel = (diaryId, title) => {
    Alert.alert(
      '여행 일정 삭제',
      `"${title}" 일정을 삭제하시겠습니까?`,
      [
        {
          text: '취소',
          onPress: () => {},
          style: 'cancel'
        },
        {
          text: '삭제',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'travelDiaries', diaryId));
              Alert.alert('성공', '여행 일정이 삭제되었습니다');
              loadDiaries();
            } catch (error) {
              console.error('삭제 오류:', error);
              Alert.alert('오류', '삭제에 실패했습니다');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const showCardOptions = (diary) => {
    Alert.alert(
      diary.title || '제목 없음',
      '어떤 작업을 하시겠습니까?',
      [
        {
          text: '취소',
          onPress: () => {},
          style: 'cancel'
        },
        {
          text: '수정',
          onPress: () => navigation.navigate('newplan', { 
            isEditMode: true,
            diaryId: diary.id, 
            diary: diary 
          })
        },
        {
          text: '삭제',
          onPress: () => handleDeleteTravel(diary.id, diary.title),
          style: 'destructive'
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#42b1fa" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>나의 여행일기</Text>
        <TouchableOpacity onPress={() => navigation.navigate('newplan')}>
          <Ionicons style={styles.circle} name="add-circle" size={32} color="#42b1fa" />
        </TouchableOpacity>
      </View>

      {diaries.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>아직 작성한 여행일기가 없어요</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('newplan')}
          >
            <Text style={styles.buttonText}>첫 여행 일정 추가하기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={diaries}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card}
              onPress={() => navigation.navigate('diarydetail', { diaryId: item.id })}
              onLongPress={() => showCardOptions(item)}
            >
              {item.thumbnailUrl && (
                <Image
                  source={{ uri: item.thumbnailUrl }}
                  style={styles.thumbnail}
                  onError={() => console.log('이미지 로드 실패')}
                />
              )}
              {!item.thumbnailUrl && (
                <View style={[styles.thumbnail, { backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="images" size={40} color="#999" />
                </View>
              )}
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title || '제목 없음'}</Text>
                <Text style={styles.cardText} numberOfLines={1}>{item.location || '장소 미정'}</Text>
                <Text style={styles.cardText}>{item.entriesCount}개의 일기</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 27,
  },
  card: {
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    flexDirection: 'row',
  },
  thumbnail: {
    width: 100,
    height: 100,
    backgroundColor: '#e0e0e0',
  },
  cardContent: {
    flex: 1,
    padding: 15,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#42b1fa',
    padding: 15,
    borderRadius: 10,
  },
  circle: {
    marginTop: 32,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});