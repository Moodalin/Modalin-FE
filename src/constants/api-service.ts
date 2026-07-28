export const ApiService = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  timeoutMs: 15_000,
} as const
