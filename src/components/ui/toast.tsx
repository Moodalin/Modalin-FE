import { useCallback, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import { ToastContext, type ToastInput } from '@/components/ui/toast-context'
import { toastReducer, type ToastRecord } from '@/components/ui/toast-state'

const icons = { success: CircleCheck, error: CircleAlert, info: Info, warning: TriangleAlert }
const labels = { success: 'Berhasil', error: 'Gagal', info: 'Informasi', warning: 'Peringatan' }

function ToastViewport({ toasts, dismiss }: { toasts: ToastRecord[]; dismiss: (id: string) => void }) {
  return <div className="toast-viewport" aria-label="Notifikasi">
    {toasts.map((toast) => {
      const Icon = icons[toast.variant]
      return <div key={toast.id} className={`toast toast-${toast.variant}`} role={toast.variant === 'error' ? 'alert' : 'status'} aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}>
        <Icon size={19} aria-hidden="true" />
        <div><strong>{labels[toast.variant]}</strong><p>{toast.message}</p></div>
        <button type="button" className="toast-dismiss" onClick={() => dismiss(toast.id)} aria-label="Tutup notifikasi"><X size={17} aria-hidden="true" /></button>
      </div>
    })}
  </div>
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(toastReducer, [])
  const nextId = useRef(0)
  const dismiss = useCallback((id: string) => dispatch({ type: 'dismiss', id }), [])
  const toast = useCallback((input: ToastInput) => {
    const id = `toast-${nextId.current++}`
    const record: ToastRecord = { ...input, id, variant: input.variant ?? 'info', duration: input.duration ?? 5000 }
    dispatch({ type: 'add', toast: record })
    return id
  }, [])

  useEffect(() => {
    const timers = toasts.map((item) => window.setTimeout(() => dismiss(item.id), item.duration))
    return () => timers.forEach(window.clearTimeout)
  }, [dismiss, toasts])
  const value = useMemo(() => ({ toast, dismiss }), [dismiss, toast])

  return <ToastContext value={value}><>{children}<ToastViewport toasts={toasts} dismiss={dismiss} /></></ToastContext>
}
