import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { useContainerStore } from '../stores/containerStore';
import { DockerContainer } from '../types';
import { formatDistanceToNow } from 'date-fns';

export const ContainersScreen = ({ navigation }: any) => {
  const { containers, fetchContainers, restartContainer, isLoading } = useContainerStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchContainers();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchContainers();
    setRefreshing(false);
  };

  const handleRestartContainer = async (containerId: string, containerName: string) => {
    Alert.alert(
      'Restart Container',
      `Are you sure you want to restart ${containerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restart',
          style: 'destructive',
          onPress: async () => {
            try {
              await restartContainer(containerId);
              Alert.alert('Success', 'Container restarted successfully');
              await fetchContainers();
            } catch (error) {
              Alert.alert('Error', 'Failed to restart container');
            }
          },
        },
      ]
    );
  };

  const getContainerStatus = (state: string): any => {
    if (state === 'running') return 'running';
    if (state === 'exited') return 'error';
    return 'idle';
  };

  const renderContainerCard = ({ item: container }: { item: DockerContainer }) => {
    const containerName = container.Names[0]?.replace('/', '') || container.Id.substring(0, 12);

    return (
      <Card style={styles.containerCard} elevated>
        <View style={styles.containerHeader}>
          <View style={styles.containerIcon}>
            <Ionicons
              name={container.State === 'running' ? 'cube' : 'cube-outline'}
              size={24}
              color={container.State === 'running' ? theme.colors.success : theme.colors.textTertiary}
            />
          </View>
          <View style={styles.containerInfo}>
            <Text style={styles.containerName}>{containerName}</Text>
            <Text style={styles.containerImage} numberOfLines={1}>
              {container.Image}
            </Text>
            <StatusBadge status={getContainerStatus(container.State)} size="small" />
          </View>
        </View>

        <View style={styles.containerFooter}>
          <Text style={styles.containerStatus}>{container.Status}</Text>
          <View style={styles.containerActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleRestartContainer(container.Id, containerName)}
            >
              <Ionicons name="refresh-outline" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('ContainerDetail', { container })}
            >
              <Ionicons name="information-circle-outline" size={20} color={theme.colors.info} />
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Containers</Text>
        <Text style={styles.count}>{containers.length} total</Text>
      </View>

      {containers.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Ionicons name="cube-outline" size={64} color={theme.colors.textTertiary} />
          <Text style={styles.emptyTitle}>No Containers</Text>
          <Text style={styles.emptyDescription}>
            No Docker containers found on this server
          </Text>
        </View>
      ) : (
        <FlatList
          data={containers}
          renderItem={renderContainerCard}
          keyExtractor={(item) => item.Id}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  count: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  list: {
    padding: theme.spacing.lg,
  },
  containerCard: {
    marginBottom: theme.spacing.md,
  },
  containerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  containerIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  containerInfo: {
    flex: 1,
  },
  containerName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  containerImage: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  containerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  containerStatus: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
    flex: 1,
  },
  containerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
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
