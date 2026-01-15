import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { Card } from '../components/Card';
import { useProjectStore } from '../stores/projectStore';
import { Project, Environment } from '../types';
import { formatDistanceToNow } from 'date-fns';

export const ProjectsScreen = ({ navigation }: any) => {
  const { projects, environments, fetchProjects, fetchEnvironments, isLoading } = useProjectStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProjects();
    setRefreshing(false);
  };

  const handleProjectPress = async (project: Project) => {
    setSelectedProject(project);
    await fetchEnvironments(project.projectId);
    navigation.navigate('ProjectDetail', { project });
  };

  const renderProjectCard = ({ item: project }: { item: Project }) => (
    <Card style={styles.projectCard} onPress={() => handleProjectPress(project)} elevated>
      <View style={styles.projectHeader}>
        <View style={styles.projectIcon}>
          <Ionicons name="folder" size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.projectInfo}>
          <Text style={styles.projectName}>{project.name}</Text>
          {project.description && (
            <Text style={styles.projectDescription} numberOfLines={2}>
              {project.description}
            </Text>
          )}
          <Text style={styles.projectDate}>
            Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Projects</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {projects.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Ionicons name="folder-outline" size={64} color={theme.colors.textTertiary} />
          <Text style={styles.emptyTitle}>No Projects Yet</Text>
          <Text style={styles.emptyDescription}>
            Create your first project to get started with deployments
          </Text>
        </View>
      ) : (
        <FlatList
          data={projects}
          renderItem={renderProjectCard}
          keyExtractor={(item) => item.projectId}
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
  addButton: {
    padding: theme.spacing.xs,
  },
  list: {
    padding: theme.spacing.lg,
  },
  projectCard: {
    marginBottom: theme.spacing.md,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  projectDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  projectDate: {
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
