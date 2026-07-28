import type { ToastInput, ToastVariant } from '@/components/ui/toast-context'

export type ToastRecord = ToastInput & { id: string; variant: ToastVariant; duration: number }
export type ToastAction = { type: 'add'; toast: ToastRecord } | { type: 'dismiss'; id: string }

export function toastReducer(state: ToastRecord[], action: ToastAction): ToastRecord[] {
  if (action.type === 'add') return [...state, action.toast]
  return state.filter((toast) => toast.id !== action.id)
}
