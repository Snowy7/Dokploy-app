import { create } from 'zustand';
import { api } from '../services/api';
import { Application } from '../types';

interface ApplicationState {
  applications: Application[];
  selectedApplication: Application | null;
  isLoading: boolean;
  error: string | null;

  fetchApplication: (applicationId: string) => Promise<void>;
  deployApplication: (applicationId: string) => Promise<void>;
  redeployApplication: (applicationId: string, title?: string, description?: string) => Promise<void>;
  startApplication: (applicationId: string) => Promise<void>;
  stopApplication: (applicationId: string) => Promise<void>;
  deleteApplication: (applicationId: string) => Promise<void>;
  selectApplication: (application: Application) => void;
}

export const useApplicationStore = create<ApplicationState>((set) => ({
  applications: [],
  selectedApplication: null,
  isLoading: false,
  error: null,

  fetchApplication: async (applicationId: string) => {
    set({ isLoading: true, error: null });
    try {
      const application = await api.get<Application>(`/application.one?applicationId=${applicationId}`);
      set({ selectedApplication: application, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch application',
        isLoading: false
      });
    }
  },

  deployApplication: async (applicationId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/application.deploy', { applicationId });
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to deploy application',
        isLoading: false
      });
      throw error;
    }
  },

  redeployApplication: async (applicationId: string, title?: string, description?: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/application.redeploy', { applicationId, title, description });
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to redeploy application',
        isLoading: false
      });
      throw error;
    }
  },

  startApplication: async (applicationId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/application.start', { applicationId });
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to start application',
        isLoading: false
      });
      throw error;
    }
  },

  stopApplication: async (applicationId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/application.stop', { applicationId });
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to stop application',
        isLoading: false
      });
      throw error;
    }
  },

  deleteApplication: async (applicationId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/application.delete', { applicationId });
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete application',
        isLoading: false
      });
      throw error;
    }
  },

  selectApplication: (application: Application) => {
    set({ selectedApplication: application });
  },
}));
