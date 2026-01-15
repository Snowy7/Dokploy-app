import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { theme } from '../../src/theme';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { StatusBadge } from '../../src/components/StatusBadge';
import { api } from '../../src/services/api';
import { formatDistanceToNow } from 'date-fns';

interface Domain {
  domainId: string;
  host: string;
  path?: string;
  port?: number;
  https: boolean;
  certificateType: string;
}

interface Deployment {
  deploymentId: string;
  status: string;
  createdAt: string;
  title?: string;
}

interface ApplicationDetails {
  applicationId: string;
  name: string;
  appName: string;
  description?: string;
  buildType: string;
  sourceType?: string;
  dockerImage?: string;
  repository?: string;
  branch?: string;
  owner?: string;
  applicationStatus: string;
  environmentId: string;
  createdAt: string;
  memoryLimit?: string;
  memoryReservation?: string;
  cpuLimit?: string;
  cpuReservation?: string;
  autoDeploy?: boolean;
  domains?: Domain[];
  deployments?: Deployment[];
  serverId?: string;
  dockerfile?: string;
  replicas?: number;
  healthCheckPath?: string;
  restartPolicy?: string;
}

export default function ApplicationDetailScreen() {
  const { id: applicationId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [app, setApp] = useState<ApplicationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (applicationId) {
      loadApplication();
    }
  }, [applicationId]);

  const loadApplication = async () => {
    if (!applicationId) return;
    setIsLoading(true);
    try {
      const data = await api.get<ApplicationDetails>(`/application.one?applicationId=${applicationId}`);
      setApp(data);
    } catch (error) {
      console.error('Failed to load application:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadApplication();
    setRefreshing(false);
  };

  const handleAction = async (
    action: () => Promise<void>,
    actionName: string,
    successMessage: string,
    confirmTitle?: string,
    confirmMessage?: string
  ) => {
    const executeAction = async () => {
      setActionLoading(actionName);
      try {
        await action();
        Alert.alert('Success', successMessage);
        await loadApplication();
      } catch (err) {
        Alert.alert('Error', `Failed to ${actionName.toLowerCase()}`);
      } finally {
        setActionLoading(null);
      }
    };

    if (confirmTitle && confirmMessage) {
      Alert.alert(confirmTitle, confirmMessage, [
        { text: 'Cancel', style: 'cancel' },
        { text: actionName, style: actionName === 'Delete' ? 'destructive' : 'default', onPress: executeAction },
      ]);
    } else {
      executeAction();
    }
  };

  const handleDeploy = () =>
    handleAction(
      () => api.post('/application.deploy', { applicationId }),
      'Deploy',
      'Deployment started'
    );

  const handleRedeploy = () =>
    handleAction(
      () => api.post('/application.redeploy', { applicationId }),
      'Redeploy',
      'Redeployment started',
      'Redeploy Application',
      'Are you sure you want to redeploy this application?'
    );

  const handleStart = () =>
    handleAction(
      () => api.post('/application.start', { applicationId }),
      'Start',
      'Application started'
    );

  const handleStop = () =>
    handleAction(
      () => api.post('/application.stop', { applicationId }),
      'Stop',
      'Application stopped',
      'Stop Application',
      'Are you sure you want to stop this application?'
    );

  const handleDelete = () =>
    handleAction(
      async () => {
        await api.post('/application.delete', { applicationId });
        router.back();
      },
      'Delete',
      'Application deleted',
      'Delete Application',
      'Are you sure you want to delete this application? This action cannot be undone.'
    );

  const getDeploymentStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return theme.colors.success;
      case 'running':
        return theme.colors.warning;
      case 'error':
        return theme.colors.error;
      default:
        return theme.colors.textTertiary;
    }
  };

  const getSourceIcon = (sourceType?: string) => {
    switch (sourceType) {
      case 'github':
        return 'logo-github';
      case 'gitlab':
        return 'git-branch';
      case 'bitbucket':
        return 'git-branch';
      case 'docker':
        return 'cube';
      default:
        return 'code-slash';
    }
  };

  const handleOpenDomain = async (domain: Domain) => {
    const url = `${domain.https ? 'https' : 'http'}://${domain.host}${domain.path || ''}`;
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Loading...', headerShown: true }} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading application...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!app) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Error', headerShown: true }} />
        <View style={styles.centerContainer}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
          </View>
          <Text style={styles.errorTitle}>Failed to load application</Text>
          <Text style={styles.errorMessage}>Application not found</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="primary" />
        </View>
      </SafeAreaView>
    );
  }

  const isRunning = app.applicationStatus === 'running';
  const recentDeployments = app.deployments?.slice(0, 5) || [];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: app.name,
          headerShown: true,
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.textPrimary,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.appIconContainer}>
              <Ionicons name="rocket" size={28} color={theme.colors.primary} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.appName}>{app.name}</Text>
              <Text style={styles.appAppName}>{app.appName}</Text>
              {app.description && (
                <Text style={styles.appDescription} numberOfLines={2}>
                  {app.description}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.statusRow}>
            <StatusBadge status={app.applicationStatus as any} />
            <View style={styles.metaBadges}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{app.buildType}</Text>
              </View>
              {app.autoDeploy && (
                <View style={styles.autoBadge}>
                  <Ionicons name="sync" size={10} color={theme.colors.success} />
                  <Text style={styles.autoText}>Auto</Text>
                </View>
              )}
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Button
            title={isRunning ? 'Stop' : 'Start'}
            onPress={isRunning ? handleStop : handleStart}
            loading={actionLoading === 'Stop' || actionLoading === 'Start'}
            variant={isRunning ? 'danger' : 'success'}
            icon={<Ionicons name={isRunning ? 'stop' : 'play'} size={16} color="#fff" />}
            style={styles.quickActionButton}
            size="small"
          />
          <Button
            title="Deploy"
            onPress={handleDeploy}
            loading={actionLoading === 'Deploy'}
            variant="primary"
            icon={<Ionicons name="rocket" size={16} color="#fff" />}
            style={styles.quickActionButton}
            size="small"
          />
          <Button
            title="Redeploy"
            onPress={handleRedeploy}
            loading={actionLoading === 'Redeploy'}
            variant="secondary"
            icon={<Ionicons name="refresh" size={16} color={theme.colors.textPrimary} />}
            style={styles.quickActionButton}
            size="small"
          />
        </View>

        {/* Source Section */}
        <Text style={styles.sectionTitle}>Source</Text>
        <Card style={styles.detailsCard}>
          <View style={styles.detailGrid}>
            <View style={styles.detailGridItem}>
              <Text style={styles.detailLabel}>Build Type</Text>
              <Text style={styles.detailValue}>{app.buildType}</Text>
            </View>
            <View style={styles.detailGridItem}>
              <Text style={styles.detailLabel}>Source</Text>
              <View style={styles.sourceRow}>
                <Ionicons
                  name={getSourceIcon(app.sourceType) as any}
                  size={14}
                  color={theme.colors.textSecondary}
                />
                <Text style={styles.detailValue}>{app.sourceType || 'docker'}</Text>
              </View>
            </View>
          </View>

          {app.repository && (
            <View style={styles.detailRowFull}>
              <Text style={styles.detailLabel}>Repository</Text>
              <View style={styles.repoRow}>
                <Ionicons name="logo-github" size={14} color={theme.colors.textSecondary} />
                <Text style={styles.repoText} numberOfLines={1}>
                  {app.repository}
                </Text>
              </View>
            </View>
          )}

          {app.branch && (
            <View style={styles.detailRowFull}>
              <Text style={styles.detailLabel}>Branch</Text>
              <View style={styles.branchBadge}>
                <Ionicons name="git-branch" size={12} color={theme.colors.info} />
                <Text style={styles.branchText}>{app.branch}</Text>
              </View>
            </View>
          )}

          {app.dockerImage && (
            <View style={styles.detailRowFull}>
              <Text style={styles.detailLabel}>Docker Image</Text>
              <View style={styles.repoRow}>
                <Ionicons name="cube-outline" size={14} color={theme.colors.textSecondary} />
                <Text style={styles.repoText} numberOfLines={1}>
                  {app.dockerImage}
                </Text>
              </View>
            </View>
          )}
        </Card>

        {/* Resources Section */}
        {(app.memoryLimit || app.cpuLimit || app.replicas) && (
          <>
            <Text style={styles.sectionTitle}>Resources</Text>
            <Card style={styles.resourcesCard}>
              <View style={styles.resourcesGrid}>
                {app.memoryLimit && (
                  <View style={styles.resourceItem}>
                    <View style={[styles.resourceIcon, { backgroundColor: theme.colors.infoMuted }]}>
                      <Ionicons name="hardware-chip" size={16} color={theme.colors.info} />
                    </View>
                    <Text style={styles.resourceLabel}>Memory</Text>
                    <Text style={styles.resourceValue}>{app.memoryLimit}</Text>
                  </View>
                )}
                {app.cpuLimit && (
                  <View style={styles.resourceItem}>
                    <View style={[styles.resourceIcon, { backgroundColor: theme.colors.warningMuted }]}>
                      <Ionicons name="speedometer" size={16} color={theme.colors.warning} />
                    </View>
                    <Text style={styles.resourceLabel}>CPU</Text>
                    <Text style={styles.resourceValue}>{app.cpuLimit}</Text>
                  </View>
                )}
                {app.replicas && (
                  <View style={styles.resourceItem}>
                    <View style={[styles.resourceIcon, { backgroundColor: theme.colors.successMuted }]}>
                      <Ionicons name="copy" size={16} color={theme.colors.success} />
                    </View>
                    <Text style={styles.resourceLabel}>Replicas</Text>
                    <Text style={styles.resourceValue}>{app.replicas}</Text>
                  </View>
                )}
              </View>
            </Card>
          </>
        )}

        {/* Domains Section */}
        {app.domains && app.domains.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Domains ({app.domains.length})</Text>
            <Card style={styles.domainsCard}>
              {app.domains.map((domain, index) => (
                <TouchableOpacity
                  key={domain.domainId}
                  style={[
                    styles.domainItem,
                    index < app.domains!.length - 1 && styles.domainItemBorder,
                  ]}
                  onPress={() => handleOpenDomain(domain)}
                  activeOpacity={0.7}
                >
                  <View style={styles.domainInfo}>
                    <View style={styles.domainRow}>
                      <Ionicons
                        name={domain.https ? 'lock-closed' : 'lock-open'}
                        size={12}
                        color={domain.https ? theme.colors.success : theme.colors.warning}
                      />
                      <Text style={styles.domainHost} numberOfLines={1}>
                        {domain.https ? 'https://' : 'http://'}
                        {domain.host}
                        {domain.path || ''}
                      </Text>
                      <Ionicons name="open-outline" size={14} color={theme.colors.textTertiary} />
                    </View>
                    <Text style={styles.domainMeta}>
                      Port: {domain.port || 80} · {domain.certificateType}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </Card>
          </>
        )}

        {/* Recent Deployments */}
        {recentDeployments.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Deployments</Text>
            <Card style={styles.deploymentsCard}>
              {recentDeployments.map((deployment, index) => (
                <View
                  key={deployment.deploymentId}
                  style={[
                    styles.deploymentItem,
                    index < recentDeployments.length - 1 && styles.deploymentItemBorder,
                  ]}
                >
                  <View
                    style={[
                      styles.deploymentStatus,
                      { backgroundColor: getDeploymentStatusColor(deployment.status) },
                    ]}
                  />
                  <View style={styles.deploymentInfo}>
                    <Text style={styles.deploymentTitle}>
                      {deployment.title || `Deployment #${deployment.deploymentId.substring(0, 8)}`}
                    </Text>
                    <Text style={styles.deploymentTime}>
                      {formatDistanceToNow(new Date(deployment.createdAt), { addSuffix: true })}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.deploymentBadge,
                      { backgroundColor: getDeploymentStatusColor(deployment.status) + '15' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.deploymentBadgeText,
                        { color: getDeploymentStatusColor(deployment.status) },
                      ]}
                    >
                      {deployment.status}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </>
        )}

        {/* Info Section */}
        <Text style={styles.sectionTitle}>Information</Text>
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={14} color={theme.colors.textTertiary} />
            <Text style={styles.infoLabel}>Created</Text>
            <Text style={styles.infoValue}>
              {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="finger-print-outline" size={14} color={theme.colors.textTertiary} />
            <Text style={styles.infoLabel}>ID</Text>
            <Text style={styles.infoValueMono}>{app.applicationId.substring(0, 12)}...</Text>
          </View>
          {app.healthCheckPath && (
            <View style={styles.infoRow}>
              <Ionicons name="heart-outline" size={14} color={theme.colors.textTertiary} />
              <Text style={styles.infoLabel}>Health Check</Text>
              <Text style={styles.infoValueMono}>{app.healthCheckPath}</Text>
            </View>
          )}
          {app.restartPolicy && (
            <View style={styles.infoRow}>
              <Ionicons name="refresh-outline" size={14} color={theme.colors.textTertiary} />
              <Text style={styles.infoLabel}>Restart Policy</Text>
              <Text style={styles.infoValue}>{app.restartPolicy}</Text>
            </View>
          )}
        </Card>

        {/* Danger Zone */}
        <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
        <Card style={styles.dangerCard}>
          <View style={styles.dangerContent}>
            <View style={styles.dangerInfo}>
              <Text style={styles.dangerLabel}>Delete Application</Text>
              <Text style={styles.dangerDescription}>
                Permanently delete this application and all associated data
              </Text>
            </View>
            <Button
              title="Delete"
              onPress={handleDelete}
              loading={actionLoading === 'Delete'}
              variant="danger"
              size="small"
            />
          </View>
        </Card>
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  errorIcon: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.errorMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  errorTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  errorMessage: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  headerCard: {
    marginBottom: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  appIconContainer: {
    width: 52,
    height: 52,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  appName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  appAppName: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  appDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
  },
  metaBadges: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  typeBadge: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  typeText: {
    fontSize: 10,
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
  },
  autoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.colors.successMuted,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  autoText: {
    fontSize: 10,
    color: theme.colors.success,
    fontWeight: theme.fontWeight.medium,
  },
  quickActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  quickActionButton: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  detailsCard: {
    marginBottom: theme.spacing.md,
  },
  detailGrid: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  detailGridItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: theme.colors.textTertiary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.medium,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailRowFull: {
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
    marginTop: theme.spacing.sm,
  },
  repoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: 4,
  },
  repoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  branchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.infoMuted,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  branchText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.info,
    fontWeight: theme.fontWeight.medium,
  },
  resourcesCard: {
    marginBottom: theme.spacing.md,
  },
  resourcesGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  resourceItem: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.md,
  },
  resourceIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  resourceLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  resourceValue: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  domainsCard: {
    marginBottom: theme.spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  domainItem: {
    padding: theme.spacing.md,
  },
  domainItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  domainInfo: {},
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  domainHost: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.medium,
    flex: 1,
  },
  domainMeta: {
    fontSize: 10,
    color: theme.colors.textTertiary,
    marginTop: 4,
  },
  deploymentsCard: {
    marginBottom: theme.spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  deploymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  deploymentItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  deploymentStatus: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: theme.spacing.sm,
  },
  deploymentInfo: {
    flex: 1,
  },
  deploymentTitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.medium,
  },
  deploymentTime: {
    fontSize: 10,
    color: theme.colors.textTertiary,
  },
  deploymentBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  deploymentBadgeText: {
    fontSize: 10,
    fontWeight: theme.fontWeight.medium,
  },
  infoCard: {
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  infoLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
  },
  infoValueMono: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textPrimary,
    fontFamily: 'monospace',
  },
  dangerTitle: {
    color: theme.colors.error,
  },
  dangerCard: {
    borderColor: theme.colors.errorMuted,
    borderWidth: 1,
  },
  dangerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dangerInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  dangerLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  dangerDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
});
