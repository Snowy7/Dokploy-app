import { create } from 'zustand';
import { api } from '../services/api';
import { Project, Environment } from '../types';
import { ensureArray } from '../utils/validation';

interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  environments: Environment[];
  isLoading: boolean;
  error: string | null;

  fetchProjects: () => Promise<void>;
  fetchEnvironments: (projectId: string) => Promise<void>;
  selectProject: (project: Project) => void;
  createProject: (name: string, description?: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  selectedProject: null,
  environments: [],
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<Project[]>('/project.all');
      set({ projects: ensureArray(response), isLoading: false });
    } catch (error: any) {
      set({
        projects: [],
        error: error.response?.data?.message || 'Failed to fetch projects',
        isLoading: false
      });
    }
  },

  fetchEnvironments: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<Environment[]>(`/environment.byProjectId?projectId=${projectId}`);
      set({ environments: ensureArray(response), isLoading: false });
    } catch (error: any) {
      set({
        environments: [],
        error: error.response?.data?.message || 'Failed to fetch environments',
        isLoading: false
      });
    }
  },

  selectProject: (project: Project) => {
    set({ selectedProject: project });
  },

  createProject: async (name: string, description?: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/project.create', { name, description });
      await get().fetchProjects();
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create project',
        isLoading: false
      });
      throw error;
    }
  },

  deleteProject: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/project.remove', { projectId });
      await get().fetchProjects();
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete project',
        isLoading: false
      });
      throw error;
    }
  },
}));
