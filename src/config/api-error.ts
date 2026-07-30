type ErrorPayload = {
  message?: unknown
  error?: unknown
  detail?: unknown
  data?: unknown
  response?: unknown
}

function readMessage(value: unknown): string | null {
  if (typeof value === 'string') {
    const message = value.trim()
    if (!message || message === '[object Object]' || message === 'Error') return null
    return message
  }
  if (!value || typeof value !== 'object') return null
  const payload = value as ErrorPayload
  return readMessage(payload.message) || readMessage(payload.error) || readMessage(payload.detail)
}

const translatedMessages: Record<string, string> = {
  'This campaign is not open for pre-orders.': 'Kampanye ini sudah tidak menerima pre-order.',
  'The requested quantity exceeds the available production capacity.': 'Jumlah yang diminta melebihi kapasitas produksi yang tersedia.',
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') return fallback
  const payload = error as ErrorPayload
  const backendMessage = readMessage((payload.response as ErrorPayload | undefined)?.data) || readMessage(payload.data)
  if (backendMessage) return translatedMessages[backendMessage] ?? backendMessage
  if (error instanceof Error) return fallback
  return readMessage(error) || fallback
}
