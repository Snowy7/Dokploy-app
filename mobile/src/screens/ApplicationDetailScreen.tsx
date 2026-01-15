import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { useApplicationStore } from '../stores/applicationStore';
import { Application } from '../types';

export const ApplicationDetailScreen = ({ route, navigation }: any) => {
  const { applicationId } = route.params;
  const {
    selectedApplication,
    fetchApplication,
    deployApplication,
    redeployApplication,
    startApplication,
    stopApplication,
    deleteApplication,
    isLoading,
  } = useApplicationStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadApplication();
  }, [applicationId]);

  const loadApplication = async () => {
    await fetchApplication(applicationId);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadApplication();
    setRefreshing(false);
  };

  const handleDeploy = async () => {
    try {
      await deployApplication(applicationId);
      Alert.alert('Success', 'Application deployment started');
      await loadApplication();
    } catch (error) {
      Alert.alert('Error', 'Failed to deploy application');
    }
  };

  const handleRedeploy = async () => {
    Alert.alert(
      'Redeploy Application',
      'Are you sure you want to redeploy this application?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeploy',
          onPress: async () => {
            try {
              await redeployApplication(applicationId);
              Alert.alert('Success', 'Application redeployment started');
              await loadApplication();
            } catch (error) {
              Alert.alert('Error', 'Failed to redeploy application');
            }
          },
        },
      ]
    );
  };

  const handleStart = async () => {
    try {
      await startApplication(applicationId);
      Alert.alert('Success', 'Application started');
      await loadApplication();
    } catch (error) {
      Alert.alert('Error', 'Failed to start application');
    }
  };

  const handleStop = async () => {
    Alert.alert(
      'Stop Application',
      'Are you sure you want to stop this application?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            try {
              await stopApplication(applicationId);
              Alert.alert('Success', 'Application stopped');
              await loadApplication();
            } catch (error) {
              Alert.alert('Error', 'Failed to stop application');
            }
          },
        },
      ]
    );
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Application',
      'Are you sure you want to delete this application? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteApplication(applicationId);
              Alert.alert('Success', 'Application deleted');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete application');
            }
          },
        },
      ]
    );
  };

  if (!selectedApplication) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        <Card style={styles.headerCard} elevated>
          <View style={styles.headerContent}>
            <View style={styles.appIcon}>
              <Ionicons name="rocket" size={32} color={theme.colors.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.appName}>{selectedApplication.name}</Text>
              <Text style={styles.appAppName}>{selectedApplication.appName}</Text>
              {selectedApplication.description && (
                <Text style={styles.appDescription}>{selectedApplication.description}</Text>
              )}
              <StatusBadge status={selectedApplication.applicationStatus} />
            </View>
          </View>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <Card>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Build Type</Text>
              <Text style={styles.detailValue}>{selectedApplication.buildType}</Text>
            </View>
            {selectedApplication.sourceType && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Source</Text>
                <Text style={styles.detailValue}>{selectedApplication.sourceType}</Text>
              </View>
            )}
            {selectedApplication.repository && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Repository</Text>
                <Text style={styles.detailValue}>{selectedApplication.repository}</Text>
              </View>
            )}
            {selectedApplication.branch && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Branch</Text>
                <Text style={styles.detailValue}>{selectedApplication.branch}</Text>
              </View>
            )}
          </Card>
        </View>

        {(selectedApplication.memoryLimit || selectedApplication.cpuLimit) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resources</Text>
            <Card>
              {selectedApplication.memoryLimit && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Memory Limit</Text>
                  <Text style={styles.detailValue}>{selectedApplication.memoryLimit}</Text>
                </View>
              )}
              {selectedApplication.cpuLimit && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>CPU Limit</Text>
                  <Text style={styles.detailValue}>{selectedApplication.cpuLimit}</Text>
                </View>
              )}
            </Card>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actionsGrid}>
            <Button
              title="Deploy"
              onPress={handleDeploy}
              loading={isLoading}
              variant="primary"
              icon={<Ionicons name="rocket-outline" size={18} color={theme.colors.textPrimary} />}
            />
            <Button
              title="Redeploy"
              onPress={handleRedeploy}
              loading={isLoading}
              variant="secondary"
              icon={<Ionicons name="refresh-outline" size={18} color={theme.colors.textPrimary} />}
            />
          </View>
          <View style={styles.actionsGrid}>
            <Button
              title="Start"
              onPress={handleStart}
              loading={isLoading}
              variant="success"
              icon={<Ionicons name="play-outline" size={18} color={theme.colors.textPrimary} />}
            />
            <Button
              title="Stop"
              onPress={handleStop}
              loading={isLoading}
              variant="danger"
              icon={<Ionicons name="stop-outline" size={18} color={theme.colors.textPrimary} />}
            />
          </View>
          <Button
            title="Delete Application"
            onPress={handleDelete}
            loading={isLoading}
            variant="danger"
            fullWidth
            icon={<Ionicons name="trash-outline" size={18} color={theme.colors.textPrimary} />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  headerCard: {
    marginBottom: theme.spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  headerText: {
    flex: 1,
  },
  appName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  appAppName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  appDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  detailLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  detailValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.medium,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
});
