import { create } from 'zustand';
import { api } from '../services/api';
import { DockerContainer } from '../types';

interface ContainerState {
  containers: DockerContainer[];
  isLoading: boolean;
  error: string | null;

  fetchContainers: (serverId?: string) => Promise<void>;
  restartContainer: (containerId: string) => Promise<void>;
}

export const useContainerStore = create<ContainerState>((set) => ({
  containers: [],
  isLoading: false,
  error: null,

  fetchContainers: async (serverId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const params = serverId ? `?serverId=${serverId}` : '';
      const containers = await api.get<DockerContainer[]>(`/docker.getContainers${params}`);
      set({ containers, isLoading: false });
    } catch (error: any) {
      set({
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
}));
