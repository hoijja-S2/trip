// App.js
import React, {useState, useEffect} from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";

// 네가 작성한 화면 파일 불러오기
import LoginScreen from "./screen/login";
import HomeScreen from "./screen/home";
import WriteDiaryScreen from "./screen/writediary";
import Sign_upScreen from "./screen/sign_up";
import DiaryListScreen from "./screen/diarylist";
import DiaryDetailScreen from "./screen/diarydetail";
import NewPlanScreen from "./screen/newplan";

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
      },[]);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }} // 홈 화면은 헤더 숨김
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="writediary" 
          component={WriteDiaryScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="sign_up"
          component={Sign_upScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="diarylist"
          component={DiaryListScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="diarydetail"
          component={DiaryDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="newplan"
          component={NewPlanScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
