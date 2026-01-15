import { create } from 'zustand';
import { User, authService } from '../services/auth';
import { api } from '../services/api';
import { ApiKeyConfig } from '../types/credentials';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  apiKeys: ApiKeyConfig[];
  activeKeyId: string | null;
  serverUrl: string;

  connect: (serverUrl: string, apiKey: string, keyName?: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  loadApiKeys: () => Promise<void>;
  addApiKey: (name: string, apiKey: string) => Promise<void>;
  removeApiKey: (keyId: string) => Promise<void>;
  switchApiKey: (keyId: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  apiKeys: [],
  activeKeyId: null,
  serverUrl: '',

  connect: async (serverUrl: string, apiKey: string, keyName: string = 'Default') => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.connect(serverUrl, apiKey, keyName);
      const config = await api.getCredentialsConfig();
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        apiKeys: config.apiKeys,
        activeKeyId: config.activeKeyId,
        serverUrl: config.serverUrl,
      });
    } catch (error: any) {
      let message = 'Connection failed';

      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        message = 'Invalid API key';
      } else if (error.response?.status === 404) {
        message = 'Server not found or invalid URL';
      } else if (error.message) {
        message = error.message;
      }

      set({
        error: message,
        isLoading: false
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        apiKeys: [],
        activeKeyId: null,
        serverUrl: '',
      });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  loadUser: async () => {
    set({ isLoading: true });
    try {
      const isConnected = await authService.isConnected();
      if (isConnected) {
        const user = await authService.getCurrentUser();
        const config = await api.getCredentialsConfig();
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          apiKeys: config.apiKeys,
          activeKeyId: config.activeKeyId,
          serverUrl: config.serverUrl,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      await authService.logout();
      set({ isLoading: false });
    }
  },

  loadApiKeys: async () => {
    try {
      const config = await api.getCredentialsConfig();
      set({
        apiKeys: config.apiKeys,
        activeKeyId: config.activeKeyId,
        serverUrl: config.serverUrl,
      });
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  },

  addApiKey: async (name: string, apiKey: string) => {
    set({ isLoading: true, error: null });
    try {
      // Validate the new key by making a test request
      const currentServerUrl = get().serverUrl;
      if (!currentServerUrl) {
        throw new Error('No server configured');
      }

      // Add the key
      const newKey = await api.addApiKey(name, apiKey);

      // Test the new key by switching to it and fetching user
      await api.switchApiKey(newKey.id);

      try {
        const user = await authService.getCurrentUser();
        const config = await api.getCredentialsConfig();
        set({
          user,
          apiKeys: config.apiKeys,
          activeKeyId: config.activeKeyId,
          isLoading: false,
        });
      } catch (testError) {
        // Key is invalid, remove it and switch back
        await api.removeApiKey(newKey.id);
        const prevActiveId = get().activeKeyId;
        if (prevActiveId) {
          await api.switchApiKey(prevActiveId);
        }
        throw new Error('Invalid API key');
      }
    } catch (error: any) {
      set({
        error: error.message || 'Failed to add API key',
        isLoading: false,
      });
      throw error;
    }
  },

  removeApiKey: async (keyId: string) => {
    const { apiKeys, activeKeyId } = get();

    // Don't allow removing the last key
    if (apiKeys.length <= 1) {
      set({ error: 'Cannot remove the last API key' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      await api.removeApiKey(keyId);

      // If we removed the active key, we need to reload user with new active key
      if (keyId === activeKeyId) {
        const user = await authService.getCurrentUser();
        const config = await api.getCredentialsConfig();
        set({
          user,
          apiKeys: config.apiKeys,
          activeKeyId: config.activeKeyId,
          isLoading: false,
        });
      } else {
        const config = await api.getCredentialsConfig();
        set({
          apiKeys: config.apiKeys,
          isLoading: false,
        });
      }
    } catch (error: any) {
      set({
        error: error.message || 'Failed to remove API key',
        isLoading: false,
      });
    }
  },

  switchApiKey: async (keyId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.switchApiKey(keyId);
      const user = await authService.getCurrentUser();
      const config = await api.getCredentialsConfig();
      set({
        user,
        apiKeys: config.apiKeys,
        activeKeyId: config.activeKeyId,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to switch API key',
        isLoading: false,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
