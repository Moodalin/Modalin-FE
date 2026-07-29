import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel: string
  cancelLabel?: string
  pending?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({ open, title, description, confirmLabel, cancelLabel = 'Batal', pending = false, onCancel, onConfirm }: ConfirmDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusTimer = window.setTimeout(() => dialogRef.current?.querySelector<HTMLElement>('button:not([disabled])')?.focus())
    return () => window.clearTimeout(focusTimer)
  }, [open])

  useEffect(() => {
    if (open) return
    triggerRef.current?.focus()
    triggerRef.current = null
  }, [open])

  if (!open) return null

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && !pending) {
      event.preventDefault()
      onCancel()
      return
    }
    if (event.key !== 'Tab') return

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
    if (!focusable?.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] grid place-items-center bg-ink/35 px-5 py-6" role="presentation" onClick={(event) => { if (!pending && event.target === event.currentTarget) onCancel() }}>
      <div ref={dialogRef} role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} tabIndex={-1} onKeyDown={handleKeyDown} className="w-full max-w-md rounded-2xl border border-line bg-white p-5 shadow-[0_24px_60px_rgba(29,37,34,.24)] sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><h2 id={titleId} className="text-lg font-extrabold text-ink">{title}</h2><p id={descriptionId} className="mt-2 text-sm leading-6 text-muted">{description}</p></div><button type="button" onClick={onCancel} disabled={pending} aria-label="Tutup konfirmasi" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-muted hover:bg-cream hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark disabled:cursor-not-allowed disabled:opacity-50"><X size={18} aria-hidden="true" /></button></div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={onCancel} disabled={pending}>{cancelLabel}</Button><Button type="button" variant="dark" onClick={onConfirm} disabled={pending} loading={pending}>{pending ? `${confirmLabel}…` : confirmLabel}</Button></div>
      </div>
    </div>,
    document.body,
  )
}
