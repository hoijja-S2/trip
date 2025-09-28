import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase Console 설정
const firebaseConfig = {
  apiKey: "AIzaSyAP0pEA2ywGws1G3YNRSdNID-0G2aReo_E",
  authDomain: "tripapp-8fc99.firebaseapp.com",
  projectId: "tripapp-8fc99",
  storageBucket: "tripapp-8fc99.firebasestorage.app",
  messagingSenderId: "728074923514",
  appId: "1:728074923514:web:1f494c786a17bfcef2c843",
  measurementId: "G-TW3RZ8JSG1"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firebase 에서 가져와서 사용할 기능들
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;