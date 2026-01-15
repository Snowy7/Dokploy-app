export default ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    dokployServerUrl: process.env.EXPO_PUBLIC_DOKPLOY_SERVER_URL || '',
    dokployApiKey: process.env.EXPO_PUBLIC_DOKPLOY_API_KEY || '',
  },
});
