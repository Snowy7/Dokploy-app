import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { LoginScreen } from './src/screens/LoginScreen';
import { useAuthStore } from './src/stores/authStore';
import { notificationService } from './src/services/notifications';
import { theme } from './src/theme';

export default function App() {
  const { isAuthenticated, loadUser, isLoading } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Load user from secure storage
      await loadUser();

      // Register for push notifications
      const token = await notificationService.registerForPushNotifications();
      if (token) {
        console.log('Push notification token:', token);
        // TODO: Send token to backend
      }

      // Set up notification listeners
      const receivedListener = notificationService.addNotificationReceivedListener((notification) => {
        console.log('Notification received:', notification);
      });

      const responseListener = notificationService.addNotificationResponseReceivedListener((response) => {
        console.log('Notification tapped:', response);
        // TODO: Navigate to appropriate screen based on notification data
      });

      setIsInitialized(true);

      return () => {
        receivedListener.remove();
        responseListener.remove();
      };
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setIsInitialized(true);
    }
  };

  if (!isInitialized || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {isAuthenticated ? <AppNavigator /> : <LoginScreen />}
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
