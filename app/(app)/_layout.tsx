import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="menu" />
      <Stack.Screen name="menu_parceiro" />
      <Stack.Screen name="order" />
      <Stack.Screen name="order_parceiro" />
      <Stack.Screen name="map" />
      <Stack.Screen name="map_parceiro" />
      <Stack.Screen name="video" />
      <Stack.Screen name="video_parceiro" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="profile_parceiro" />
      <Stack.Screen name="address_register" />
    </Stack>
  );
}