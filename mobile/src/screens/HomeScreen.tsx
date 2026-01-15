import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { Card } from '../components/Card';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore } from '../stores/projectStore';
import { useContainerStore } from '../stores/containerStore';

export const HomeScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const { projects, fetchProjects } = useProjectStore();
  const { containers, fetchContainers } = useContainerStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([fetchProjects(), fetchContainers()]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const runningContainers = containers.filter(c => c.State === 'running').length;
  const stoppedContainers = containers.filter(c => c.State !== 'running').length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.firstName || user?.email || 'User'}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="person-circle-outline" size={40} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <Card style={styles.statCard} elevated>
            <View style={styles.statIconContainer}>
              <Ionicons name="folder-outline" size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.statValue}>{projects.length}</Text>
            <Text style={styles.statLabel}>Projects</Text>
          </Card>

          <Card style={styles.statCard} elevated>
            <View style={[styles.statIconContainer, { backgroundColor: theme.colors.success + '20' }]}>
              <Ionicons name="checkmark-circle-outline" size={24} color={theme.colors.success} />
            </View>
            <Text style={styles.statValue}>{runningContainers}</Text>
            <Text style={styles.statLabel}>Running</Text>
          </Card>

          <Card style={styles.statCard} elevated>
            <View style={[styles.statIconContainer, { backgroundColor: theme.colors.textTertiary + '20' }]}>
              <Ionicons name="pause-circle-outline" size={24} color={theme.colors.textTertiary} />
            </View>
            <Text style={styles.statValue}>{stoppedContainers}</Text>
            <Text style={styles.statLabel}>Stopped</Text>
          </Card>

          <Card style={styles.statCard} elevated>
            <View style={[styles.statIconContainer, { backgroundColor: theme.colors.warning + '20' }]}>
              <Ionicons name="cube-outline" size={24} color={theme.colors.warning} />
            </View>
            <Text style={styles.statValue}>{containers.length}</Text>
            <Text style={styles.statLabel}>Containers</Text>
          </Card>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>

          <Card style={styles.actionCard} onPress={() => navigation.navigate('Projects')}>
            <View style={styles.actionContent}>
              <View style={styles.actionIcon}>
                <Ionicons name="folder-outline" size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Manage Projects</Text>
                <Text style={styles.actionDescription}>View and manage all your projects</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
            </View>
          </Card>

          <Card style={styles.actionCard} onPress={() => navigation.navigate('Containers')}>
            <View style={styles.actionContent}>
              <View style={styles.actionIcon}>
                <Ionicons name="cube-outline" size={24} color={theme.colors.info} />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Docker Containers</Text>
                <Text style={styles.actionDescription}>Monitor and control containers</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
            </View>
          </Card>

          <Card style={styles.actionCard} onPress={() => navigation.navigate('Deployments')}>
            <View style={styles.actionContent}>
              <View style={styles.actionIcon}>
                <Ionicons name="rocket-outline" size={24} color={theme.colors.success} />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>Deployments</Text>
                <Text style={styles.actionDescription}>Track deployment status</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
            </View>
          </Card>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  greeting: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  userName: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.xs,
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    width: '48%',
    margin: theme.spacing.xs,
    padding: theme.spacing.lg,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  statValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
  },
  actionCard: {
    marginBottom: theme.spacing.md,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  actionDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
});
