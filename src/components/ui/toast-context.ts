import { createContext } from 'react'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'
export type ToastInput = { message: string; variant?: ToastVariant; duration?: number }
export type ToastContextValue = {
  toast: (input: ToastInput) => string
  dismiss: (id: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
