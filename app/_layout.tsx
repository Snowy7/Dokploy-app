import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { notificationService } from '../src/services/notifications';
import { theme } from '../src/theme';

function useProtectedRoute(isAuthenticated: boolean, isInitialized: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === 'login';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/');
    }
  }, [isAuthenticated, segments, isInitialized]);
}

export default function RootLayout() {
  const { isAuthenticated, loadUser, isLoading } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useProtectedRoute(isAuthenticated, isInitialized);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await loadUser();

      const token = await notificationService.registerForPushNotifications();
      if (token) {
        console.log('Push notification token:', token);
      }

      notificationService.addNotificationReceivedListener((notification) => {
        console.log('Notification received:', notification);
      });

      notificationService.addNotificationResponseReceivedListener((response) => {
        console.log('Notification tapped:', response);
      });

      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setIsInitialized(true);
    }
  };

  if (!isInitialized || isLoading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.textPrimary,
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="project/[id]" options={{ title: 'Project Details' }} />
        <Stack.Screen name="application/[id]" options={{ title: 'Application Details' }} />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
