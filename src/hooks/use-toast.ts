import { use } from 'react'
import { ToastContext } from '@/components/ui/toast-context'

export function useToast() {
  const context = use(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
