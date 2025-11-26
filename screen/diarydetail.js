// React 기본 기능
import React, { useState, useEffect } from 'react';
// React Native 컴포넌트들
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
// 지도 컴포넌트
import MapView, { Marker, Polyline } from 'react-native-maps';
// Firebase
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

// 교통수단별 선 색깔 정의
const TRANSPORT_COLORS = {
  1: '#4CAF50',  // 도보 - 초록
  2: '#2196F3',  // 자전거 - 파랑
  3: '#FF5722',  // 자동차 - 빨강
  4: '#FFC107',  // 버스 - 노랑
  5: '#9C27B0',  // 지하철 - 보라
  6: '#FF9800',  // 기차 - 주황
  7: '#00BCD4',  // 비행기 - 하늘색
  8: '#607D8B',  // 배 - 회색
};

// 여행일기 상세 화면 컴포넌트
export default function DiaryDetailScreen({ route }) {
  // 이전 화면에서 전달받은 여행일기 ID
  const { diaryId } = route.params;
  
  // 일기 항목들을 저장하는 상태
  const [entries, setEntries] = useState([]);
  // 로딩 상태
  const [loading, setLoading] = useState(true);
  
  // 화면이 처음 렌더링될 때 데이터 불러오기
  useEffect(() => {
    loadEntries();
  }, []);
  
  // Firebase에서 일기 항목들 불러오기
  const loadEntries = async () => {
    try {
      // 해당 여행일기의 모든 일기 항목 가져오기
      const q = query(
        collection(db, 'diaryEntries'), // 'diaryEntries' 컬렉션
        where('diaryId', '==', diaryId), // 이 여행일기의 것만
        orderBy('createdAt', 'asc') // 작성 순서대로
      );
      
      const snapshot = await getDocs(q);
      
      // 데이터 변환
      const data = snapshot.docs.map(doc => {
        const item = doc.data();
        return {
          id: doc.id,
          latitude: item.latitude, // 위도
          longitude: item.longitude, // 경도
          transport: item.transport, // 교통수단 (1~8)
          title: item.title, // 제목
        };
      });
      
      setEntries(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  // 로딩 중이면 로딩 표시
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#42b1fa" />
      </View>
    );
  }
  
  // 일기가 없으면 안내 메시지
  if (entries.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>아직 작성한 일기가 없어요</Text>
      </View>
    );
  }
  
  // 첫 번째 장소를 지도 중심으로 설정
  const firstLocation = entries[0];
  
  return (
    <View style={styles.container}>
      {/* 지도 */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: firstLocation.latitude,
          longitude: firstLocation.longitude,
          latitudeDelta: 0.1, // 지도 확대 정도
          longitudeDelta: 0.1,
        }}
      >
        {/* 각 장소에 마커 표시 */}
        {entries.map((entry, index) => (
          <Marker
            key={entry.id}
            coordinate={{
              latitude: entry.latitude,
              longitude: entry.longitude,
            }}
            title={`${index + 1}. ${entry.title}`} // 1. 제주공항
            pinColor={TRANSPORT_COLORS[entry.transport] || '#FF0000'}
          />
        ))}
        
        {/* 장소들을 선으로 연결 */}
        {entries.map((entry, index) => {
          // 마지막 장소는 다음 장소가 없으므로 제외
          if (index === entries.length - 1) return null;
          
          const nextEntry = entries[index + 1];
          
          return (
            <Polyline
              key={`line-${entry.id}`}
              coordinates={[
                { latitude: entry.latitude, longitude: entry.longitude },
                { latitude: nextEntry.latitude, longitude: nextEntry.longitude },
              ]}
              strokeColor={TRANSPORT_COLORS[entry.transport] || '#FF0000'} // 교통수단별 색깔
              strokeWidth={4} // 선 굵기
            />
          );
        })}
      </MapView>
      
      {/* 범례 (어떤 색이 어떤 교통수단인지 표시) */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>교통수단</Text>
        <View style={styles.legendItems}>
          {['도보', '자전거', '자동차', '버스', '지하철', '기차', '비행기', '배'].map((name, idx) => (
            <View key={idx} style={styles.legendItem}>
              <View style={[styles.colorBox, { backgroundColor: TRANSPORT_COLORS[idx + 1] }]} />
              <Text style={styles.legendText}>{name}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// 스타일
const styles = StyleSheet.create({
  // 전체 화면
  container: {
    flex: 1,
  },
  // 중앙 정렬
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 지도
  map: {
    flex: 1,
  },
  // 빈 화면 텍스트
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  // 범례 박스
  legend: {
    position: 'absolute', // 지도 위에 겹쳐서 표시
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  // 범례 제목
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  // 범례 항목들
  legendItems: {
    flexDirection: 'row', // 가로로 나열
    flexWrap: 'wrap', // 줄바꿈
  },
  // 각 범례 항목
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  // 색깔 박스
  colorBox: {
    width: 20,
    height: 20,
    borderRadius: 3,
    marginRight: 5,
  },
  // 범례 텍스트
  legendText: {
    fontSize: 12,
  },
});