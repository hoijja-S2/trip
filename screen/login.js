import React, { useState } from "react"; // React와 상태 관리 훅 useState 불러오기
import { View, Text, TextInput, Button, StyleSheet } from "react-native"; // RN 기본 UI 컴포넌트 불러오기
//상태관리훅: 컴포넌트 안에서 값이 바뀌면 화면을 다시 렌더링하도록 상태를 저장.
//아이디 입력하면 한글자씩 내가 입력한 글자 보이는 기능 구현해줌ㅇㅇ
// 기본 내보내기(export default) → 다른 파일에서 import 가능
export default function LoginScreen({ navigation }) { 
  // navigation: App.js의 Stack.Navigator에서 자동으로 전달되는 네비게이션 객체

  const [email, setEmail] = useState("");      // 이메일 입력값 상태
  const [password, setPassword] = useState(""); // 비밀번호 입력값 상태

  const handleLogin = () => {
    // 로그인 처리 로직 (Firebase 연동 가능)
    navigation.replace("Home"); // 로그인 성공 시 Home 화면으로 이동
  };

  return (
    <View style={styles.container}> 
      {/* 화면 전체 컨테이너 */}
      
      <Text style={styles.title}>로그인</Text> 
      {/* 로그인 제목 텍스트 */}

      <TextInput 
        style={styles.input} 
        placeholder="이메일"  // 입력 전 표시되는 안내문구
        value={email}        // 현재 email 상태값
        onChangeText={setEmail} // 입력이 바뀌면 setEmail로 상태 업데이트
      />

      <TextInput 
        style={styles.input}
        placeholder="비밀번호"
        secureTextEntry // 비밀번호 입력시 **** 처리
        value={password} 
        onChangeText={setPassword} // 비밀번호 입력 업데이트
      />

      <Button title="로그인" onPress={handleLogin} /> 
      {/* 로그인 버튼 클릭 시 handleLogin 실행 */}
    </View>
  );
}

// 스타일 정의
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 }, // 화면 가운데 정렬 + 여백
  title: { fontSize: 24, textAlign: "center", marginBottom: 20 }, // 큰 글씨 제목
  input: { borderWidth: 1, marginBottom: 10, padding: 8, borderRadius: 5 } // 입력창 스타일
});
