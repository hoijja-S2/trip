// writediart.js
import {React, useEffect} from "react";
import { View, Text, StyleSheet, TouchableOpacity, 
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
  Keyboard, TextInput, 
  Alert, Modal, ScrollView,} from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {useState} from "react";
import * as Location from "expo-location";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function WriteDiaryScreen({route, navigation}) {
  const [writeText, setwriteText] = useState("");
  const [writeDiary, setwriteDiary] = useState("");
  const [selectedTransport, setSelectedTransport] = useState(null);
  const LCforMap = route.params?.locationName;
  const [locationName, setLocationName] = useState(LCforMap || "");
  const [searchLCT, setsearchLCT] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false); // 추가
  const [selectedMedia, setSelectedMedia] = useState([]); // 추
  const [selectedDate, setSelectedDate] = useState(new Date()); // 오늘 날짜
  const [showDatePicker, setShowDatePicker] = useState(false); // 날짜 선택기 표시 여부
  const [placeholder, setPlaceholder] = useState("");
  const placeholderTexts = [
    "어떤 게 가장 기억에 남았나요?",
    "사진과 함께 추억을 기록해보세요.",
    "기분, 풍경, 냄새... 무엇이 떠오르나요?"
  ]
  const transports = [
    { id: 1, name: "도보", icon: "walk" },
    { id: 2, name: "자전거", icon: "bike" },
    { id: 3, name: "자동차", icon: "car" },
    { id: 4, name: "버스", icon: "bus" },
    { id: 5, name: "지하철", icon: "subway" },
    { id: 6, name: "기차", icon: "train" },
    { id: 7, name: "비행기", icon: "airplane" },
    { id: 8, name: "배", icon: "ferry" },
  ]

  const handleSearchLocation = async () => {
    if (!searchLCT) {
      Alert.alert("주소를 입력하세요.")
      return;
    }
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("위치권한이 필요합니다.");
        return;
      }
      let geo = await Location.geocodeAsync(searchLCT);
      if (geo.length > 0) {
        const foundLocation = geo[0];
        const detailLocation = foundLocation.name || foundLocation.formatAddress ||
        searchLCT;
        setLocationName(detailLocation);
        Alert.alert("주소가 설정되었습니다!");
      } else {
        Alert.alert("주소를 찾을 수 없습니다");
      }
    } catch (error) {
      Alert.alert("오류 발생", error.message);
    }
  };
  const handleTransportSelect = (transportId) => {
  if (selectedTransport === transportId) {
    // 이미 선택된 교통수단을 다시 누르면 선택 해제
    setSelectedTransport(null);
  } else {
    // 새로운 교통수단 선택
    setSelectedTransport(transportId);
  }
};

  const handleCamera = async () => {
    setShowUploadModal(false);
    
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('카메라 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedMedia([...selectedMedia, result.assets[0]]);
      Alert.alert('사진이 추가되었습니다!');
    }
  };

  // 갤러리에서 선택
  const handleGallery = async () => {
    setShowUploadModal(false);
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('갤러리 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedMedia([...selectedMedia, ...result.assets]);
      Alert.alert(`${result.assets.length}개의 파일이 추가되었습니다!`);
    }
  };
  // 파일 폴더에서 선택
  const handleFiles = async () => {
    setShowUploadModal(false);
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'video/*'],
        multiple: true,
      });

      if (!result.canceled) {
        setSelectedMedia([...selectedMedia, ...result.assets]);
        Alert.alert(`${result.assets.length}개의 파일이 추가되었습니다!`);
      }
    } catch (error) {
      Alert.alert('파일 선택 오류', error.message);
    }
  };
      // 날짜 변경 처리
  const onDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };
  // 날짜 포맷 (2024.11.24)
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };
  useEffect(() => {
  const randomText = placeholderTexts[Math.floor(Math.random() * placeholderTexts.length)];
  setPlaceholder(randomText);
  }, []);

  // 저장 버튼
  const handleSave = () => {
    if (!writeText) {
      Alert.alert('제목을 입력하세요.');
      return;
    }
    if (!locationName) {
      Alert.alert('여행 장소를 입력하세요.');
      return;
    }
    
    Alert.alert('저장 완료', '여행일기가 저장되었습니다!');
    // 여기에 Firebase 저장 로직 추가
    navigation.goBack();
  };
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}
      accessible={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "android" ? "padding" : "height"}>
        <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
          {/* 날짜 선택 */}
          <View style={styles.dateRow}>
            <Text style={styles.TitleText}>여행일</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}
        {locationName && locationName !== "" ? (
          <View>
            <Text style={styles.LCTitle}>여행지</Text>
            <Text style={styles.LCSearchInput}>{locationName}</Text>
            <TouchableOpacity style={styles.LCsearchButton}
              onPress={() => setLocationName("")}>
              <Text style={styles.LCsearchButtonText}>변경</Text>
            </TouchableOpacity>
          </View>
        ) :(
          <View>
            <TextInput
              style={styles.LCSearchInput}
              placeholder = "여행지"
              value = {searchLCT}
              onChangeText={setsearchLCT}>
            </TextInput>
            <TouchableOpacity style={styles.LCsearchButton} onPress={handleSearchLocation}>
              <Text style={styles.modalOptionIcon}>📸</Text>
              <Text style={styles.LCsearchButtonText}>검색</Text>
            </TouchableOpacity>
          </View>
        )}
        <Text style={styles.transportTitle}>여정을 도와준 교통수단</Text>
        <View style={styles.transportGrid}>
          {transports.map((transport) => (
            <TouchableOpacity key={transport.id}
            style={[styles.transportButton, selectedTransport === transport.id && styles.selected]}
            onPress={() => handleTransportSelect(transport.id)}>
              <MaterialCommunityIcons 
                name={transport.icon} 
                size={32} 
                color={selectedTransport === transport.id ? '#0baefe' : '#666'}
                style={styles.transportIcon}
              />
              <Text style={[styles.transportText, selectedTransport === transport.id && styles.selectedText]}>
                {transport.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.DiaryInput}
          placeholder={placeholder}
          value={writeDiary}
          onChangeText={setwriteDiary}
          multiline={true}
          textAlignVertical="top"
          numberOfLines={10}
        />
        <TouchableOpacity style={styles.uploadPicture}
        onPress={()=> setShowUploadModal(true)}>
          <Text style={styles.uploadText}>📷 사진/동영상 추가</Text>
          {selectedMedia.length > 0 && (<Text style={styles.mediaCount}>{selectedMedia.length}개 선택됨</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
         {/* 업로드 옵션 모달 */}
        <Modal
          visible={showUploadModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowUploadModal(false)}>
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowUploadModal(false)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>미디어 추가</Text>
              
              <TouchableOpacity 
                style={styles.modalOption}
                onPress={handleCamera}>
                <Text style={styles.modalOptionIcon}>📸</Text>
                <Text style={styles.modalOptionText}>카메라로 촬영</Text>
              </TouchableOpacity>

              <View style={styles.modalDivider} />

              <TouchableOpacity 
                style={styles.modalOption}
                onPress={handleGallery}>
                <Text style={styles.modalOptionIcon}>🖼️</Text>
                <Text style={styles.modalOptionText}>갤러리에서 선택</Text>
              </TouchableOpacity>

              <View style={styles.modalDivider} />

              <TouchableOpacity 
                style={styles.modalOption}
                onPress={handleFiles}>
                <Text style={styles.modalOptionIcon}>📁</Text>
                <Text style={styles.modalOptionText}>파일 선택</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalCancel}
                onPress={() => setShowUploadModal(false)}>
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    backgroundColor: '#f8f9fa',
  },
  dateRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 10,
  marginBottom: 15,
  },
  TitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 20, // 제목과 날짜 사이 간격
  },
  dateButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginTop:10,
    flex: 1, // 남은 공간 차지
  },
  dateText: {
    fontSize: 16,
  },
  LCSearchInput: {
    backgroundColor: 'white',
    borderRadius: 7,
    height: 45,
    fontSize: 18
  },
  LCsearchButton:{
    alignItems: 'center',
    height: 40,
    backgroundColor: '#0baefe',
    borderRadius: 7,
    marginTop: 10,
  }, 
  LCsearchButtonText: {
    fontSize: 20,
    color: 'white',
  },
  // 일기 본문
  DiaryInput: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 18,
    borderRadius: 7,
    height: 180,
    color: '#000',
    backgroundColor: 'white',
    marginBottom: 15,
  },

  // 교통수단 제목
  transportTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    marginTop: 12,
  },

  // 교통수단 선택 영역
  transportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
    marginTop: 8,
  },
  transportButton: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: 'white',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  selected: {
    fontSize: 15,
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#0baefe',
  },
  selectedText: {
    color: '#3182CE',
    fontWeight: 'bold',
  },

  // 사진 업로드 버튼
  uploadPicture: {
    backgroundColor: '#0baefe',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 15,
  },
  uploadText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  mediaCount: {
    fontSize: 14,
    color: 'white',
    marginTop: 4,
  },

  // 모달 (그대로 유지)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  modalOptionIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  modalOptionText: {
    fontSize: 17,
    color: '#212529',
    fontWeight: '500',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#e9ecef',
  },
  modalCancel: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '600',
  },
});
