import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../../src/theme';
import { Card } from '../../src/components/Card';
import { StatusBadge } from '../../src/components/StatusBadge';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { EmptyState } from '../../src/components/EmptyState';
import { useContainerStore, ServiceType } from '../../src/stores/containerStore';
import { DockerContainer } from '../../src/types';
import { api } from '../../src/services/api';

interface AppInfo {
  id: string;
  name: string;
  appName: string;
  type: ServiceType;
  projectId?: string;
  projectName?: string;
  domains?: Array<{ host: string; https: boolean }>;
}

export default function ContainersScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { containers, fetchContainers, restartContainer, stopService, startService, isLoading } =
    useContainerStore();
  const [refreshing, setRefreshing] = useState(false);
  const [appMap, setAppMap] = useState<Map<string, AppInfo>>(new Map());

  const numColumns = width >= 768 ? 2 : 1;
  const cardWidth =
    width >= 768 ? (width - theme.spacing.lg * 3) / 2 : width - theme.spacing.lg * 2;

  // Filter out invalid containers (missing required properties)
  const validContainers = containers.filter(
    (c) => c && c.containerId && c.name
  );

  const runningCount = validContainers.filter((c) => c.state === 'running').length;
  const stoppedCount = validContainers.length - runningCount;

  useEffect(() => {
    fetchContainers();
    fetchAppMap();
  }, []);

  const fetchAppMap = async () => {
    try {
      const projectsRes = await api.get<any[]>('/project.all').catch(() => []);
      const projects = Array.isArray(projectsRes) ? projectsRes : [];

      const map = new Map<string, AppInfo>();

      projects.forEach((project: any) => {
        project.environments?.forEach((env: any) => {
          // Applications
          env.applications?.forEach((app: any) => {
            if (app.appName) {
              map.set(app.appName.toLowerCase(), {
                id: app.applicationId,
                name: app.name,
                appName: app.appName,
                type: 'application',
                projectId: project.projectId,
                projectName: project.name,
                domains: app.domains?.map((d: any) => ({ host: d.host, https: d.https })) || [],
              });
            }
          });

          // Compose services
          env.compose?.forEach((comp: any) => {
            if (comp.appName) {
              map.set(comp.appName.toLowerCase(), {
                id: comp.composeId,
                name: comp.name,
                appName: comp.appName,
                type: 'compose',
                projectId: project.projectId,
                projectName: project.name,
                domains: comp.domains?.map((d: any) => ({ host: d.host, https: d.https })) || [],
              });
            }
          });

          // Databases
          const dbTypes = [
            { key: 'postgres', idKey: 'postgresId' },
            { key: 'mysql', idKey: 'mysqlId' },
            { key: 'mariadb', idKey: 'mariadbId' },
            { key: 'mongo', idKey: 'mongoId' },
            { key: 'redis', idKey: 'redisId' },
          ];

          dbTypes.forEach(({ key, idKey }) => {
            env[key]?.forEach((db: any) => {
              if (db.appName) {
                map.set(db.appName.toLowerCase(), {
                  id: db[idKey],
                  name: db.name,
                  appName: db.appName,
                  type: key as ServiceType,
                  projectId: project.projectId,
                  projectName: project.name,
                });
              }
            });
          });
        });
      });

      setAppMap(map);
    } catch (error) {
      console.error('Failed to fetch app map:', error);
    }
  };

  const findAppForContainer = (containerName: string): AppInfo | null => {
    // Remove leading slash if present
    const name = containerName.startsWith('/') ? containerName.substring(1) : containerName;

    // Try exact match first (lowercase)
    const lowerName = name.toLowerCase();
    if (appMap.has(lowerName)) {
      return appMap.get(lowerName)!;
    }

    // Try matching by prefix (container names often have suffixes like -1, .1, _xxxxx)
    for (const [appName, appInfo] of appMap) {
      if (lowerName.startsWith(appName + '-') ||
          lowerName.startsWith(appName + '.') ||
          lowerName.startsWith(appName + '_') ||
          lowerName === appName) {
        return appInfo;
      }
    }

    return null;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchContainers(), fetchAppMap()]);
    setRefreshing(false);
  };

  const handleRestartContainer = async (
    containerId: string,
    containerName: string
  ) => {
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

  const handleStopService = async (appInfo: AppInfo) => {
    Alert.alert(
      'Stop Service',
      `Are you sure you want to stop ${appInfo.name}? The service will be completely stopped.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            try {
              await stopService(appInfo.id, appInfo.type);
              Alert.alert('Success', `${appInfo.name} stopped successfully`);
              await fetchContainers();
            } catch (error) {
              Alert.alert('Error', `Failed to stop ${appInfo.name}`);
            }
          },
        },
      ]
    );
  };

  const handleStartService = async (appInfo: AppInfo) => {
    Alert.alert(
      'Start Service',
      `Start ${appInfo.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            try {
              await startService(appInfo.id, appInfo.type);
              Alert.alert('Success', `${appInfo.name} started successfully`);
              await fetchContainers();
            } catch (error) {
              Alert.alert('Error', `Failed to start ${appInfo.name}`);
            }
          },
        },
      ]
    );
  };

  const handleOpenDomain = async (domain: { host: string; https: boolean }) => {
    const url = `${domain.https ? 'https' : 'http'}://${domain.host}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', `Cannot open URL: ${url}`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to open ${url}`);
    }
  };

  const handleAppPress = (appInfo: AppInfo) => {
    if (appInfo.type === 'application') {
      router.push(`/application/${appInfo.id}`);
    } else if (appInfo.type === 'compose') {
      router.push(`/compose/${appInfo.id}`);
    } else if (appInfo.projectId) {
      router.push(`/project/${appInfo.projectId}`);
    }
  };

  const getTypeIcon = (type: AppInfo['type']): string => {
    switch (type) {
      case 'application': return 'rocket';
      case 'compose': return 'layers';
      case 'postgres': return 'server';
      case 'mysql': return 'server';
      case 'mariadb': return 'server';
      case 'mongo': return 'leaf';
      case 'redis': return 'flash';
      default: return 'cube';
    }
  };

  const getTypeColor = (type: AppInfo['type']): string => {
    switch (type) {
      case 'application': return theme.colors.primary;
      case 'compose': return theme.colors.info;
      case 'postgres': return '#336791';
      case 'mysql': return '#4479A1';
      case 'mariadb': return '#003545';
      case 'mongo': return '#47A248';
      case 'redis': return '#DC382D';
      default: return theme.colors.textSecondary;
    }
  };

  const getContainerStatus = (state: string): any => {
    if (state === 'running') return 'running';
    if (state === 'exited') return 'error';
    return 'idle';
  };

  const renderContainerCard = ({
    item: container,
    index,
  }: {
    item: DockerContainer;
    index: number;
  }) => {
    // Skip rendering if container is invalid
    if (!container || !container.containerId) {
      return null;
    }

    const containerName = container.name || container.containerId.substring(0, 12);
    const isLeftColumn = index % numColumns === 0;
    const isRunning = container.state === 'running';
    const appInfo = findAppForContainer(containerName);

    return (
      <Card
        style={[
          styles.containerCard,
          {
            width: numColumns === 2 ? cardWidth : '100%',
            marginRight: numColumns === 2 && isLeftColumn ? theme.spacing.md : 0,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isRunning
                    ? theme.colors.success
                    : theme.colors.textTertiary,
                },
              ]}
            />
            <StatusBadge status={getContainerStatus(container.state)} size="small" />
          </View>
          {appInfo && (
            <TouchableOpacity
              style={styles.appBadge}
              onPress={() => handleAppPress(appInfo)}
            >
              <Ionicons
                name={getTypeIcon(appInfo.type) as any}
                size={10}
                color={getTypeColor(appInfo.type)}
              />
              <Text style={[styles.appBadgeText, { color: getTypeColor(appInfo.type) }]} numberOfLines={1}>
                {appInfo.name}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.containerInfo}>
          <View
            style={[
              styles.containerIcon,
              {
                backgroundColor: isRunning
                  ? theme.colors.successMuted
                  : theme.colors.surface,
              },
            ]}
          >
            <Ionicons
              name={isRunning ? 'cube' : 'cube-outline'}
              size={20}
              color={isRunning ? theme.colors.success : theme.colors.textTertiary}
            />
          </View>
          <Text style={styles.containerName} numberOfLines={1}>
            {containerName}
          </Text>
          <Text style={styles.containerImage} numberOfLines={1}>
            {container.image || 'Unknown image'}
          </Text>
        </View>

        {/* Project association */}
        {appInfo?.projectName && (
          <TouchableOpacity
            style={styles.projectRow}
            onPress={() => appInfo.projectId && router.push(`/project/${appInfo.projectId}`)}
          >
            <Ionicons name="folder-outline" size={12} color={theme.colors.textTertiary} />
            <Text style={styles.projectText} numberOfLines={1}>
              {appInfo.projectName}
            </Text>
          </TouchableOpacity>
        )}

        {/* Domains */}
        {appInfo?.domains && appInfo.domains.length > 0 && (
          <View style={styles.domainsRow}>
            {appInfo.domains.slice(0, 2).map((domain, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.domainBadge}
                onPress={() => handleOpenDomain(domain)}
              >
                <Ionicons
                  name={domain.https ? 'lock-closed' : 'globe-outline'}
                  size={10}
                  color={domain.https ? theme.colors.success : theme.colors.textTertiary}
                />
                <Text style={styles.domainText} numberOfLines={1}>
                  {domain.host}
                </Text>
                <Ionicons name="open-outline" size={10} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            ))}
            {appInfo.domains.length > 2 && (
              <Text style={styles.moreDomains}>+{appInfo.domains.length - 2} more</Text>
            )}
          </View>
        )}

        <View style={styles.containerFooter}>
          <Text style={styles.containerStatus} numberOfLines={1}>
            {container.status || 'Unknown status'}
          </Text>
          <View style={styles.containerActions}>
            {appInfo ? (
              // Service-level controls (when we know the associated app)
              isRunning ? (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonStop]}
                    onPress={() => handleStopService(appInfo)}
                  >
                    <Ionicons name="stop" size={14} color={theme.colors.error} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonRestart]}
                    onPress={() => handleRestartContainer(container.containerId, containerName)}
                  >
                    <Ionicons name="refresh" size={14} color={theme.colors.primary} />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonStart]}
                  onPress={() => handleStartService(appInfo)}
                >
                  <Ionicons name="play" size={14} color={theme.colors.success} />
                </TouchableOpacity>
              )
            ) : (
              // Container-level restart only (unknown containers)
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonRestart]}
                onPress={() => handleRestartContainer(container.containerId, containerName)}
              >
                <Ionicons name="refresh" size={14} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Card>
    );
  };

  if (isLoading && containers.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Containers" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Containers"
        stats={[
          { label: 'running', value: runningCount, color: theme.colors.success },
          { label: 'stopped', value: stoppedCount, color: theme.colors.textTertiary },
        ]}
        rightAction={
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        }
      />

      {validContainers.length === 0 ? (
        <EmptyState
          icon="cube-outline"
          title="No Containers"
          description="No Docker containers found on this server"
        />
      ) : (
        <FlatList
          data={validContainers}
          renderItem={renderContainerCard}
          keyExtractor={(item, index) => item?.containerId || `container-${index}`}
          numColumns={numColumns}
          key={numColumns.toString()}
          contentContainerStyle={styles.list}
          columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: theme.spacing.lg,
  },
  row: {
    justifyContent: 'flex-start',
  },
  containerCard: {
    marginBottom: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  appBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
    maxWidth: 120,
  },
  appBadgeText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.medium,
  },
  containerInfo: {
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  containerIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  containerName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  containerImage: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  projectText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  domainsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  domainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  domainText: {
    fontSize: 10,
    color: theme.colors.info,
    maxWidth: 100,
  },
  moreDomains: {
    fontSize: 10,
    color: theme.colors.textTertiary,
    alignSelf: 'center',
  },
  containerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
  },
  containerStatus: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  containerActions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonRestart: {
    backgroundColor: theme.colors.primaryMuted,
  },
  actionButtonStop: {
    backgroundColor: theme.colors.errorMuted,
  },
  actionButtonStart: {
    backgroundColor: theme.colors.successMuted,
  },
});
