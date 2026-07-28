import { createAuthClient } from 'better-auth/react'
import { ApiService } from '@/constants/api-service'

export const authClient = createAuthClient({
  baseURL: ApiService.baseUrl,
})
