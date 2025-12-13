import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth, storage } from '../firebaseConfig';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, getDownloadURL, listAll } from 'firebase/storage';
import { useFocusEffect } from '@react-navigation/native';
import MapView, { Marker, Polyline } from 'react-native-maps';

// 대중교통별 색상 매핑
const transportColors = {
  1: '#54D7C0', // 도보
  2: '#2A7F62', // 자전거
  3: '#F3C623', // 자동차
  4: '#E65C9C', // 버스
  5: '#794BC4', // 지하철
  6: '#63C7FF', // 기차
  7: '#E63946', // 비행기
  8: '#D9C5A0', // 배
};

const transportNames = {
  1: '도보',
  2: '자전거',
  3: '자동차',
  4: '버스',
  5: '지하철',
  6: '기차',
  7: '비행기',
  8: '배',
};

export default function DiaryDetailScreen({ route, navigation }) {
  const { diaryId } = route.params;
  const [entries, setEntries] = useState([]);
  const [travelInfo, setTravelInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  useEffect(() => {
    loadDiaryDetails();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadDiaryDetails();
    }, [])
  );

  const loadDiaryDetails = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        setLoading(false);
        return;
      }

      // 1. 여행 일정 정보 가져오기
      const travelRef = doc(db, 'travelDiaries', diaryId);
      const travelSnap = await getDocs(query(collection(db, 'travelDiaries'), where('__name__', '==', diaryId)));
      
      if (!travelSnap.empty) {
        setTravelInfo({
          id: travelSnap.docs[0].id,
          ...travelSnap.docs[0].data()
        });
      }

      // 2. 이 여행의 모든 일기 가져오기 (서브컬렉션)
      const entriesRef = collection(db, 'travelDiaries', diaryId, 'entries');
      const entriesSnap = await getDocs(entriesRef);
      
      const entriesData = await Promise.all(
        entriesSnap.docs.map(async (entryDoc) => {
          const images = await getDiaryImages(diaryId, entryDoc.id);
          return {
            id: entryDoc.id,
            ...entryDoc.data(),
            images: images,
            order: entryDoc.data().order || 0
          };
        })
      );
      
      // order 순으로 정렬
      entriesData.sort((a, b) => (a.order || 0) - (b.order || 0));
      setEntries(entriesData);
    } catch (error) {
      console.error('일기 상세 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDiaryImages = async (travelId, entryId) => {
    try {
      const imageRef = ref(storage, `diaries/${travelId}/${entryId}`);
      const fileList = await listAll(imageRef);
      
      const urls = await Promise.all(
        fileList.items.map(async (item) => {
          const url = await getDownloadURL(item);
          return url;
        })
      );
      
      return urls;
    } catch (error) {
      return [];
    }
  };

  const handleDeleteEntry = (entryId, title) => {
    Alert.alert(
      '일기 삭제',
      `"${title}" 일기를 삭제하시겠습니까?`,
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
              await deleteDoc(doc(db, 'travelDiaries', diaryId, 'entries', entryId));
              Alert.alert('성공', '일기가 삭제되었습니다');
              loadDiaryDetails();
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

  const showEntryOptions = (entry, index) => {
    Alert.alert(
      entry.title || '제목 없음',
      '어떤 작업을 하시겠습니까?',
      [
        {
          text: '취소',
          onPress: () => {},
          style: 'cancel'
        },
        {
          text: '수정',
          onPress: () => navigation.navigate('writediary', { 
            diaryId: diaryId,
            entryId: entry.id, 
            entry: entry 
          })
        },
        {
          text: '삭제',
          onPress: () => handleDeleteEntry(entry.id, entry.title),
          style: 'destructive'
        }
      ]
    );
  };

  const moveEntryUp = async (index) => {
    if (index === 0) return;
    
    const newEntries = [...entries];
    const temp = newEntries[index];
    newEntries[index] = newEntries[index - 1];
    newEntries[index - 1] = temp;

    // order 업데이트
    try {
      await updateDoc(doc(db, 'travelDiaries', diaryId, 'entries', newEntries[index].id), {
        order: index
      });
      await updateDoc(doc(db, 'travelDiaries', diaryId, 'entries', newEntries[index - 1].id), {
        order: index - 1
      });
      setEntries(newEntries);
    } catch (error) {
      console.error('순서 변경 오류:', error);
      Alert.alert('오류', '순서 변경에 실패했습니다');
    }
  };

  const moveEntryDown = async (index) => {
    if (index === entries.length - 1) return;
    
    const newEntries = [...entries];
    const temp = newEntries[index];
    newEntries[index] = newEntries[index + 1];
    newEntries[index + 1] = temp;

    // order 업데이트
    try {
      await updateDoc(doc(db, 'travelDiaries', diaryId, 'entries', newEntries[index].id), {
        order: index
      });
      await updateDoc(doc(db, 'travelDiaries', diaryId, 'entries', newEntries[index + 1].id), {
        order: index + 1
      });
      setEntries(newEntries);
    } catch (error) {
      console.error('순서 변경 오류:', error);
      Alert.alert('오류', '순서 변경에 실패했습니다');
    }
  };

  // 마커 좌표 배열 생성
  const getMarkerCoordinates = () => {
    return entries
      .filter(entry => entry.latitude && entry.longitude)
      .map((entry, index) => ({
        latitude: entry.latitude,
        longitude: entry.longitude,
        title: entry.title,
        id: entry.id,
        transport: entry.transport,
        order: index
      }));
  };

  // 초기 지도 영역 계산
  const getInitialRegion = () => {
    const markers = getMarkerCoordinates();
    if (markers.length === 0) {
      return {
        latitude: 37.5665,
        longitude: 126.9780,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    const latitudes = markers.map(m => m.latitude);
    const longitudes = markers.map(m => m.longitude);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: (maxLat - minLat) * 1.5,
      longitudeDelta: (maxLng - minLng) * 1.5,
    };
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#42b1fa" />
      </View>
    );
  }

  const markers = getMarkerCoordinates();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{travelInfo?.title || '여행일기'}</Text>
        <View style={styles.headerRightButtons}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowMapModal(true)}
          >
            <Ionicons name="map" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setIsEditMode(!isEditMode)}
          >
            <Ionicons name={isEditMode ? "checkmark" : "menu"} size={28} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {travelInfo && (
        <View style={styles.travelInfo}>
          <Text style={styles.travelInfoText}>📍 {travelInfo.location}</Text>
          <Text style={styles.travelInfoText}>📅 {travelInfo.startDate} ~ {travelInfo.endDate}</Text>
        </View>
      )}

      {entries.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>작성한 일기가 없습니다</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('writediary', { diaryId: diaryId })}
          >
            <Text style={styles.buttonText}>첫 일기 작성하기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={entries}
            keyExtractor={item => item.id}
            renderItem={({ item, index }) => (
              <View style={styles.entryCardContainer}>
                <TouchableOpacity 
                  style={styles.entryCard}
                  onPress={() => !isEditMode && navigation.navigate('writediary', { diaryId: diaryId, entryId: item.id, entry: item })}
                  onLongPress={() => !isEditMode && showEntryOptions(item, index)}
                  delayLongPress={500}
                >
                  {item.images && item.images.length > 0 && (
                    <Image
                      source={{ uri: item.images[0] }}
                      style={styles.entryImage}
                    />
                  )}
                  {(!item.images || item.images.length === 0) && (
                    <View style={[styles.entryImage, { backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' }]}>
                      <Ionicons name="image" size={40} color="#999" />
                    </View>
                  )}
                  <View style={styles.entryContent}>
                    <Text style={styles.entryTitle}>{item.title || '제목 없음'}</Text>
                    <Text style={styles.entryLocation}>{item.location || '장소 미정'}</Text>
                    {item.date && (
                      <Text style={styles.entryDate}>
                        {item.date.toDate ? new Date(item.date.toDate()).toLocaleDateString() : new Date(item.date).toLocaleDateString()}
                      </Text>
                    )}
                    <Text style={styles.entryDescription} numberOfLines={2}>{item.description || ''}</Text>
                  </View>
                </TouchableOpacity>

                {/* 편집 모드 - 위아래 이동 버튼 */}
                {isEditMode && (
                  <View style={styles.editButtonsContainer}>
                    <TouchableOpacity 
                      style={[styles.editButton, index === 0 && styles.disabledButton]}
                      onPress={() => moveEntryUp(index)}
                      disabled={index === 0}
                    >
                      <Ionicons 
                        name="chevron-up" 
                        size={24} 
                        color={index === 0 ? '#ccc' : '#42b1fa'} 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.editButton, index === entries.length - 1 && styles.disabledButton]}
                      onPress={() => moveEntryDown(index)}
                      disabled={index === entries.length - 1}
                    >
                      <Ionicons 
                        name="chevron-down" 
                        size={24} 
                        color={index === entries.length - 1 ? '#ccc' : '#42b1fa'} 
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          />
          
          {/* 플로팅 일기 작성 버튼 (타원형) */}
          {!isEditMode && (
            <TouchableOpacity 
              style={styles.fab}
              onPress={() => navigation.navigate('writediary', { diaryId: diaryId })}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={32} color="white" />
            </TouchableOpacity>
          )}
        </>
      )}

      {/* 지도 모달 */}
      <Modal
        visible={showMapModal}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowMapModal(false)}
      >
        <View style={styles.mapModalContainer}>
          <View style={styles.mapHeader}>
            <TouchableOpacity onPress={() => setShowMapModal(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.mapHeaderTitle}>여행 경로</Text>
            <View style={{ width: 28 }} />
          </View>

          <MapView
            style={styles.map}
            initialRegion={getInitialRegion()}
          >
            {/* 마커 표시 */}
            {markers.map((marker, index) => (
              <Marker
                key={marker.id}
                coordinate={{
                  latitude: marker.latitude,
                  longitude: marker.longitude,
                }}
                title={marker.title}
                pinColor={index === 0 ? '#4DA8DA' : index === markers.length - 1 ? '#FF8F5C' : '#cccccc'}
              />
            ))}

            {/* 대중교통별 경로 선 연결 */}
            {markers.length > 1 && markers.map((marker, index) => {
              if (index === markers.length - 1) return null; // 마지막 마커는 선 없음
              
              const nextMarker = markers[index + 1];
              const transportId = nextMarker.transport || 1; // 다음 목적지까지의 교통수단
              const color = transportColors[transportId] || '#42b1fa';

              return (
                <Polyline
                  key={`line-${index}`}
                  coordinates={[
                    {
                      latitude: marker.latitude,
                      longitude: marker.longitude,
                    },
                    {
                      latitude: nextMarker.latitude,
                      longitude: nextMarker.longitude,
                    }
                  ]}
                  strokeColor={color}
                  strokeWidth={3}
                />
              );
            })}
          </MapView>

          {/* 범례 */}
          <View style={styles.legendContainer}>
            <View style={styles.legendSection}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#00ff00' }]} />
                <Text style={styles.legendText}>시작</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#ff0000' }]} />
                <Text style={styles.legendText}>종료</Text>
              </View>
            </View>

            <View style={styles.transportLegend}>
              <Text style={styles.transportLegendTitle}>교통수단별 경로색</Text>
              <View style={styles.transportGrid}>
                {Object.entries(transportColors).map(([id, color]) => (
                  <View key={id} style={styles.transportLegendItem}>
                    <View style={[styles.legendColor, { backgroundColor: color }]} />
                    <Text style={styles.legendText}>{transportNames[id]}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 30,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  travelInfo: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  travelInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  entryCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 5,
  },
  entryCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    flexDirection: 'row',
  },
  entryImage: {
    width: 100,
    height: 100,
    backgroundColor: '#e0e0e0',
  },
  entryContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  entryLocation: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  entryDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  entryDescription: {
    fontSize: 13,
    color: '#666',
  },
  editButtonsContainer: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'white',
    marginVertical: 4,
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#42b1fa',
    padding: 12,
    borderRadius: 8,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 70,
    right: 30,
    width: 70,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#42b1fa',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 30,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  mapHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  map: {
    flex: 1,
  },
  legendContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 15,
  },
  legendSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 13,
    color: '#666',
  },
  transportLegend: {
    marginTop: 10,
  },
  transportLegendTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  transportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  transportLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%',
  },
});