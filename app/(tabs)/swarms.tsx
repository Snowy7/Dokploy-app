import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/theme';
import { Card } from '../../src/components/Card';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { EmptyState } from '../../src/components/EmptyState';
import { api } from '../../src/services/api';

interface SwarmNode {
  ID: string;
  Hostname: string;
  Status: string;
  Availability: string;
  ManagerStatus: string;
  EngineVersion: string;
  TLSStatus: string;
  Self: boolean;
}

interface SwarmService {
  ID: string;
  Name: string;
  Image: string;
  Mode: string;
  Replicas?: string;
  Ports?: string;
}

type TabType = 'nodes' | 'services';

export default function SwarmsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('nodes');
  const [nodes, setNodes] = useState<SwarmNode[]>([]);
  const [services, setServices] = useState<SwarmService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [nodesRes, servicesRes] = await Promise.all([
        api.get<SwarmNode[]>('/swarm.getNodes').catch(() => []),
        api.get<SwarmService[]>('/swarm.getServices').catch(() => []),
      ]);
      setNodes(Array.isArray(nodesRes) ? nodesRes : []);
      setServices(Array.isArray(servicesRes) ? servicesRes : []);
    } catch (error) {
      console.error('Failed to fetch swarm data:', error);
      setNodes([]);
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getNodeStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'ready':
        return theme.colors.success;
      case 'down':
        return theme.colors.error;
      default:
        return theme.colors.warning;
    }
  };

  const readyNodes = nodes.filter((n) => n.Status?.toLowerCase() === 'ready').length;
  const managerNodes = nodes.filter((n) => n.ManagerStatus && n.ManagerStatus !== '').length;

  const renderNodeCard = ({ item: node }: { item: SwarmNode }) => {
    const isReady = node.Status?.toLowerCase() === 'ready';
    const isManager = node.ManagerStatus && node.ManagerStatus !== '';
    const isLeader = node.ManagerStatus === 'Leader';

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getNodeStatusColor(node.Status) },
              ]}
            />
            <Text style={styles.cardTitle} numberOfLines={1}>
              {node.Hostname || node.ID?.substring(0, 12)}
            </Text>
            {node.Self && (
              <View style={styles.selfBadge}>
                <Text style={styles.selfBadgeText}>This Node</Text>
              </View>
            )}
          </View>
          <View style={styles.badges}>
            {isManager && (
              <View style={[styles.badge, styles.managerBadge]}>
                <Text style={styles.managerBadgeText}>
                  {isLeader ? 'Leader' : 'Manager'}
                </Text>
              </View>
            )}
            {!isManager && (
              <View style={[styles.badge, styles.workerBadge]}>
                <Text style={styles.workerBadgeText}>Worker</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.nodeDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text
                style={[
                  styles.detailValue,
                  { color: getNodeStatusColor(node.Status) },
                ]}
              >
                {node.Status || 'Unknown'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Availability</Text>
              <Text style={styles.detailValue}>
                {node.Availability || 'Unknown'}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Engine</Text>
              <Text style={styles.detailValue}>
                {node.EngineVersion || 'N/A'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>TLS</Text>
              <Text
                style={[
                  styles.detailValue,
                  {
                    color:
                      node.TLSStatus === 'Ready'
                        ? theme.colors.success
                        : theme.colors.textTertiary,
                  },
                ]}
              >
                {node.TLSStatus || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.idRow}>
            <Ionicons
              name="finger-print-outline"
              size={12}
              color={theme.colors.textTertiary}
            />
            <Text style={styles.idText}>{node.ID}</Text>
          </View>
        </View>
      </Card>
    );
  };

  const renderServiceCard = ({ item: service }: { item: SwarmService }) => {
    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: theme.colors.success },
              ]}
            />
            <Text style={styles.cardTitle} numberOfLines={1}>
              {service.Name || service.ID?.substring(0, 12)}
            </Text>
          </View>
          {service.Replicas && (
            <View style={styles.replicasBadge}>
              <Text style={styles.replicasText}>{service.Replicas}</Text>
            </View>
          )}
        </View>

        <View style={styles.serviceDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Mode</Text>
              <Text style={styles.detailValue}>{service.Mode || 'N/A'}</Text>
            </View>
            {service.Ports && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Ports</Text>
                <Text style={styles.detailValue}>{service.Ports}</Text>
              </View>
            )}
          </View>

          {service.Image && (
            <View style={styles.imageRow}>
              <Ionicons
                name="cube-outline"
                size={12}
                color={theme.colors.textTertiary}
              />
              <Text style={styles.imageText} numberOfLines={1}>
                {service.Image}
              </Text>
            </View>
          )}
        </View>
      </Card>
    );
  };

  if (isLoading && nodes.length === 0 && services.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Swarm" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const data = activeTab === 'nodes' ? nodes : services;
  const isEmpty = data.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Swarm"
        stats={[
          { label: 'nodes', value: nodes.length, color: theme.colors.info },
          { label: 'ready', value: readyNodes, color: theme.colors.success },
          { label: 'managers', value: managerNodes, color: theme.colors.primary },
        ]}
      />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'nodes' && styles.activeTab]}
          onPress={() => setActiveTab('nodes')}
        >
          <Ionicons
            name="server-outline"
            size={16}
            color={
              activeTab === 'nodes'
                ? theme.colors.primary
                : theme.colors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'nodes' && styles.activeTabText,
            ]}
          >
            Nodes ({nodes.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'services' && styles.activeTab]}
          onPress={() => setActiveTab('services')}
        >
          <Ionicons
            name="layers-outline"
            size={16}
            color={
              activeTab === 'services'
                ? theme.colors.primary
                : theme.colors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'services' && styles.activeTabText,
            ]}
          >
            Services ({services.length})
          </Text>
        </TouchableOpacity>
      </View>

      {isEmpty ? (
        <EmptyState
          icon={activeTab === 'nodes' ? 'server-outline' : 'layers-outline'}
          title={activeTab === 'nodes' ? 'No Swarm Nodes' : 'No Swarm Services'}
          description={
            activeTab === 'nodes'
              ? 'Docker Swarm is not initialized or no nodes found'
              : 'No services deployed in the swarm'
          }
        />
      ) : (
        <FlatList
          data={data as any}
          renderItem={activeTab === 'nodes' ? renderNodeCard : renderServiceCard}
          keyExtractor={(item: any) => item.ID}
          contentContainerStyle={styles.list}
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  activeTab: {
    backgroundColor: theme.colors.primaryMuted,
    borderColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  activeTabText: {
    color: theme.colors.primary,
  },
  list: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  card: {
    marginBottom: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  selfBadge: {
    backgroundColor: theme.colors.infoMuted,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  selfBadgeText: {
    fontSize: 9,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.info,
  },
  badges: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  managerBadge: {
    backgroundColor: theme.colors.primaryMuted,
  },
  managerBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary,
  },
  workerBadge: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  workerBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
  },
  replicasBadge: {
    backgroundColor: theme.colors.infoMuted,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  replicasText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.info,
  },
  nodeDetails: {
    gap: theme.spacing.sm,
  },
  serviceDetails: {
    gap: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textPrimary,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
  },
  idText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
    fontFamily: 'monospace',
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
  },
  imageText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    flex: 1,
  },
});
