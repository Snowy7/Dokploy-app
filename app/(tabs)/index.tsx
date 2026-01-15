import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../../src/theme';
import { Card } from '../../src/components/Card';
import { useAuthStore } from '../../src/stores/authStore';
import { useProjectStore } from '../../src/stores/projectStore';
import { useContainerStore } from '../../src/stores/containerStore';
import { api } from '../../src/services/api';
import { SystemStats, Application } from '../../src/types';

// Swarm node from /swarm.getNodes API (different from full SwarmNode type)
interface SwarmNodeSimple {
  ID: string;
  Hostname: string;
  Status: string;
  Availability: string;
  ManagerStatus: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, apiKeys, activeKeyId } = useAuthStore();
  const { projects, fetchProjects } = useProjectStore();
  const { containers, fetchContainers } = useContainerStore();
  const [refreshing, setRefreshing] = useState(false);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [swarmNodes, setSwarmNodes] = useState<SwarmNodeSimple[]>([]);
  const [recentApps, setRecentApps] = useState<Application[]>([]);

  const activeKey = apiKeys.find((k) => k.id === activeKeyId);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchProjects(),
      fetchContainers(),
      fetchSystemStats(),
      fetchSwarmNodes(),
      fetchRecentApplications(),
    ]);
  };

  const fetchSystemStats = async () => {
    try {
      const stats = await api.get<SystemStats>('/settings.getSystemStats');
      setSystemStats(stats);
    } catch (error) {
      // System stats might not be available
    }
  };

  const fetchSwarmNodes = async () => {
    try {
      const nodes = await api.get<SwarmNodeSimple[]>('/swarm.getNodes');
      setSwarmNodes(Array.isArray(nodes) ? nodes : []);
    } catch (error) {
      setSwarmNodes([]);
    }
  };

  const fetchRecentApplications = async () => {
    try {
      const apps = await api.get<Application[]>('/application.all');
      const appsList = Array.isArray(apps) ? apps : [];
      // Sort by createdAt and take most recent 5
      const sorted = appsList
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      setRecentApps(sorted);
    } catch (error) {
      setRecentApps([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Container stats
  const validContainers = containers.filter((c) => c && c.containerId);
  const runningContainers = validContainers.filter((c) => c.state === 'running').length;
  const stoppedContainers = validContainers.length - runningContainers;

  // Swarm stats - Status is a string directly from /swarm.getNodes API
  const readyNodes = swarmNodes.filter((n) => n.Status?.toLowerCase() === 'ready').length;

  // Running apps
  const runningApps = recentApps.filter((a) => a.applicationStatus === 'running').length;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return theme.colors.success;
      case 'done':
        return theme.colors.success;
      case 'error':
        return theme.colors.error;
      default:
        return theme.colors.textTertiary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.userName}>{user?.email?.split('@')[0] || 'User'}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="person" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Active Key */}
        {activeKey && (
          <View style={styles.keyBadge}>
            <Ionicons name="key" size={10} color={theme.colors.primary} />
            <Text style={styles.keyBadgeText}>{activeKey.name}</Text>
          </View>
        )}

        {/* System Stats */}
        {systemStats && (
          <Card style={styles.systemCard}>
            <View style={styles.systemHeader}>
              <Text style={styles.systemTitle}>System Monitor</Text>
              <View
                style={[
                  styles.serverStatus,
                  { backgroundColor: theme.colors.successMuted },
                ]}
              >
                <View style={styles.serverDot} />
                <Text style={styles.serverText}>Online</Text>
              </View>
            </View>
            <View style={styles.systemStats}>
              <View style={styles.systemStatItem}>
                <View style={styles.statHeader}>
                  <Ionicons name="speedometer-outline" size={14} color={theme.colors.info} />
                  <Text style={styles.statLabel}>CPU</Text>
                </View>
                <Text style={styles.statPercent}>{systemStats.cpu?.usage?.toFixed(1) || 0}%</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${systemStats.cpu?.usage || 0}%`,
                        backgroundColor: theme.colors.info,
                      },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.systemStatItem}>
                <View style={styles.statHeader}>
                  <Ionicons name="hardware-chip-outline" size={14} color={theme.colors.warning} />
                  <Text style={styles.statLabel}>Memory</Text>
                </View>
                <Text style={styles.statPercent}>{systemStats.memory?.percentage?.toFixed(1) || 0}%</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${systemStats.memory?.percentage || 0}%`,
                        backgroundColor: theme.colors.warning,
                      },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.systemStatItem}>
                <View style={styles.statHeader}>
                  <Ionicons name="server-outline" size={14} color={theme.colors.primary} />
                  <Text style={styles.statLabel}>Disk</Text>
                </View>
                <Text style={styles.statPercent}>{systemStats.disk?.percentage?.toFixed(1) || 0}%</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${systemStats.disk?.percentage || 0}%`,
                        backgroundColor: theme.colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </Card>
        )}

        {/* Quick Stats Row - Compact */}
        <View style={styles.quickStats}>
          <TouchableOpacity
            style={styles.quickStatCard}
            onPress={() => router.push('/projects')}
          >
            <View style={[styles.quickStatIcon, { backgroundColor: theme.colors.primaryMuted }]}>
              <Ionicons name="folder" size={16} color={theme.colors.primary} />
            </View>
            <Text style={styles.quickStatValue}>{projects.length}</Text>
            <Text style={styles.quickStatLabel}>Projects</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickStatCard}
            onPress={() => router.push('/containers')}
          >
            <View style={[styles.quickStatIcon, { backgroundColor: theme.colors.successMuted }]}>
              <Ionicons name="cube" size={16} color={theme.colors.success} />
            </View>
            <Text style={styles.quickStatValue}>
              {runningContainers}
              <Text style={styles.quickStatTotal}>/{validContainers.length}</Text>
            </Text>
            <Text style={styles.quickStatLabel}>Containers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickStatCard}
            onPress={() => router.push('/swarms')}
          >
            <View style={[styles.quickStatIcon, { backgroundColor: theme.colors.infoMuted }]}>
              <Ionicons name="git-network" size={16} color={theme.colors.info} />
            </View>
            <Text style={styles.quickStatValue}>
              {readyNodes}
              <Text style={styles.quickStatTotal}>/{swarmNodes.length}</Text>
            </Text>
            <Text style={styles.quickStatLabel}>Nodes</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Applications */}
        {recentApps.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Applications</Text>
              <TouchableOpacity onPress={() => router.push('/projects')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <Card style={styles.appsCard}>
              {recentApps.map((app, index) => (
                <TouchableOpacity
                  key={app.applicationId}
                  style={[
                    styles.appItem,
                    index < recentApps.length - 1 && styles.appItemBorder,
                  ]}
                  onPress={() => router.push(`/application/${app.applicationId}`)}
                >
                  <View
                    style={[
                      styles.appStatus,
                      { backgroundColor: getStatusColor(app.applicationStatus) },
                    ]}
                  />
                  <View style={styles.appInfo}>
                    <Text style={styles.appName} numberOfLines={1}>
                      {app.name}
                    </Text>
                    <Text style={styles.appMeta} numberOfLines={1}>
                      {app.buildType} · {app.sourceType || 'docker'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.appStatusBadge,
                      {
                        backgroundColor:
                          getStatusColor(app.applicationStatus) + '15',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.appStatusText,
                        { color: getStatusColor(app.applicationStatus) },
                      ]}
                    >
                      {app.applicationStatus}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </Card>
          </>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/projects')}
          >
            <Ionicons name="folder-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.actionText}>Projects</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/containers')}
          >
            <Ionicons name="cube-outline" size={20} color={theme.colors.info} />
            <Text style={styles.actionText}>Containers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/swarms')}
          >
            <Ionicons name="git-network-outline" size={20} color={theme.colors.success} />
            <Text style={styles.actionText}>Swarm</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={20} color={theme.colors.warning} />
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
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
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  headerLeft: {},
  greeting: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  userName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: theme.colors.primaryMuted,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
  },
  keyBadgeText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  systemCard: {
    marginBottom: theme.spacing.md,
  },
  systemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  systemTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  serverStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
  },
  serverDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.success,
  },
  serverText: {
    fontSize: 10,
    color: theme.colors.success,
    fontWeight: theme.fontWeight.medium,
  },
  systemStats: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  systemStatItem: {
    flex: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: theme.colors.textTertiary,
  },
  statPercent: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  quickStats: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  quickStatIcon: {
    width: 28,
    height: 28,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  quickStatTotal: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.normal,
    color: theme.colors.textTertiary,
  },
  quickStatLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  seeAll: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  appsCard: {
    marginBottom: theme.spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  appItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  appStatus: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: theme.spacing.sm,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  appMeta: {
    fontSize: 10,
    color: theme.colors.textTertiary,
  },
  appStatusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  appStatusText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.medium,
    textTransform: 'capitalize',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  actionCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  actionText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
});
