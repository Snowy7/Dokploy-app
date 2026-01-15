import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { Card } from './Card';
import { Button } from './Button';
import { TextInput } from './TextInput';
import { ApiKeyConfig } from '../types/credentials';
import { useAuthStore } from '../stores/authStore';
import { formatDistanceToNow } from 'date-fns';

interface ApiKeyManagerProps {
  apiKeys: ApiKeyConfig[];
  activeKeyId: string | null;
  onAddKey: (name: string, apiKey: string) => Promise<void>;
  onRemoveKey: (keyId: string) => Promise<void>;
  onSwitchKey: (keyId: string) => Promise<void>;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({
  apiKeys,
  activeKeyId,
  onAddKey,
  onRemoveKey,
  onSwitchKey,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  const handleAddKey = async () => {
    if (!newKeyName.trim()) {
      setError('Please enter a name for the key');
      return;
    }
    if (!newApiKey.trim()) {
      setError('Please enter the API key');
      return;
    }

    setIsAdding(true);
    setError('');

    try {
      await onAddKey(newKeyName.trim(), newApiKey.trim());
      setShowAddModal(false);
      setNewKeyName('');
      setNewApiKey('');
    } catch (err: any) {
      setError(err.message || 'Failed to add API key');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveKey = (key: ApiKeyConfig) => {
    if (apiKeys.length <= 1) {
      Alert.alert('Cannot Remove', 'You must have at least one API key.');
      return;
    }

    Alert.alert(
      'Remove API Key',
      `Are you sure you want to remove "${key.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemoveKey(key.id),
        },
      ]
    );
  };

  const handleSwitchKey = async (key: ApiKeyConfig) => {
    if (key.id === activeKeyId) return;

    try {
      await onSwitchKey(key.id);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to switch API key');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>API Keys</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.keyList}>
        {apiKeys.map((key) => {
          const isActive = key.id === activeKeyId;
          return (
            <Card
              key={key.id}
              style={[styles.keyCard, isActive && styles.keyCardActive]}
              onPress={() => handleSwitchKey(key)}
            >
              <View style={styles.keyContent}>
                <View style={styles.keyInfo}>
                  <View style={styles.keyHeader}>
                    <Text style={styles.keyName}>{key.name}</Text>
                    {isActive && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>Active</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.keyMeta}>
                    Added {formatDistanceToNow(new Date(key.createdAt), { addSuffix: true })}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveKey(key)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={theme.colors.error}
                  />
                </TouchableOpacity>
              </View>
            </Card>
          );
        })}
      </View>

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add API Key</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <TextInput
              label="Name"
              value={newKeyName}
              onChangeText={setNewKeyName}
              placeholder="e.g., Production, Personal"
              autoCapitalize="words"
            />

            <TextInput
              label="API Key"
              value={newApiKey}
              onChangeText={setNewApiKey}
              placeholder="Enter your API key"
              secureTextEntry
              autoCapitalize="none"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowAddModal(false)}
                variant="secondary"
                style={styles.modalButton}
              />
              <Button
                title="Add Key"
                onPress={handleAddKey}
                loading={isAdding}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyList: {
    gap: theme.spacing.sm,
  },
  keyCard: {
    padding: theme.spacing.md,
  },
  keyCardActive: {
    borderColor: theme.colors.primary,
  },
  keyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  keyInfo: {
    flex: 1,
  },
  keyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  keyName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  activeBadge: {
    backgroundColor: theme.colors.primaryMuted,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  activeBadgeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  keyMeta: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.errorMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  errorText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
    marginTop: theme.spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  modalButton: {
    flex: 1,
  },
});
