// writediart.js
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, 
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
  Keyboard, TextInput, Alert, Modal, ScrollView } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from "expo-location";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { auth, db } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

export default function WriteDiaryScreen({route, navigation}) {
  const [writeText, setwriteText] = useState("");
  const [writeDiary, setwriteDiary] = useState("");
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [user, setUser] = useState(null);
  const LCforMap = route.params?.locationName;
  const [locationName, setLocationName] = useState(LCforMap || "");
  const [searchLCT, setsearchLCT] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [placeholder, setPlaceholder] = useState("");

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

  const handleSearchLocation = async () => {
    if (!searchLCT) {
      Alert.alert("주소를 입력하세요.");
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
        const detailLocation = foundLocation.name || foundLocation.formatAddress || searchLCT;
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
      mediaTypes: ['images', 'videos'],
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
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedMedia([...selectedMedia, ...result.assets]);
      Alert.alert(`${result.assets.length}개의 파일이 추가되었습니다!`);
    }
  };

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

  const handleSave = () => {
    if (!locationName) {
      Alert.alert('주소가 비어있습니다.', '여행지를 검색해주세요.');
      return;
    }
    Alert.alert('저장 완료', '여행일기가 저장되었습니다!');
    navigation.goBack();
  };

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
            <TouchableOpacity onPress={() => navigation.goBack()}>
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
                  style={styles.transportIcon}
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

          {/* 사진/동영상 추가 */}
          <TouchableOpacity 
            style={styles.uploadButtonContainer}
            onPress={() => setShowUploadModal(true)}
            activeOpacity={0.7}>
            <Text style={styles.uploadText}>📷 사진/동영상 추가</Text>
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
  },
  dateButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 7,
    marginTop: 10,
    flex: 1,
  },
  dateText: {
    fontSize: 16,
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
  },
  LCTitle2:{
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
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
    fontSize: 20,
    color: 'white',
  },
  DiaryInput: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 18,
    borderRadius: 7,
    height: 210,
    color: '#000',
    backgroundColor: 'white',
    marginBottom: 15,
  },
  transportTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    marginTop: 12,
  },
  transportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
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
  transportIcon: {
    marginBottom: 4,
  },
  transportText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
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
  },
  uploadText: {
    fontSize: 18,
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
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 13,
    justifyContent: 'center',
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
    borderRadius: 7,
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
    borderRadius: 7,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '600',
  },
});
