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

interface ComposeDetails {
  composeId: string;
  name: string;
  appName: string;
  description?: string;
  composeType: 'docker-compose' | 'stack';
  composeFile?: string;
  composeStatus: string;
  environmentId: string;
  createdAt: string;
  sourceType?: string;
  repository?: string;
  branch?: string;
  owner?: string;
  autoDeploy?: boolean;
  domains?: Domain[];
  deployments?: Deployment[];
  serverId?: string;
  customGitUrl?: string;
  customGitBranch?: string;
  randomize?: boolean;
}

export default function ComposeDetailScreen() {
  const { id: composeId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [compose, setCompose] = useState<ComposeDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (composeId) {
      loadCompose();
    }
  }, [composeId]);

  const loadCompose = async () => {
    if (!composeId) return;
    setIsLoading(true);
    try {
      const data = await api.get<ComposeDetails>(`/compose.one?composeId=${composeId}`);
      setCompose(data);
    } catch (error) {
      console.error('Failed to load compose:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCompose();
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
        await loadCompose();
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
      () => api.post('/compose.deploy', { composeId }),
      'Deploy',
      'Deployment started'
    );

  const handleRedeploy = () =>
    handleAction(
      () => api.post('/compose.redeploy', { composeId }),
      'Redeploy',
      'Redeployment started',
      'Redeploy Compose',
      'Are you sure you want to redeploy this compose service?'
    );

  const handleStop = () =>
    handleAction(
      () => api.post('/compose.stop', { composeId }),
      'Stop',
      'Compose stopped',
      'Stop Compose',
      'Are you sure you want to stop this compose service?'
    );

  const handleDelete = () =>
    handleAction(
      async () => {
        await api.post('/compose.delete', { composeId });
        router.back();
      },
      'Delete',
      'Compose deleted',
      'Delete Compose',
      'Are you sure you want to delete this compose service? This action cannot be undone.'
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
          <Text style={styles.loadingText}>Loading compose...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!compose) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Error', headerShown: true }} />
        <View style={styles.centerContainer}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
          </View>
          <Text style={styles.errorTitle}>Failed to load compose</Text>
          <Text style={styles.errorMessage}>Compose service not found</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="primary" />
        </View>
      </SafeAreaView>
    );
  }

  const recentDeployments = compose.deployments?.slice(0, 5) || [];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: compose.name,
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
              <Ionicons name="layers" size={28} color={theme.colors.info} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.appName}>{compose.name}</Text>
              <Text style={styles.appAppName}>{compose.appName}</Text>
              {compose.description && (
                <Text style={styles.appDescription} numberOfLines={2}>
                  {compose.description}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.statusRow}>
            <StatusBadge status={compose.composeStatus as any} />
            <View style={styles.metaBadges}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{compose.composeType}</Text>
              </View>
              {compose.autoDeploy && (
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
            title="Stop"
            onPress={handleStop}
            loading={actionLoading === 'Stop'}
            variant="danger"
            icon={<Ionicons name="stop" size={16} color="#fff" />}
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
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>{compose.composeType}</Text>
            </View>
            <View style={styles.detailGridItem}>
              <Text style={styles.detailLabel}>Source</Text>
              <Text style={styles.detailValue}>{compose.sourceType || 'raw'}</Text>
            </View>
          </View>

          {compose.repository && (
            <View style={styles.detailRowFull}>
              <Text style={styles.detailLabel}>Repository</Text>
              <View style={styles.repoRow}>
                <Ionicons name="logo-github" size={14} color={theme.colors.textSecondary} />
                <Text style={styles.repoText} numberOfLines={1}>
                  {compose.repository}
                </Text>
              </View>
            </View>
          )}

          {compose.branch && (
            <View style={styles.detailRowFull}>
              <Text style={styles.detailLabel}>Branch</Text>
              <View style={styles.branchBadge}>
                <Ionicons name="git-branch" size={12} color={theme.colors.info} />
                <Text style={styles.branchText}>{compose.branch}</Text>
              </View>
            </View>
          )}

          {compose.customGitUrl && (
            <View style={styles.detailRowFull}>
              <Text style={styles.detailLabel}>Custom Git URL</Text>
              <Text style={styles.detailValueMono} numberOfLines={1}>
                {compose.customGitUrl}
              </Text>
            </View>
          )}
        </Card>

        {/* Domains Section */}
        {compose.domains && compose.domains.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Domains ({compose.domains.length})</Text>
            <Card style={styles.domainsCard}>
              {compose.domains.map((domain, index) => (
                <TouchableOpacity
                  key={domain.domainId}
                  style={[
                    styles.domainItem,
                    index < compose.domains!.length - 1 && styles.domainItemBorder,
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
              {formatDistanceToNow(new Date(compose.createdAt), { addSuffix: true })}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="finger-print-outline" size={14} color={theme.colors.textTertiary} />
            <Text style={styles.infoLabel}>ID</Text>
            <Text style={styles.infoValueMono}>{compose.composeId.substring(0, 12)}...</Text>
          </View>
          {compose.serverId && (
            <View style={styles.infoRow}>
              <Ionicons name="server-outline" size={14} color={theme.colors.textTertiary} />
              <Text style={styles.infoLabel}>Server</Text>
              <Text style={styles.infoValueMono}>{compose.serverId.substring(0, 12)}...</Text>
            </View>
          )}
        </Card>

        {/* Danger Zone */}
        <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
        <Card style={styles.dangerCard}>
          <View style={styles.dangerContent}>
            <View style={styles.dangerInfo}>
              <Text style={styles.dangerLabel}>Delete Compose</Text>
              <Text style={styles.dangerDescription}>
                Permanently delete this compose service and all associated data
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
    backgroundColor: theme.colors.infoMuted,
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
  detailValueMono: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontFamily: 'monospace',
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
