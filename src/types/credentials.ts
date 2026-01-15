/**
 * Configuration for a single API key
 */
export interface ApiKeyConfig {
  id: string;
  name: string;
  apiKey: string;
  createdAt: string;
  lastUsedAt?: string;
}

/**
 * Main credentials configuration
 * Supports one server URL with multiple API keys
 */
export interface CredentialsConfig {
  serverUrl: string;
  activeKeyId: string | null;
  apiKeys: ApiKeyConfig[];
}

/**
 * Default empty credentials config
 */
export const DEFAULT_CREDENTIALS_CONFIG: CredentialsConfig = {
  serverUrl: '',
  activeKeyId: null,
  apiKeys: [],
};
