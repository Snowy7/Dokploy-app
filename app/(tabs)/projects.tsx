import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '../../src/theme';
import { Card } from '../../src/components/Card';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { EmptyState } from '../../src/components/EmptyState';
import { api } from '../../src/services/api';
import { formatDistanceToNow } from 'date-fns';

interface Environment {
  environmentId: string;
  name: string;
  applications?: any[];
  compose?: any[];
  postgres?: any[];
  mysql?: any[];
  mariadb?: any[];
  mongo?: any[];
  redis?: any[];
}

interface ProjectWithDetails {
  projectId: string;
  name: string;
  description?: string;
  createdAt: string;
  environments?: Environment[];
}

export default function ProjectsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [projects, setProjects] = useState<ProjectWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const numColumns = width >= 768 ? 2 : 1;
  const cardWidth =
    width >= 768 ? (width - theme.spacing.lg * 3) / 2 : width - theme.spacing.lg * 2;

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<ProjectWithDetails[]>('/project.all');
      setProjects(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProjects();
    setRefreshing(false);
  };

  const handleProjectPress = (project: ProjectWithDetails) => {
    router.push(`/project/${project.projectId}`);
  };

  const getProjectStats = (project: ProjectWithDetails) => {
    let apps = 0;
    let compose = 0;
    let databases = 0;
    let running = 0;

    project.environments?.forEach((env) => {
      apps += env.applications?.length || 0;
      compose += env.compose?.length || 0;
      databases +=
        (env.postgres?.length || 0) +
        (env.mysql?.length || 0) +
        (env.mariadb?.length || 0) +
        (env.mongo?.length || 0) +
        (env.redis?.length || 0);

      env.applications?.forEach((app: any) => {
        if (app.applicationStatus === 'running') running++;
      });
      env.compose?.forEach((c: any) => {
        if (c.composeStatus === 'running') running++;
      });
    });

    return { apps, compose, databases, running, total: apps + compose + databases };
  };

  // Calculate total stats
  const totalStats = projects.reduce(
    (acc, p) => {
      const stats = getProjectStats(p);
      acc.apps += stats.apps;
      acc.compose += stats.compose;
      acc.databases += stats.databases;
      acc.running += stats.running;
      return acc;
    },
    { apps: 0, compose: 0, databases: 0, running: 0 }
  );

  const renderProjectCard = ({
    item: project,
    index,
  }: {
    item: ProjectWithDetails;
    index: number;
  }) => {
    const isLeftColumn = index % numColumns === 0;
    const stats = getProjectStats(project);
    const envCount = project.environments?.length || 0;

    return (
      <Card
        style={[
          styles.projectCard,
          {
            width: numColumns === 2 ? cardWidth : '100%',
            marginRight: numColumns === 2 && isLeftColumn ? theme.spacing.md : 0,
          },
        ]}
        onPress={() => handleProjectPress(project)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.projectIcon}>
            <Ionicons name="folder" size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.projectTitleContainer}>
            <Text style={styles.projectName} numberOfLines={1}>
              {project.name}
            </Text>
            {project.description && (
              <Text style={styles.projectDescription} numberOfLines={1}>
                {project.description}
              </Text>
            )}
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="rocket-outline" size={12} color={theme.colors.primary} />
            <Text style={styles.statValue}>{stats.apps}</Text>
            <Text style={styles.statLabel}>Apps</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="layers-outline" size={12} color={theme.colors.info} />
            <Text style={styles.statValue}>{stats.compose}</Text>
            <Text style={styles.statLabel}>Compose</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="server-outline" size={12} color={theme.colors.warning} />
            <Text style={styles.statValue}>{stats.databases}</Text>
            <Text style={styles.statLabel}>DBs</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons
              name="play-circle-outline"
              size={12}
              color={stats.running > 0 ? theme.colors.success : theme.colors.textTertiary}
            />
            <Text
              style={[
                styles.statValue,
                { color: stats.running > 0 ? theme.colors.success : theme.colors.textTertiary },
              ]}
            >
              {stats.running}
            </Text>
            <Text style={styles.statLabel}>Running</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.projectFooter}>
          <View style={styles.footerLeft}>
            <View style={styles.envBadge}>
              <Ionicons name="git-branch-outline" size={10} color={theme.colors.textSecondary} />
              <Text style={styles.envText}>{envCount} env{envCount !== 1 ? 's' : ''}</Text>
            </View>
            <Text style={styles.projectDate}>
              {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={theme.colors.textTertiary}
          />
        </View>
      </Card>
    );
  };

  if (isLoading && projects.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Projects" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Projects"
        stats={[
          { label: 'projects', value: projects.length, color: theme.colors.primary },
          { label: 'apps', value: totalStats.apps, color: theme.colors.info },
          { label: 'running', value: totalStats.running, color: theme.colors.success },
        ]}
      />

      {projects.length === 0 ? (
        <EmptyState
          icon="folder-outline"
          title="No Projects Yet"
          description="Create your first project to get started with deployments"
        />
      ) : (
        <FlatList
          data={projects}
          renderItem={renderProjectCard}
          keyExtractor={(item) => item.projectId}
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
  projectCard: {
    marginBottom: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  projectIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  projectTitleContainer: {
    flex: 1,
  },
  projectName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  projectDescription: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
    marginBottom: theme.spacing.sm,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  statLabel: {
    fontSize: 9,
    color: theme.colors.textTertiary,
    marginTop: 1,
  },
  projectFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  envBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  envText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  projectDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
  },
});
