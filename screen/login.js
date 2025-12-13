import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert, 
  KeyboardAvoidingView, Platform, TouchableOpacity,
  Keyboard, TouchableWithoutFeedback} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigation } from "@react-navigation/native";


export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("입력 오류", "이메일과 비밀번호를 입력해주세요.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (error) {
      Alert.alert("로그인 실패", error.message);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}
    accessible={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "android" ? "padding" : "height"}
        keyboardVerticalOffset={0}>
        <Text style={styles.title}>Sign In</Text>
        <TextInput
          style={styles.inputID}
          placeholder="ID(e-mail)"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.inputPS}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          secureTextEntry={true}
          autoCorrect={false}
          autoComplete="off"
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.Button} onPress={handleLogin}>
          <Text style={styles.buttonText}>로그인</Text>
        </TouchableOpacity>
        <Text style={styles.link} onPress={() => navigation.navigate("sign_up")}>
          No account? Sign up
        </Text>
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
  titleContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: { 
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    color: '#1a1a1a',
    letterSpacing: -0.5,
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
    color: '#000000',
    backgroundColor: 'white',
  },
  inputPS: {
    paddingHorizontal: 15,
    fontSize: 20,
    marginLeft: 50,
    marginRight: 50,
    marginBottom: 10,
    borderRadius: 8,
    height: 60,
    textAlignVertical: 'center',
    color: '#000000',
    backgroundColor: 'white'
  },
  link: {
    color: "black",
    textAlign: "center",
    fontSize: 18,
    marginTop: 20,
  },
  Button: {
    backgroundColor: '#0baefe',
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
});
