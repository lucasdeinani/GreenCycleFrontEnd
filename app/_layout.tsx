import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { 
  useFonts, Roboto_400Regular, Roboto_500Medium, Roboto_700Bold 
} from '@expo-google-fonts/roboto';
import { SplashScreen } from 'expo-router';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import React from 'react';
import { UserProvider } from './context/UserContext';
import { ActionSheetProvider } from '@expo/react-native-action-sheet'; 


// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const [fontsLoaded, fontError] = useFonts({
    'Roboto-Regular': Roboto_400Regular,
    'Roboto-Medium': Roboto_500Medium,
    'Roboto-Bold': Roboto_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    window?.frameworkReady?.();
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ActionSheetProvider>
      <UserProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="light" />
      </UserProvider>
    </ActionSheetProvider>
  );
}