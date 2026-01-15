import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/theme';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { ApiKeyManager } from '../../src/components/ApiKeyManager';
import { useAuthStore } from '../../src/stores/authStore';

export default function SettingsScreen() {
  const {
    user,
    logout,
    apiKeys,
    activeKeyId,
    serverUrl,
    addApiKey,
    removeApiKey,
    switchApiKey,
  } = useAuthStore();

  const activeKey = apiKeys.find((k) => k.id === activeKeyId);

  const handleLogout = () => {
    Alert.alert('Disconnect', 'Are you sure you want to disconnect?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={theme.colors.primary} />
          </View>
          <Text style={styles.userName}>{user?.email || 'User'}</Text>
          {activeKey && (
            <View style={styles.activeKeyBadge}>
              <Ionicons
                name="key"
                size={12}
                color={theme.colors.primary}
              />
              <Text style={styles.activeKeyText}>{activeKey.name}</Text>
            </View>
          )}
        </View>

        {/* Server Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection</Text>
          <Card>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="server-outline"
                  size={18}
                  color={theme.colors.textSecondary}
                />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Server</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {serverUrl?.replace('/api', '') || 'Not connected'}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* API Keys Manager */}
        <ApiKeyManager
          apiKeys={apiKeys}
          activeKeyId={activeKeyId}
          onAddKey={addApiKey}
          onRemoveKey={removeApiKey}
          onSwitchKey={switchApiKey}
        />

        {/* Settings Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <Card>
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Ionicons
                    name="notifications-outline"
                    size={18}
                    color={theme.colors.textSecondary}
                  />
                </View>
                <Text style={styles.settingLabel}>Notifications</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.colors.textTertiary}
              />
            </TouchableOpacity>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Card>
            <View style={[styles.settingItem, styles.settingItemBorder]}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color={theme.colors.textSecondary}
                  />
                </View>
                <Text style={styles.settingLabel}>Version</Text>
              </View>
              <Text style={styles.settingValue}>1.0.0</Text>
            </View>
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color={theme.colors.textSecondary}
                  />
                </View>
                <Text style={styles.settingLabel}>Documentation</Text>
              </View>
              <Ionicons
                name="open-outline"
                size={18}
                color={theme.colors.textTertiary}
              />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Logout */}
        <View style={styles.logoutSection}>
          <Button
            title="Disconnect"
            onPress={handleLogout}
            variant="danger"
            fullWidth
            icon={
              <Ionicons
                name="log-out-outline"
                size={18}
                color={theme.colors.textPrimary}
              />
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  userName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  activeKeyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.primaryMuted,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  activeKeyText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  section: {
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textTertiary,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  settingLabel: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
  },
  settingValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  logoutSection: {
    marginTop: theme.spacing.xxl,
  },
});
