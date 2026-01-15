import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { theme } from '../../src/theme';
import { Card } from '../../src/components/Card';
import { StatusBadge } from '../../src/components/StatusBadge';
import { api } from '../../src/services/api';
import { Project, Environment, Application, ComposeService } from '../../src/types';
import { formatDistanceToNow } from 'date-fns';

interface EnvironmentWithServices extends Environment {
  applications?: Application[];
  compose?: ComposeService[];
  postgres?: any[];
  mysql?: any[];
  mariadb?: any[];
  mongo?: any[];
  redis?: any[];
  isDefault?: boolean;
}

interface ProjectWithEnvironments extends Project {
  environments?: EnvironmentWithServices[];
}

export default function ProjectDetailScreen() {
  const { id: projectId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [project, setProject] = useState<ProjectWithEnvironments | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedEnvs, setExpandedEnvs] = useState<Set<string>>(new Set());

  const isTablet = width >= 768;
  const cardColumns = isTablet ? 2 : 1;

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const projectData = await api.get<ProjectWithEnvironments>(`/project.one?projectId=${projectId}`);
      setProject(projectData);
      // Auto-expand first environment or default environment
      const envs = projectData.environments || [];
      if (envs.length > 0) {
        const defaultEnv = envs.find(e => e.isDefault) || envs[0];
        setExpandedEnvs(new Set([defaultEnv.environmentId]));
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProject();
    setRefreshing(false);
  };

  const toggleEnvironment = (envId: string) => {
    setExpandedEnvs(prev => {
      const next = new Set(prev);
      if (next.has(envId)) {
        next.delete(envId);
      } else {
        next.add(envId);
      }
      return next;
    });
  };

  const navigateToApplication = (applicationId: string) => {
    router.push(`/application/${applicationId}`);
  };

  const navigateToCompose = (composeId: string) => {
    router.push(`/compose/${composeId}`);
  };

  const environments = project?.environments || [];

  const getServiceCount = (env: EnvironmentWithServices) => {
    return (
      (env.applications?.length || 0) +
      (env.compose?.length || 0) +
      (env.postgres?.length || 0) +
      (env.mysql?.length || 0) +
      (env.mariadb?.length || 0) +
      (env.mongo?.length || 0) +
      (env.redis?.length || 0)
    );
  };

  const renderServiceCard = (
    service: Application | ComposeService | any,
    type: 'application' | 'compose' | 'database',
    icon: string,
    color: string,
    idKey: string
  ) => {
    const status = service.applicationStatus || service.composeStatus || 'idle';
    const handlePress = () => {
      if (type === 'application' && service.applicationId) {
        navigateToApplication(service.applicationId);
      } else if (type === 'compose' && service.composeId) {
        navigateToCompose(service.composeId);
      }
    };

    return (
      <Card
        key={service[idKey]}
        style={[styles.serviceCard, { width: isTablet ? '48%' : '100%' }]}
        onPress={type !== 'database' ? handlePress : undefined}
      >
        <View style={styles.serviceHeader}>
          <View style={[styles.serviceIcon, { backgroundColor: color + '15' }]}>
            <Ionicons name={icon as any} size={20} color={color} />
          </View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName} numberOfLines={1}>
              {service.name}
            </Text>
            <Text style={styles.serviceType}>{type}</Text>
          </View>
          <StatusBadge status={status} size="small" />
        </View>
        {service.description && (
          <Text style={styles.serviceDescription} numberOfLines={2}>
            {service.description}
          </Text>
        )}
      </Card>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Loading...', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading project...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Error', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error} />
          <Text style={styles.errorText}>Project not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: project.name,
          headerShown: true,
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.textPrimary,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Project Header */}
        <Card style={styles.headerCard}>
          <View style={styles.projectHeader}>
            <View style={styles.projectIcon}>
              <Ionicons name="folder" size={32} color={theme.colors.primary} />
            </View>
            <View style={styles.projectInfo}>
              <Text style={styles.projectName}>{project.name}</Text>
              {project.description && (
                <Text style={styles.projectDescription}>{project.description}</Text>
              )}
              <Text style={styles.projectMeta}>
                Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
              </Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{environments.length}</Text>
              <Text style={styles.statLabel}>Environments</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {environments.reduce((sum, env) => sum + getServiceCount(env), 0)}
              </Text>
              <Text style={styles.statLabel}>Services</Text>
            </View>
          </View>
        </Card>

        {/* Environments */}
        {environments.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="layers-outline" size={48} color={theme.colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Environments</Text>
            <Text style={styles.emptyDescription}>
              This project has no environments yet
            </Text>
          </Card>
        ) : (
          environments.map(env => (
            <View key={env.environmentId} style={styles.environmentSection}>
              <TouchableOpacity
                style={styles.environmentHeader}
                onPress={() => toggleEnvironment(env.environmentId)}
                activeOpacity={0.7}
              >
                <View style={styles.environmentTitleRow}>
                  <View style={styles.environmentIcon}>
                    <Ionicons name="layers" size={20} color={theme.colors.info} />
                  </View>
                  <View style={styles.environmentTitleInfo}>
                    <Text style={styles.environmentName}>{env.name}</Text>
                    <Text style={styles.environmentCount}>
                      {getServiceCount(env)} services
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={expandedEnvs.has(env.environmentId) ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>

              {expandedEnvs.has(env.environmentId) && (
                <View style={styles.servicesContainer}>
                  {getServiceCount(env) === 0 ? (
                    <Card style={styles.emptyServicesCard}>
                      <Text style={styles.emptyServicesText}>No services in this environment</Text>
                    </Card>
                  ) : (
                    <View style={styles.servicesGrid}>
                      {env.applications?.map(app =>
                        renderServiceCard(app, 'application', 'rocket', theme.colors.primary, 'applicationId')
                      )}
                      {env.compose?.map(comp =>
                        renderServiceCard(comp, 'compose', 'layers', theme.colors.info, 'composeId')
                      )}
                      {env.postgres?.map(db =>
                        renderServiceCard(db, 'database', 'server', theme.colors.info, 'postgresId')
                      )}
                      {env.mysql?.map(db =>
                        renderServiceCard(db, 'database', 'server', theme.colors.warning, 'mysqlId')
                      )}
                      {env.mariadb?.map(db =>
                        renderServiceCard(db, 'database', 'server', theme.colors.warning, 'mariadbId')
                      )}
                      {env.mongo?.map(db =>
                        renderServiceCard(db, 'database', 'leaf', theme.colors.success, 'mongoId')
                      )}
                      {env.redis?.map(db =>
                        renderServiceCard(db, 'database', 'flash', theme.colors.error, 'redisId')
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          ))
        )}
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
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  errorText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
  },
  backButton: {
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  backButtonText: {
    color: theme.colors.textPrimary,
    fontWeight: theme.fontWeight.semibold,
  },
  headerCard: {
    marginBottom: theme.spacing.lg,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  projectIcon: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  projectDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  projectMeta: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  environmentSection: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    overflow: 'hidden',
  },
  environmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceElevated,
  },
  environmentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  environmentIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.infoMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  environmentTitleInfo: {
    flex: 1,
  },
  environmentName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  environmentCount: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  servicesContainer: {
    padding: theme.spacing.md,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  serviceCard: {
    marginBottom: theme.spacing.xs,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  serviceType: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
    textTransform: 'capitalize',
  },
  serviceDescription: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  emptyCard: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
  },
  emptyDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  emptyServicesCard: {
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  emptyServicesText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
});
