import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { theme } from '../src/theme';
import { TextInput } from '../src/components/TextInput';
import { Button } from '../src/components/Button';
import { useAuthStore } from '../src/stores/authStore';

const ENV_SERVER_URL =
  Constants.expoConfig?.extra?.dokployServerUrl ||
  process.env.EXPO_PUBLIC_DOKPLOY_SERVER_URL ||
  '';
const ENV_API_KEY =
  Constants.expoConfig?.extra?.dokployApiKey ||
  process.env.EXPO_PUBLIC_DOKPLOY_API_KEY ||
  '';

export default function LoginScreen() {
  const [serverUrl, setServerUrl] = useState(ENV_SERVER_URL);
  const [apiKey, setApiKey] = useState(ENV_API_KEY);
  const [keyName, setKeyName] = useState('Default');
  const [serverError, setServerError] = useState('');
  const [apiKeyError, setApiKeyError] = useState('');
  const [hasTriedAutoConnect, setHasTriedAutoConnect] = useState(false);

  const { connect, isLoading } = useAuthStore();

  useEffect(() => {
    const tryAutoConnect = async () => {
      if (ENV_SERVER_URL && ENV_API_KEY && !hasTriedAutoConnect) {
        setHasTriedAutoConnect(true);
        try {
          await connect(ENV_SERVER_URL, ENV_API_KEY, 'Default');
        } catch (err) {
          console.log('Auto-connect failed, showing login form');
        }
      }
    };
    tryAutoConnect();
  }, []);

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleConnect = async () => {
    setServerError('');
    setApiKeyError('');

    if (!serverUrl) {
      setServerError('Server URL is required');
      return;
    }

    if (!validateUrl(serverUrl)) {
      setServerError('Invalid URL format');
      return;
    }

    if (!apiKey) {
      setApiKeyError('API key is required');
      return;
    }

    if (apiKey.length < 10) {
      setApiKeyError('API key seems too short');
      return;
    }

    try {
      await connect(serverUrl, apiKey, keyName || 'Default');
    } catch (err: any) {
      let message = 'Unable to connect. Check your server URL and API key.';

      if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        message = 'Invalid API key';
      } else if (err.response?.status === 404) {
        message = 'Server not found';
      } else if (err.message) {
        message = err.message;
      }

      Alert.alert('Connection Failed', message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="cube" size={40} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>Dokploy</Text>
            <Text style={styles.subtitle}>Connect to your server</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Server URL"
              value={serverUrl}
              onChangeText={(text) => {
                setServerUrl(text);
                setServerError('');
              }}
              placeholder="https://dokploy.example.com"
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              error={serverError}
              icon={
                <Ionicons
                  name="server-outline"
                  size={18}
                  color={theme.colors.textTertiary}
                />
              }
            />

            <TextInput
              label="API Key"
              value={apiKey}
              onChangeText={(text) => {
                setApiKey(text);
                setApiKeyError('');
              }}
              placeholder="Enter your API key"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              error={apiKeyError}
              icon={
                <Ionicons
                  name="key-outline"
                  size={18}
                  color={theme.colors.textTertiary}
                />
              }
            />

            <TextInput
              label="Key Name (Optional)"
              value={keyName}
              onChangeText={setKeyName}
              placeholder="e.g., Production, Personal"
              autoCapitalize="words"
              icon={
                <Ionicons
                  name="pricetag-outline"
                  size={18}
                  color={theme.colors.textTertiary}
                />
              }
            />

            <Button
              title="Connect"
              onPress={handleConnect}
              loading={isLoading}
              fullWidth
              size="large"
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Find your API key in Dokploy Settings → API
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: theme.spacing.xl,
  },
  footer: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  footerText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
});
