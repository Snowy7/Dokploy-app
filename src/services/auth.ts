import * as SecureStore from 'expo-secure-store';
import { api } from './api';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  image?: string;
}

class AuthService {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    // Note: Adjust this based on actual Dokploy auth endpoint
    const response = await api.post<{ user: User; token: string }>('/auth/login', {
      email,
      password,
    });

    await SecureStore.setItemAsync('auth_token', response.token);
    await SecureStore.setItemAsync('user', JSON.stringify(response.user));

    return response;
  }

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('user');
  }

  async getStoredUser(): Promise<User | null> {
    const userStr = await SecureStore.getItemAsync('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  async getStoredToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('auth_token');
  }

  async getCurrentUser(): Promise<User> {
    return await api.get<User>('/user.get');
  }
}

export const authService = new AuthService();
