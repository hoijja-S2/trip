import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import MapView, { Marker } from "react-native-maps";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import * as Location from "expo-location";

export default function HomeScreen({ navigation, route }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [markerCoord, setMarkerCoord] = useState(null);
  const mapRef = useRef(null);
  const placesRef = useRef(null);

  // 로그인 감시
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  // 다른 화면에서 focus 요청
  useEffect(() => {
    if (route?.params?.focusSearch) {
      setTimeout(() => {
        placesRef.current?.focus();
      }, 300);
    }
  }, [route?.params?.focusSearch]);

  // 로그아웃
  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("로그아웃 완료");
    } catch (error) {
      alert("로그아웃 실패: " + error.message);
    }
  };

  // 수동 검색 버튼
  const handleManualSearch = async () => {
    if (!searchText) return;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("위치 권한이 필요합니다.");
        return;
      }

      let geo = await Location.geocodeAsync(searchText);
      if (geo.length > 0) {
        const { latitude, longitude } = geo[0];

        setMarkerCoord({ latitude, longitude });

        mapRef.current?.animateToRegion(
          {
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          500
        );
      } else {
        Alert.alert("주소를 찾을 수 없습니다.");
      }
    } catch (error) {
      Alert.alert("오류가 발생했습니다.", error.message);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "android" ? "padding" : "height"}
      >
        {/* 지도 */}
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: 37.5665,
            longitude: 126.9780,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {markerCoord && (
            <Marker
              coordinate={markerCoord}
              title="선택한 위치"
              description={searchText || undefined}
              onPress={async () => {
                if (user) {
                  let realLC = searchText;
                  try {
                    let address = await Location.reverseGeocodeAsync({
                      latitude: markerCoord.latitude,
                      longitude: markerCoord.longitude,
                    });
                    if (address[0]) {
                      const a = address[0];
                      realLC = `${a.city || ""} ${a.district || ""} ${
                        a.street || ""
                      } ${a.name || ""}`.trim();
                    }
                  } catch {}

                  navigation.navigate("writediary", {
                    latitude: markerCoord.latitude,
                    longitude: markerCoord.longitude,
                    locationName: realLC,
                  });

                  setMenuOpen(false);
                } else {
                  Alert.alert(
                    "!로그인 필요!",
                    "글쓰기를 하려면 로그인이 필요합니다.",
                    [
                      { text: "취소", style: "cancel" },
                      { text: "로그인", onPress: () => navigation.navigate("Login") },
                    ]
                  );
                }
              }}
            />
          )}
        </MapView>

        {/* 검색 박스 */}
        <View style={styles.searchContainer}>
          <GooglePlacesAutocomplete
            ref={placesRef}
            placeholder="주소를 입력하세요"
            fetchDetails={true}
            enablePoweredByContainer={false}
            debounce={200}

            onPress={(data, details) => {
              // 자동완성 닫히도록 포커스 제거
              placesRef.current?.blur();
              Keyboard.dismiss();

              const location = details?.geometry?.location;
              if (!location) return;

              const lat = location.lat;
              const lng = location.lng;

              setSearchText(data.description);
              placesRef.current?.setAddressText(data.description);

              // 마커 & 지도 이동
              setMarkerCoord({ latitude: lat, longitude: lng });
              mapRef.current?.animateToRegion(
                {
                  latitude: lat,
                  longitude: lng,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                },
                300
              );
            }}

            textInputProps={{
              placeholderTextColor: "#999",
              onChangeText: (t) => setSearchText(t),
            }}

            query={{
              key: "AIzaSyDydQh4WXuFGqX6RzAmuxdYmrGJNOhfr1k",
              language: "ko",
            }}

            styles={googlePlacesStyles}
          />

          {/* 수동 검색 버튼 */}
          <TouchableOpacity style={styles.searchButton} onPress={handleManualSearch}>
            <Text style={styles.searchButtonText}>검색</Text>
          </TouchableOpacity>

          {/* 검색창 X 버튼 */}
          {searchText.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSearchText("");
                placesRef.current?.setAddressText("");
              }}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* 메뉴 버튼 */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuOpen(!menuOpen)}
        >
          <Ionicons name="menu" size={28} color="black" />
        </TouchableOpacity>

        {/* 메뉴 내용 */}
        {menuOpen && (
          <View style={styles.menu}>
            {user ? (
              <>
                <View style={styles.profileBox}>
                  <Text style={styles.userEmail}>{user?.email}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setMenuOpen(false);
                    navigation.navigate("diarylist");
                  }}
                >
                  <Text style={styles.menuItem}>내 여행 목록</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setMenuOpen(false);
                    navigation.navigate("writediary");
                  }}
                >
                  <Text style={styles.menuItem}>일기 쓰기</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleLogout}>
                  <Text style={[styles.menuItem, { color: "red" }]}>로그아웃</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => {
                    setMenuOpen(false);
                    navigation.navigate("Login");
                  }}
                >
                  <Text style={styles.menuItem}>로그인</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setMenuOpen(false);
                    navigation.navigate("diarylist");
                  }}
                >
                  <Text style={styles.menuItem}>내 여행 목록</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  searchContainer: {
    position: "absolute",
    top: 60,
    left: 70,
    right: 20,
    zIndex: 10,
  },

  searchButton: {
    backgroundColor: "#0baefe",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },

  searchButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
  },

  clearButton: {
    position: "absolute",
    right: 10,
    top: 8.5,
    padding: 5,
    zIndex: 11,
  },

  menuButton: {
    position: "absolute",
    top: 63,
    left: 18,
    backgroundColor: "white",
    padding: 5,
    borderRadius: 6,
    elevation: 4,
    zIndex: 15,
  },

  menu: {
    position: "absolute",
    top: 150,
    left: 20,
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    elevation: 5,
    zIndex: 14,
  },

  profileBox: { marginBottom: 10 },
  userEmail: { fontWeight: "bold" },
  menuItem: { fontSize: 16, marginVertical: 8 },
});

const googlePlacesStyles = {
  container: { flex: 0 },
  textInputContainer: { padding: 0 },
  textInput: {
    height: 45,
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    elevation: 3,
  },
  listView: {
    backgroundColor: "white",
    borderRadius: 8,
    marginTop: 5,
    elevation: 5,
  },
};

