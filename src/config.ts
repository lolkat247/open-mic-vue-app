// App configuration
// These values should be updated after CDK deployment

import type { AppConfig } from './types/views'

export const config: AppConfig = {
  // Configured from CDK deployment outputs (OpenMicBackendApiStack)
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://ron7jxwp78.execute-api.us-east-1.amazonaws.com/prod/',
  websocketUrl: import.meta.env.VITE_WEBSOCKET_URL || 'wss://bfynx6i5u2.execute-api.us-east-1.amazonaws.com/prod',
  userPoolId: import.meta.env.VITE_USER_POOL_ID || 'us-east-1_wQnSJZ3oF',
  userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || '7q4qj1a1t3ll33a7ormd1j7i2k',
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1'
}