import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DATABASE_NAME, initializeDatabase } from '../src/db/client';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={initializeDatabase}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#fafafa' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="search"
            options={{
              animation: 'slide_from_bottom',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="add-hotel"
            options={{
              animation: 'slide_from_bottom',
              presentation: 'modal',
            }}
          />
          <Stack.Screen name="hotel/[id]" />
          <Stack.Screen
            name="rating/[hotelId]"
            options={{
              animation: 'slide_from_bottom',
              presentation: 'fullScreenModal',
            }}
          />
        </Stack>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}
