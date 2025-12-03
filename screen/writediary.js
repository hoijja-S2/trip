import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, 
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
  Keyboard, TextInput, Alert, Modal, ScrollView, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from "expo-location";
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { auth, db, storage } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";

export default function WriteDiaryScreen({route, navigation}) {
  const [writeText, setwriteText] = useState("");
  const [writeDiary, setwriteDiary] = useState("");
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [user, setUser] = useState(null);
  const [latitude, setLatitude] = useState(route.params?.latitude || null);
  const [longitude, setLongitude] = useState(route.params?.longitude || null);
  const LCforMap = route.params?.locationName;
  const [locationName, setLocationName] = useState(LCforMap || "");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const placeholderTexts = [
    "어떤 게 가장 기억에 남았나요?",
    "사진과 함께 추억을 기록해보세요.",
    "기분, 풍경, 냄새... 무엇이 떠오르나요?"
  ];

  const transports = [
    { id: 1, name: "도보", icon: "walk" },
    { id: 2, name: "자전거", icon: "bike" },
    { id: 3, name: "자동차", icon: "car" },
    { id: 4, name: "버스", icon: "bus" },
    { id: 5, name: "지하철", icon: "subway" },
    { id: 6, name: "기차", icon: "train" },
    { id: 7, name: "비행기", icon: "airplane" },
    { id: 8, name: "배", icon: "ferry" },
  ];

  const [placeholder, setPlaceholder] = useState("");

  useEffect(() => {
    const randomText = placeholderTexts[Math.floor(Math.random() * placeholderTexts.length)];
    setPlaceholder(randomText);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  const handleTransportSelect = (transportId) => {
    if (selectedTransport === transportId) {
      setSelectedTransport(null);
    } else {
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
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedMedia([...selectedMedia, result.assets[0]]);
      Alert.alert('사진이 추가되었습니다!');
    }
  };

  const handleGallery = async () => {
    setShowUploadModal(false);
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('갤러리 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedMedia([...selectedMedia, ...result.assets]);
      Alert.alert(`${result.assets.length}개의 파일이 추가되었습니다!`);
    }
  };

  const onDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  // Firebase Storage에 사진 업로드
  const uploadMediaToStorage = async (diaryId) => {
    if (selectedMedia.length === 0) return true;  // 사진 없으면 그냥 성공으로 반환

    try {
      for (let i = 0; i < selectedMedia.length; i++) {
        const media = selectedMedia[i];
        const fileName = `${Date.now()}_${i}.jpg`;
        const fileRef = ref(storage, `diaries/${diaryId}/${fileName}`);

        const response = await fetch(media.uri);
        const blob = await response.blob();

        await uploadBytes(fileRef, blob);
        console.log(`업로드 완료: ${fileName}`);
      }
      return true;
    } catch (error) {
      console.error('Storage 업로드 오류:', error);
      Alert.alert('사진 업로드 실패', error.message);
      return false;
    }
  };

  const handleSave = async () => {
    if (!locationName) {
      Alert.alert('주소가 비어있습니다.', '여행지를 검색해주세요.');
      return;
    }

    if (!user) {
      Alert.alert('로그인이 필요합니다.');
      return;
    }

    setSaving(true);

    try {
      console.log('여행일기 저장 시작...');

      // 1. Firestore에 여행일기 저장
      const docRef = await addDoc(collection(db, 'travelDiaries'), {
        userId: user.uid,
        title: writeText || '제목 없음',
        location: locationName,
        latitude: latitude || 37.5665,
        longitude: longitude || 126.9780,
        description: writeDiary,
        transport: selectedTransport,
        date: selectedDate,
        createdAt: serverTimestamp(),
        entries: selectedMedia.length,
      });

      const diaryId = docRef.id;
      console.log('Firestore 저장 완료:', diaryId);

      // 2. Storage에 사진 업로드
      if (selectedMedia.length > 0) {
        console.log(`${selectedMedia.length}개 파일 업로드 시작...`);
        const uploadSuccess = await uploadMediaToStorage(diaryId);
        if (!uploadSuccess) {
          setSaving(false);
          return;
        }
        console.log('Storage 업로드 완료');
      }

      Alert.alert('저장 완료', '여행일기가 저장되었습니다!');
      setSaving(false);
      navigation.goBack();
    } catch (error) {
      console.error('저장 오류:', error);
      Alert.alert('저장 실패', error.message);
      setSaving(false);
    }
  };

  if (saving) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#42b1fa" />
        <Text style={{ marginTop: 10, color: '#666' }}>저장 중...</Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
              onPress={() => setShowDatePicker(true)}>
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

          {/* 여행지 선택 */}
          {!locationName || locationName === "" ? (
          <TouchableOpacity onPress={() => navigation.navigate('Home', { focusSearch: true })}>
            <Text style={styles.LCTitle1}>여행지</Text>
            <Text style={[styles.LCSearchInput, {color: '#999'}]}>여행지 선택</Text>
          </TouchableOpacity>
          ) : (
            <View>
              <Text style={styles.LCTitle2}>여행지</Text>
              <Text style={styles.LCSearchInput}>{locationName}</Text>
              <TouchableOpacity 
                style={styles.LCsearchButton}
                onPress={() => setLocationName("")}>
                <Text style={styles.LCsearchButtonText}>변경</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 제목 입력 */}
          <Text style={styles.TitleText}>제목</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="여행일기 제목을 입력하세요"
            value={writeText}
            onChangeText={setwriteText}
            placeholderTextColor="#999"
          />

          {/* 교통수단 선택 */}
          <Text style={styles.transportTitle}>여정을 도와준 교통수단</Text>
          <View style={styles.transportGrid}>
            {transports.map((transport) => (
              <TouchableOpacity 
                key={transport.id}
                style={[
                  styles.transportButton, 
                  selectedTransport === transport.id && styles.selected
                ]}
                onPress={() => handleTransportSelect(transport.id)}>
                <MaterialCommunityIcons 
                  name={transport.icon} 
                  size={32} 
                  color={selectedTransport === transport.id ? '#0baefe' : '#666'}
                />
                <Text 
                  style={[
                    styles.transportText, 
                    selectedTransport === transport.id && styles.selectedText
                  ]}>
                  {transport.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 일기 본문 */}
          <TextInput
            style={styles.DiaryInput}
            placeholder={placeholder}
            value={writeDiary}
            onChangeText={setwriteDiary}
            multiline={true}
            textAlignVertical="top"
            numberOfLines={10}
          />

          {/* 사진 추가 */}
          <TouchableOpacity 
            style={styles.uploadButtonContainer}
            onPress={() => setShowUploadModal(true)}
            activeOpacity={0.7}>
            <Text style={styles.uploadText}>📷 사진 추가</Text>
            {selectedMedia.length > 0 && (
              <Text style={styles.mediaCount}>{selectedMedia.length}개 선택됨</Text>
            )}
          </TouchableOpacity>

          {/* 저장 버튼 */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>저장하기</Text>
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
              <Text style={styles.modalTitle}>사진 추가</Text>
              
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
  scrollContent: {
    paddingBottom: 30,
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
    marginRight: 20,
    marginTop: 10,
  },
  dateButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 7,
    flex: 1,
  },
  dateText: {
    fontSize: 16,
  },
  titleInput: {
    backgroundColor: 'white',
    borderRadius: 7,
    fontSize: 16,
    paddingHorizontal: 13,
    height: 45,
    paddingVertical: 10,
    marginBottom: 15,
  },
  LCSearchInput: {
    backgroundColor: 'white',
    borderRadius: 7,
    fontSize: 15,
    paddingHorizontal: 13,
    height: 45,
    paddingVertical: 12,
  },
  LCTitle1: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 10,
  },
  LCTitle2:{
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 10,
  },
  LCsearchButton: {
    alignItems: 'center',
    height: 40,
    backgroundColor: '#0baefe',
    borderRadius: 7,
    marginTop: 10,
    justifyContent: 'center',
  }, 
  LCsearchButtonText: {
    fontSize: 16,
    color: 'white',
  },
  DiaryInput: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderRadius: 7,
    height: 180,
    color: '#000',
    backgroundColor: 'white',
    marginBottom: 15,
    marginTop: 10,
  },
  transportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
    marginTop: 15,
  },
  transportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
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
  transportText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  selected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#0baefe',
    borderWidth: 2,
  },
  selectedText: {
    color: '#0baefe',
    fontWeight: 'bold',
  },
  uploadButtonContainer: {
    width: 'auto',
    alignSelf: 'flex-start',
    marginBottom: 15,
    marginTop: 10,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
  },
  mediaCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#0baefe',
    paddingVertical: 15,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  modalOptionIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#e9ecef',
  },
  modalCancel: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 7,
  },
  modalCancelText: {
    fontSize: 15,
    color: '#6c757d',
    fontWeight: '600',
  },
});