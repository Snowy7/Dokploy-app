import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { Card } from '../components/Card';
import { api } from '../services/api';
import { Deployment } from '../types';
import { formatDistanceToNow } from 'date-fns';

export const DeploymentsScreen = ({ navigation }: any) => {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDeployments();
  }, []);

  const fetchDeployments = async () => {
    setIsLoading(true);
    try {
      // Note: You'll need to adjust this based on your actual deployment endpoint
      // This is a placeholder
      setDeployments([]);
    } catch (error) {
      console.error('Failed to fetch deployments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDeployments();
    setRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return 'hourglass-outline';
      case 'done':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'cancelled':
        return 'ban';
      default:
        return 'ellipse-outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return theme.colors.warning;
      case 'done':
        return theme.colors.success;
      case 'error':
        return theme.colors.error;
      case 'cancelled':
        return theme.colors.textTertiary;
      default:
        return theme.colors.textTertiary;
    }
  };

  const renderDeploymentCard = ({ item: deployment }: { item: Deployment }) => (
    <Card style={styles.deploymentCard} elevated>
      <View style={styles.deploymentHeader}>
        <View style={[styles.statusIcon, { backgroundColor: getStatusColor(deployment.status) + '20' }]}>
          <Ionicons name={getStatusIcon(deployment.status) as any} size={24} color={getStatusColor(deployment.status)} />
        </View>
        <View style={styles.deploymentInfo}>
          <Text style={styles.deploymentTitle}>{deployment.title || 'Deployment'}</Text>
          {deployment.description && (
            <Text style={styles.deploymentDescription} numberOfLines={2}>
              {deployment.description}
            </Text>
          )}
          <Text style={styles.deploymentTime}>
            {formatDistanceToNow(new Date(deployment.createdAt), { addSuffix: true })}
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Deployments</Text>
      </View>

      {deployments.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Ionicons name="rocket-outline" size={64} color={theme.colors.textTertiary} />
          <Text style={styles.emptyTitle}>No Deployments</Text>
          <Text style={styles.emptyDescription}>
            Deploy an application to see deployment history here
          </Text>
        </View>
      ) : (
        <FlatList
          data={deployments}
          renderItem={renderDeploymentCard}
          keyExtractor={(item) => item.deploymentId}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  list: {
    padding: theme.spacing.lg,
  },
  deploymentCard: {
    marginBottom: theme.spacing.md,
  },
  deploymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  deploymentInfo: {
    flex: 1,
  },
  deploymentTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  deploymentDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  deploymentTime: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyDescription: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
