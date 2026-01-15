import { api } from './api';

export interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  image?: string | null;
  createdAt: string;
  isRegistered?: boolean;
  twoFactorEnabled?: boolean | null;
}

class AuthService {
  async connect(serverUrl: string, apiKey: string, keyName: string = 'Default'): Promise<User> {
    // Save credentials with key name
    await api.setCredentials(serverUrl, apiKey, keyName);

    // Test connection by fetching user info
    try {
      const user = await this.getCurrentUser();
      return user;
    } catch (error: any) {
      // Clear credentials if connection fails
      await api.clearCredentials();
      throw error;
    }
  }

  async logout(): Promise<void> {
    await api.clearCredentials();
  }

  async isConnected(): Promise<boolean> {
    return await api.hasCredentials();
  }

  async getCurrentUser(): Promise<User> {
    return await api.get<User>('/user.get');
  }
}

export const authService = new AuthService();
