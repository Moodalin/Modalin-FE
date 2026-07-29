import { ApiService } from '@/constants/api-service'

type RequestOptions = RequestInit & { timeoutMs?: number }

export interface ApiSuccess<T> {
  status: 'success'
  message: string
  data: T
}

export class ApiError extends Error {
  status: number
  data: unknown

  constructor(status: number, data: unknown) {
    super(`API request failed with ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController()
  const sourceSignal = options.signal
  const abortFromSource = () => controller.abort(sourceSignal?.reason)
  if (sourceSignal?.aborted) abortFromSource()
  else sourceSignal?.addEventListener('abort', abortFromSource, { once: true })
  const timeout = window.setTimeout(() => controller.abort(), options.timeoutMs ?? ApiService.timeoutMs)
  try {
    const isFormData = options.body instanceof FormData
    const response = await fetch(`${ApiService.baseUrl}${path}`, {
      ...options,
      credentials: 'include',
      signal: controller.signal,
      headers: { ...(isFormData ? {} : { 'Content-Type': 'application/json' }), ...options.headers },
    })
    const data = await response.json().catch(() => null) as unknown
    if (!response.ok) throw new ApiError(response.status, data)
    return data as T
  } finally {
    window.clearTimeout(timeout)
    sourceSignal?.removeEventListener('abort', abortFromSource)
  }
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, options),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  postForm: <T>(path: string, body: FormData) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
