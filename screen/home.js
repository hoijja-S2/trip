// screens/HomeScreen.js
import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Alert } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons"; // 아이콘
import { useNavigation } from "@react-navigation/native";

export default function HomeScreen() {
  const [region, setRegion] = useState(null);
  const [visitedPlaces, setVisitedPlaces] = useState([]); // 방문한 장소 데이터 (나중에 Firestore 연결)
  const navigation = useNavigation();

  // ✅ 현재 위치 받아오기
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("권한 거부됨", "위치 접근 권한이 필요합니다.");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  // ✅ 일기 작성 화면으로 이동
  const goToDiary = () => {
    navigation.navigate("Diary"); // DiaryScreen 으로 이동
  };

  return (
    <View style={styles.container}>
      {/* 지도 표시 */}
      {region ? (
        <MapView
          style={styles.map}
          region={region}
          showsUserLocation={true}
          followsUserLocation={true}
        >
          {/* 방문한 장소 마커 표시 (나중에 Firestore 데이터 불러올 때 사용) */}
          {visitedPlaces.map((place, index) => (
            <Marker
              key={index}
              coordinate={{
                latitude: place.latitude,
                longitude: place.longitude,
              }}
              title={place.name}
              description={place.date}
            />
          ))}

          {/* 이동 경로 표시 (예시) */}
          {visitedPlaces.length > 1 && (
            <Polyline
              coordinates={visitedPlaces.map((p) => ({
                latitude: p.latitude,
                longitude: p.longitude,
              }))}
              strokeColor="#FF5733"
              strokeWidth={4}
            />
          )}
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
          <Text>지도를 불러오는 중...</Text>
        </View>
      )}

      {/* 플로팅 버튼 */}
      <TouchableOpacity style={styles.fab} onPress={goToDiary}>
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}

// 🎨 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#007AFF",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 2, height: 2 },
    elevation: 5, // 안드로이드 그림자
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});


