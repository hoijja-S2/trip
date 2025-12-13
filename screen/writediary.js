import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, 
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
  Keyboard, TextInput, Alert, Modal, ScrollView, ActivityIndicator, Image, FlatList } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { auth, db, storage } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function WriteDiaryScreen({route, navigation}) {

  const [writeText, setwriteText] = useState("");
  const [writeDiary, setwriteDiary] = useState("");
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [user, setUser] = useState(null);
  const [latitude, setLatitude] = useState(route.params?.latitude || null);
  const [longitude, setLongitude] = useState(route.params?.longitude || null);
  const [locationName, setLocationName] = useState(route.params?.locationName || "");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  
  // 여행 일정 ID
  const diaryId = route.params?.diaryId;
  // 수정 모드 (entryId가 있으면 수정, 없으면 새로 작성)
  const entryId = route.params?.entryId;
  const isEditMode = !!entryId;

  // 초기화 플래그를 useRef로 관리해서 중복 실행 방지
  const initializeRef = useRef(false);

  const placeholderTexts = [
    "어떤 게 가장 기억에 남았나요?",
    "사진과 함께 추억을 기록해보세요.",
    "기분, 풍경, 냄새... 무엇이 떠오르나요?"
  ];

  const transports = useMemo(() => [
    { id: 1, name: "도보", icon: "walk" },
    { id: 2, name: "자전거", icon: "bike" },
    { id: 3, name: "자동차", icon: "car" },
    { id: 4, name: "버스", icon: "bus" },
    { id: 5, name: "지하철", icon: "subway" },
    { id: 6, name: "기차", icon: "train" },
    { id: 7, name: "비행기", icon: "airplane" },
    { id: 8, name: "배", icon: "ferry" },
  ], []);

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

  // 저장 중 뒤로가기 방지
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (saving) {
        e.preventDefault();
        Alert.alert('알림', '저장이 진행 중입니다. 잠시만 기다려주세요.');
      }
    });
    return unsubscribe;
  }, [saving, navigation]);

  // 수정 모드 데이터 로드 (초기화 시에만 실행)
  useEffect(() => {
    if (isEditMode && route.params?.entry && !initializeRef.current) {
      const entry = route.params.entry;
      setwriteText(entry.title || "");
      setwriteDiary(entry.description || "");
      setLocationName(entry.location || "");
      setLatitude(entry.latitude || null);
      setLongitude(entry.longitude || null);
      setSelectedTransport(entry.transport || null);
      
      if (entry.date) {
        const dateObj = entry.date.toDate ? entry.date.toDate() : new Date(entry.date);
        setSelectedDate(dateObj);
      }
      
      initializeRef.current = true;
    }
  }, [isEditMode]);

  // 위치 정보 업데이트 (별도로 관리)
  useEffect(() => {
    if (route.params?.locationName && route.params?.draftData) {
      setLocationName(route.params.locationName);
      setLatitude(route.params.latitude);
      setLongitude(route.params.longitude);
      
      if (route.params.draftData.title !== undefined) setwriteText(route.params.draftData.title);
      if (route.params.draftData.description !== undefined) setwriteDiary(route.params.draftData.description);
      if (route.params.draftData.transport !== undefined) setSelectedTransport(route.params.draftData.transport);
      if (route.params.draftData.date !== undefined) setSelectedDate(route.params.draftData.date);
    } else if (route.params?.locationName && !isEditMode) {
      setLocationName(route.params.locationName);
      setLatitude(route.params.latitude);
      setLongitude(route.params.longitude);
    }
  }, [route.params?.locationName]);

  const handleTransportSelect = useCallback((transportId) => {
    setSelectedTransport(prev => prev === transportId ? null : transportId);
  }, []);

  const handleCamera = useCallback(async () => {
    setShowUploadModal(false);
    
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        '카메라 권한이 필요합니다.',
        '설정에서 카메라 권한을 허용해주세요.',
        [{ text: '확인', onPress: () => {} }]
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.3,
    });

    if (!result.canceled) {
      setSelectedMedia(prev => [...prev, result.assets[0]]);
      Alert.alert('사진이 추가되었습니다!');
    }
  }, []);

  const handleGallery = useCallback(async () => {
    setShowUploadModal(false);
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        '갤러리 권한이 필요합니다.',
        '설정에서 갤러리 권한을 허용해주세요.',
        [{ text: '확인', onPress: () => {} }]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.3,
    });

    if (!result.canceled) {
      setSelectedMedia(prev => [...prev, ...result.assets]);
      Alert.alert(`${result.assets.length}개의 파일이 추가되었습니다!`);
    }
  }, []);

  const onDateChange = useCallback((event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  }, []);

  const formatDate = useCallback((date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  }, []);

  const handleRemoveMedia = useCallback((index) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Firebase Storage에 사진 업로드
  const uploadMediaToStorage = useCallback(async (uploadEntryId) => {
    if (selectedMedia.length === 0) return true;

    try {
      for (let i = 0; i < selectedMedia.length; i++) {
        const media = selectedMedia[i];
        if (typeof media === 'string') continue;
        
        const fileName = `${Date.now()}_${i}.jpg`;
        const filePath = `diaries/${diaryId}/${uploadEntryId}/${fileName}`;
        const fileRef = ref(storage, filePath);

        const response = await fetch(media.uri);
        const blob = await response.blob();

        await uploadBytes(fileRef, blob);
      }
      return true;
    } catch (error) {
      console.error('===== 업로드 에러 =====', error);
      Alert.alert('사진 업로드 실패', error.message);
      return false;
    }
  }, [selectedMedia, diaryId]);

  const getDiariesEntriesCount = useCallback(async (diaryId) => {
    try {
      const entriesRef = collection(db, 'travelDiaries', diaryId, 'entries');
      const snapshot = await getDocs(entriesRef);
      return snapshot.docs.length;
    } catch (error) {
      console.error('entriesCount 조회 오류:', error);
      return 0;
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!diaryId) {
      Alert.alert('오류', '여행 일정을 선택해주세요.');
      return;
    }

    if (!locationName) {
      Alert.alert('주소가 비어있습니다.', '여행지를 검색해주세요.');
      return;
    }

    if (!writeText.trim()) {
      Alert.alert('입력 오류', '제목을 입력해주세요.');
      return;
    }

    if (!user) {
      Alert.alert('로그인이 필요합니다.');
      return;
    }

    setSaving(true);

    try {
      if (isEditMode) {
        await updateDoc(doc(db, 'travelDiaries', diaryId, 'entries', entryId), {
          title: writeText,
          location: locationName,
          latitude: latitude || 37.5665,
          longitude: longitude || 126.9780,
          description: writeDiary,
          transport: selectedTransport,
          date: selectedDate,
          updatedAt: serverTimestamp(),
        });

        if (selectedMedia.length > 0) {
          const uploadSuccess = await uploadMediaToStorage(entryId);
          if (!uploadSuccess) {
            setSaving(false);
            return;
          }
        }

        Alert.alert('성공', '일기가 수정되었습니다!');
      } else {
        const entryRef = await addDoc(
          collection(db, 'travelDiaries', diaryId, 'entries'),
          {
            title: writeText,
            location: locationName,
            latitude: latitude || 37.5665,
            longitude: longitude || 126.9780,
            description: writeDiary,
            transport: selectedTransport,
            date: selectedDate,
            createdAt: serverTimestamp(),
          }
        );

        const newEntryId = entryRef.id;

        if (selectedMedia.length > 0) {
          const uploadSuccess = await uploadMediaToStorage(newEntryId);
          if (!uploadSuccess) {
            setSaving(false);
            return;
          }

          try {
            const firstImagePath = `diaries/${diaryId}/${newEntryId}/${Date.now()}_0.jpg`;
            const firstImageRef = ref(storage, firstImagePath);
            const thumbnailUrl = await getDownloadURL(firstImageRef);
            
            const currentCount = await getDiariesEntriesCount(diaryId);
            await updateDoc(doc(db, 'travelDiaries', diaryId), {
              thumbnailUrl: thumbnailUrl,
              entriesCount: currentCount
            });
          } catch (error) {
            try {
              const currentCount = await getDiariesEntriesCount(diaryId);
              await updateDoc(doc(db, 'travelDiaries', diaryId), {
                entriesCount: currentCount
              });
            } catch (countError) {
              console.log('entriesCount 업데이트 실패:', countError);
            }
          }
        } else {
          try {
            const currentCount = await getDiariesEntriesCount(diaryId);
            await updateDoc(doc(db, 'travelDiaries', diaryId), {
              entriesCount: currentCount
            });
          } catch (error) {
            console.log('entriesCount 업데이트 실패:', error);
          }
        }

        Alert.alert('저장 완료', '여행일기가 저장되었습니다!');
      }

      setSaving(false);
      navigation.goBack();
    } catch (error) {
      console.error('저장 오류:', error);
      Alert.alert('저장 실패', error.message);
      setSaving(false);
    }
  }, [diaryId, locationName, writeText, user, isEditMode, entryId, latitude, longitude, writeDiary, selectedTransport, selectedDate, selectedMedia, uploadMediaToStorage, getDiariesEntriesCount, navigation]);

  const draftNavigationParams = useMemo(() => ({
    focusSearch: true, 
    diaryId: diaryId,
    draftData: {
      title: writeText,
      description: writeDiary,
      transport: selectedTransport,
      date: selectedDate,
    }
  }), [diaryId, writeText, writeDiary, selectedTransport, selectedDate]);

  if (saving) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#42b1fa" />
        <Text style={{ marginTop: 10, color: '#666' }}>{isEditMode ? '수정 중...' : '저장 중...'}</Text>
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
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
          nestedScrollEnabled={false}>
          
          <Text style={styles.screenTitle}>{isEditMode ? '일기 수정' : '일기 작성'}</Text>

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

          {!locationName || locationName === "" ? (
            <TouchableOpacity onPress={() => navigation.navigate('Home', draftNavigationParams)}>
              <Text style={styles.LCTitle1}>여행지</Text>
              <Text style={[styles.LCSearchInput, {color: '#999'}]}>여행지 선택</Text>
            </TouchableOpacity>
          ) : (
            <View>
              <Text style={styles.LCTitle2}>여행지</Text>
              <Text style={styles.LCSearchInput}>{locationName}</Text>
              <TouchableOpacity 
                style={styles.LCsearchButton}
                onPress={() => navigation.navigate('Home', draftNavigationParams)}>
                <Text style={styles.LCsearchButtonText}>변경</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.TitleText}>여행 일차</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="여행의 제목을 입력해주세요"
            value={writeText}
            onChangeText={setwriteText}
            placeholderTextColor="#999"
          />

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

          <TextInput
            style={styles.DiaryInput}
            placeholder={placeholder}
            value={writeDiary}
            onChangeText={setwriteDiary}
            multiline={true}
            textAlignVertical="top"
            numberOfLines={10}
          />

          <TouchableOpacity 
            style={styles.uploadButtonContainer}
            onPress={() => setShowUploadModal(true)}
            activeOpacity={0.7}>
            <Text style={styles.uploadText}>📷 사진 추가</Text>
            {selectedMedia.length > 0 && (
              <Text style={styles.mediaCount}>{selectedMedia.length}개 선택됨</Text>
            )}
          </TouchableOpacity>

          {selectedMedia.length > 0 && (
            <View style={styles.mediaPreviewContainer}>
              <Text style={styles.mediaPreviewTitle}>선택된 사진</Text>
              <View style={styles.mediaPreviewGrid}>
                {selectedMedia.map((item, index) => (
                  <View key={index} style={styles.mediaPreviewItem}>
                    <Image
                      source={{ uri: item.uri }}
                      style={styles.mediaPreviewImage}
                    />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveMedia(index)}>
                      <MaterialCommunityIcons 
                        name="close-circle" 
                        size={24} 
                        color="#ff6b6b" 
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{isEditMode ? '수정 완료' : '저장하기'}</Text>
          </TouchableOpacity>
        </ScrollView>

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
    paddingBottom: 90,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    color: '#333',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  TitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 20,
    marginTop: 10,
    marginBottom: 5,
  },
  dateButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 7,
    flex: 1,
  },
  dateText: {
    fontSize: 18,
  },
  titleInput: {
    backgroundColor: 'white',
    borderRadius: 7,
    fontSize: 18,
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
    fontSize: 16,
    borderRadius: 7,
    height: 220,
    color: '#000',
    backgroundColor: 'white',
  },
  transportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  transportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
  mediaPreviewContainer: {
    marginBottom: 20,
    marginTop: 10,
  },
  mediaPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  mediaPreviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  mediaPreviewItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#e0e0e0',
    position: 'relative',
  },
  mediaPreviewImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  saveButton: {
    backgroundColor: '#0baefe',
    paddingVertical: 15,
    borderRadius: 7,
    alignItems: 'center',
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