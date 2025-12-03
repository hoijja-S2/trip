import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth, storage } from '../firebaseConfig';
import { collection, query, where, getDocs, collectionGroup } from 'firebase/firestore';
import { ref, listAll, getBytes } from 'firebase/storage';

export default function DiaryListScreen({ navigation, useFocusEffect }) {
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDiaries();
  }, []);

  const loadDiaries = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        setLoading(false);
        return;
      }

      // travelDiaries 컬렉션에서 현재 사용자의 여행일기 가져오기
      const q = query(collection(db, 'travelDiaries'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      
      const diariesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 각 여행일기의 첫 번째 사진 가져오기
      const diariesWithImages = await Promise.all(
        diariesData.map(async (diary) => {
          const imageUrl = await getFirstDiaryImage(diary.id);
          return {
            ...diary,
            imageUrl: imageUrl
          };
        })
      );
      
      setDiaries(diariesWithImages);
    } catch (error) {
      console.error('여행일기 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 여행일기의 첫 번째 사진 URL 가져오기
  const getFirstDiaryImage = async (diaryId) => {
    try {
      // Storage에서 해당 여행일기의 폴더 경로
      const diaryFolderRef = ref(storage, `diaries/${diaryId}`);
      
      // 폴더의 모든 파일 나열
      const fileList = await listAll(diaryFolderRef);
      
      if (fileList.items.length > 0) {
        // 첫 번째 파일의 URL 생성
        const firstFile = fileList.items[0];
        return firstFile.fullPath;
      }
      return null;
    } catch (error) {
      console.error('이미지 로드 오류:', error);
      return null;
    }
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
        <TouchableOpacity onPress={() => navigation.navigate('writediary')}>
          <Ionicons style={styles.circle} name="add-circle" size={32} color="#42b1fa" />
        </TouchableOpacity>
      </View>

      {diaries.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>아직 작성한 여행일기가 없어요</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('writediary')}
          >
            <Text style={styles.buttonText}>첫 여행일기 작성하기</Text>
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
            >
              {item.imageUrl && (
                <Image
                  source={{ uri: `https://firebasestorage.googleapis.com/v0/b/tripapp-8fc99.appspot.com/o/${encodeURIComponent(item.imageUrl)}?alt=media` }}
                  style={styles.thumbnail}
                />
              )}
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title || '제목 없음'}</Text>
                <Text style={styles.cardText}>{item.location || '장소 미정'}</Text>
                <Text style={styles.cardText}>{item.entries || 0}개의 일기</Text>
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
  circle:{
    marginTop: 32,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});