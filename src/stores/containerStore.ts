import { create } from 'zustand';
import { api } from '../services/api';
import { DockerContainer } from '../types';
import { ensureArray } from '../utils/validation';

export type ServiceType = 'application' | 'compose' | 'postgres' | 'mysql' | 'mariadb' | 'mongo' | 'redis';

interface ContainerState {
  containers: DockerContainer[];
  isLoading: boolean;
  error: string | null;

  fetchContainers: (serverId?: string) => Promise<void>;
  restartContainer: (containerId: string) => Promise<void>;
  stopService: (serviceId: string, serviceType: ServiceType) => Promise<void>;
  startService: (serviceId: string, serviceType: ServiceType) => Promise<void>;
  redeployService: (serviceId: string, serviceType: ServiceType) => Promise<void>;
}

// Map service types to their API endpoints and ID field names
const serviceConfig: Record<ServiceType, { endpoint: string; idField: string }> = {
  application: { endpoint: 'application', idField: 'applicationId' },
  compose: { endpoint: 'compose', idField: 'composeId' },
  postgres: { endpoint: 'postgres', idField: 'postgresId' },
  mysql: { endpoint: 'mysql', idField: 'mysqlId' },
  mariadb: { endpoint: 'mariadb', idField: 'mariadbId' },
  mongo: { endpoint: 'mongo', idField: 'mongoId' },
  redis: { endpoint: 'redis', idField: 'redisId' },
};

export const useContainerStore = create<ContainerState>((set) => ({
  containers: [],
  isLoading: false,
  error: null,

  fetchContainers: async (serverId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const params = serverId ? `?serverId=${serverId}` : '';
      const response = await api.get<DockerContainer[]>(`/docker.getContainers${params}`);
      set({ containers: ensureArray(response), isLoading: false });
    } catch (error: any) {
      set({
        containers: [],
        error: error.response?.data?.message || 'Failed to fetch containers',
        isLoading: false
      });
    }
  },

  restartContainer: async (containerId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/docker.restartContainer', { containerId });
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to restart container',
        isLoading: false
      });
      throw error;
    }
  },

  stopService: async (serviceId: string, serviceType: ServiceType) => {
    set({ isLoading: true, error: null });
    try {
      const config = serviceConfig[serviceType];
      await api.post(`/${config.endpoint}.stop`, { [config.idField]: serviceId });
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || `Failed to stop ${serviceType}`,
        isLoading: false
      });
      throw error;
    }
  },

  startService: async (serviceId: string, serviceType: ServiceType) => {
    set({ isLoading: true, error: null });
    try {
      const config = serviceConfig[serviceType];
      await api.post(`/${config.endpoint}.start`, { [config.idField]: serviceId });
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || `Failed to start ${serviceType}`,
        isLoading: false
      });
      throw error;
    }
  },

  redeployService: async (serviceId: string, serviceType: ServiceType) => {
    set({ isLoading: true, error: null });
    try {
      const config = serviceConfig[serviceType];
      // Only applications and compose support redeploy
      if (serviceType === 'application' || serviceType === 'compose') {
        await api.post(`/${config.endpoint}.redeploy`, { [config.idField]: serviceId });
      } else {
        // For databases, use reload/restart equivalent
        await api.post(`/${config.endpoint}.reload`, { [config.idField]: serviceId });
      }
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || `Failed to redeploy ${serviceType}`,
        isLoading: false
      });
      throw error;
    }
  },
}));
