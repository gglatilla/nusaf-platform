// API module index - re-exports types and client

// Re-export all types
export * from './types';

// Re-export client utilities
export { ApiError, BaseApiClient, API_URL } from './client';

// Note: The full ApiClient with all methods is still in ../api.ts
// for backwards compatibility. Types have been extracted to ./types/
