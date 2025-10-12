import React from "react"; // React 불러오기
import { NavigationContainer } from "@react-navigation/native"; // 네비게이션 컨테이너
import { createStackNavigator } from "@react-navigation/stack"; // Stack 네비게이션 생성

import LoginScreen from "./LoginScreen"; // 로그인 화면 가져오기
import HomeScreen from "./HomeScreen";   // 홈 화면 가져오기

const Stack = createStackNavigator(); // Stack Navigator 객체 생성

// 앱의 진입점 컴포넌트
export default function App() {
  return (
    <NavigationContainer> 
      {/* 네비게이션 상태를 관리하는 최상위 컨테이너 */}
      
      <Stack.Navigator initialRouteName="Login"> 
        {/* 스택 네비게이터 설정, 첫 화면을 Login으로 지정 */}
        
        <Stack.Screen name="Login" component={LoginScreen} /> 
        {/* "Login" 이라는 이름의 화면 = LoginScreen 컴포넌트 */}
        
        <Stack.Screen name="Home" component={HomeScreen} /> 
        {/* "Home" 이라는 이름의 화면 = HomeScreen 컴포넌트 */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
