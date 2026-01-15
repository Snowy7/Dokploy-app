import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { CredentialsConfig, ApiKeyConfig, DEFAULT_CREDENTIALS_CONFIG } from '../types/credentials';

const STORAGE_KEYS = {
  CREDENTIALS_CONFIG: 'dokploy_credentials_config',
  // Legacy keys for migration
  API_KEY: 'dokploy_api_key',
  SERVER_URL: 'dokploy_server_url',
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

class ApiClient {
  private client: AxiosInstance;
  private credentialsCache: CredentialsConfig | null = null;

  constructor() {
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      async (config) => {
        const credentials = await this.getCredentialsConfig();

        if (credentials.serverUrl && !config.baseURL) {
          config.baseURL = credentials.serverUrl;
        }

        const activeKey = this.getActiveApiKey(credentials);
        if (activeKey) {
          config.headers['x-api-key'] = activeKey.apiKey;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.error('API authentication failed');
        }
        return Promise.reject(error);
      }
    );
  }

  private getActiveApiKey(config: CredentialsConfig): ApiKeyConfig | null {
    if (!config.activeKeyId || config.apiKeys.length === 0) {
      return null;
    }
    return config.apiKeys.find(k => k.id === config.activeKeyId) || null;
  }

  /**
   * Get credentials config from storage
   */
  async getCredentialsConfig(): Promise<CredentialsConfig> {
    if (this.credentialsCache) {
      return this.credentialsCache;
    }

    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEYS.CREDENTIALS_CONFIG);
      if (stored) {
        this.credentialsCache = JSON.parse(stored);
        return this.credentialsCache!;
      }

      // Check for legacy credentials and migrate
      const legacyServerUrl = await SecureStore.getItemAsync(STORAGE_KEYS.SERVER_URL);
      const legacyApiKey = await SecureStore.getItemAsync(STORAGE_KEYS.API_KEY);

      if (legacyServerUrl && legacyApiKey) {
        const migratedConfig: CredentialsConfig = {
          serverUrl: legacyServerUrl,
          activeKeyId: generateId(),
          apiKeys: [{
            id: generateId(),
            name: 'Default',
            apiKey: legacyApiKey,
            createdAt: new Date().toISOString(),
          }],
        };
        migratedConfig.activeKeyId = migratedConfig.apiKeys[0].id;

        await this.saveCredentialsConfig(migratedConfig);

        // Clean up legacy storage
        await SecureStore.deleteItemAsync(STORAGE_KEYS.API_KEY);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.SERVER_URL);

        return migratedConfig;
      }

      return { ...DEFAULT_CREDENTIALS_CONFIG };
    } catch (error) {
      console.error('Failed to load credentials:', error);
      return { ...DEFAULT_CREDENTIALS_CONFIG };
    }
  }

  /**
   * Save credentials config to storage
   */
  async saveCredentialsConfig(config: CredentialsConfig): Promise<void> {
    await SecureStore.setItemAsync(
      STORAGE_KEYS.CREDENTIALS_CONFIG,
      JSON.stringify(config)
    );
    this.credentialsCache = config;
  }

  /**
   * Set server URL (first time setup or change server)
   */
  async setServerUrl(serverUrl: string): Promise<void> {
    const normalizedUrl = serverUrl.replace(/\/+$/, '');
    const apiUrl = normalizedUrl.endsWith('/api') ? normalizedUrl : `${normalizedUrl}/api`;

    const config = await this.getCredentialsConfig();
    config.serverUrl = apiUrl;
    await this.saveCredentialsConfig(config);
  }

  /**
   * Add a new API key
   */
  async addApiKey(name: string, apiKey: string): Promise<ApiKeyConfig> {
    const config = await this.getCredentialsConfig();

    const newKey: ApiKeyConfig = {
      id: generateId(),
      name,
      apiKey,
      createdAt: new Date().toISOString(),
    };

    config.apiKeys.push(newKey);

    // If this is the first key, make it active
    if (config.apiKeys.length === 1) {
      config.activeKeyId = newKey.id;
    }

    await this.saveCredentialsConfig(config);
    return newKey;
  }

  /**
   * Remove an API key
   */
  async removeApiKey(keyId: string): Promise<void> {
    const config = await this.getCredentialsConfig();

    config.apiKeys = config.apiKeys.filter(k => k.id !== keyId);

    // If we removed the active key, switch to the first available
    if (config.activeKeyId === keyId) {
      config.activeKeyId = config.apiKeys.length > 0 ? config.apiKeys[0].id : null;
    }

    await this.saveCredentialsConfig(config);
  }

  /**
   * Switch to a different API key
   */
  async switchApiKey(keyId: string): Promise<void> {
    const config = await this.getCredentialsConfig();

    const key = config.apiKeys.find(k => k.id === keyId);
    if (!key) {
      throw new Error('API key not found');
    }

    config.activeKeyId = keyId;
    key.lastUsedAt = new Date().toISOString();

    await this.saveCredentialsConfig(config);
  }

  /**
   * Update API key name
   */
  async updateApiKeyName(keyId: string, name: string): Promise<void> {
    const config = await this.getCredentialsConfig();

    const key = config.apiKeys.find(k => k.id === keyId);
    if (key) {
      key.name = name;
      await this.saveCredentialsConfig(config);
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async setCredentials(serverUrl: string, apiKey: string, keyName: string = 'Default'): Promise<void> {
    const normalizedUrl = serverUrl.replace(/\/+$/, '');
    const apiUrl = normalizedUrl.endsWith('/api') ? normalizedUrl : `${normalizedUrl}/api`;

    const newKeyId = generateId();
    const config: CredentialsConfig = {
      serverUrl: apiUrl,
      activeKeyId: newKeyId,
      apiKeys: [{
        id: newKeyId,
        name: keyName,
        apiKey,
        createdAt: new Date().toISOString(),
      }],
    };

    await this.saveCredentialsConfig(config);
  }

  /**
   * Clear all credentials
   */
  async clearCredentials(): Promise<void> {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.CREDENTIALS_CONFIG);
    this.credentialsCache = null;
  }

  /**
   * Check if there are valid credentials
   */
  async hasCredentials(): Promise<boolean> {
    const config = await this.getCredentialsConfig();
    return !!(config.serverUrl && config.activeKeyId && config.apiKeys.length > 0);
  }

  /**
   * Get the current active key info
   */
  async getActiveKey(): Promise<ApiKeyConfig | null> {
    const config = await this.getCredentialsConfig();
    return this.getActiveApiKey(config);
  }

  /**
   * Get all API keys
   */
  async getApiKeys(): Promise<ApiKeyConfig[]> {
    const config = await this.getCredentialsConfig();
    return config.apiKeys;
  }

  /**
   * Get server URL
   */
  async getServerUrl(): Promise<string> {
    const config = await this.getCredentialsConfig();
    return config.serverUrl;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const api = new ApiClient();
