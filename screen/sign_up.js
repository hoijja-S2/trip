import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert,
  Platform, StyleSheet, KeyboardAvoidingView, TouchableOpacity,
  Keyboard, TouchableWithoutFeedback } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigation } from "@react-navigation/native";

export default function Sign_upScreen() {
  const [email, setEmail] = useState(""); 
  const [passwordF, setPasswordF] = useState("");
  const [passwordR, setPasswordR] = useState("");
  const navigation = useNavigation();

  const handleEmail = () => {
    if (!email) {
      Alert.alert("이메일 입력", "이메일을 입력해 주세요.");
      return;
    }
    Alert.alert("중복 확인", "사용 가능한 이메일 입니다.");
  };
  const handlePS = async () => {
    if (passwordF !== passwordR) {
      Alert.alert("가입 실패", "비밀 번호 불일치");
      return;
    }

    if (password)
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert("회원가입 성공!", "이제 로그인하세요");
      navigation.navigate("Login");
    } catch (error) {
      Alert.alert("회원가입 실패", error.message);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}
    accessible={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "android" ? "padding" : "height"}
        keyboardVerticalOffset={-20}>  
        <Text style={styles.title}>Sign Up</Text>
        <TextInput
          style={styles.inputID}
          placeholder="ID(e-mail)"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"/>
        <TextInput
          style={styles.inputPS1}
          placeholder="Password"
          secureTextEntry
          value={passwordF}
          onChangeText={setPasswordF}/>
        <TextInput
          style={styles.inputPS2}
          placeholder="Password"
          secureTextEntry
          value={passwordR}
          onChangeText={setPasswordR}/>  
        <TouchableOpacity style = {styles.Button} onPress = {handlePS}>
          <Text style = {styles.buttonText}>가입하기</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>  
    </TouchableWithoutFeedback>  
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
  },
  Button: {
    backgroundColor: '#1da4ff7f',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginLeft: 60,
    marginRight: 60
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  inputID: { 
    paddingHorizontal: 15,
    fontSize: 20,
    marginTop: 50,
    marginLeft: 50,
    marginRight: 50,
    marginBottom: 10,
    borderRadius: 8,
    height: 60,
    textAlignVertical: 'center',
    backgroundColor: 'white'
  },
  inputPS1: {
    paddingHorizontal: 15,
    fontSize: 20,
    marginLeft: 50,
    marginRight: 50,
    marginBottom: 10,
    borderRadius: 8,
    height: 60,
    textAlignVertical: 'center',
    backgroundColor: 'white'
  },
  inputPS2: {
    paddingHorizontal: 15,
    fontSize: 20,
    marginLeft: 50,
    marginRight: 50,
    marginBottom: 10,
    borderRadius: 8,
    height: 60,
    textAlignVertical: 'center',
    backgroundColor: 'white'
  },
});
