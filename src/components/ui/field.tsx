import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { cn } from '@/components/ui/utils'

type FieldShellProps = { id: string; label: string; error?: string; hint?: string; children: ReactNode }

export function FieldShell({ id, label, error, hint, children }: FieldShellProps) {
  return <div className="grid gap-2"><label id={`${id}-label`} htmlFor={id} className="text-sm font-extrabold tracking-[-.01em] text-ink">{label}</label>{children}{hint && !error && <p id={`${id}-hint`} className="text-xs leading-relaxed text-muted">{hint}</p>}{error && <p id={`${id}-error`} role="alert" className="text-xs font-bold text-error">{error}</p>}</div>
}

export const controlClass = 'min-h-12 w-full rounded-xl border border-line bg-white px-4 text-base text-ink outline-none transition placeholder:text-muted/70 focus:border-primary-dark focus:ring-4 focus:ring-primary/15 disabled:opacity-60'

export function Input({ id, label, error, hint, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; error?: string; hint?: string }) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return <FieldShell id={id} label={label} error={error} hint={hint}><input id={id} className={cn(controlClass, className)} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...props} /></FieldShell>
}

export function Textarea({ id, label, error, hint, className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string; label: string; error?: string; hint?: string }) {
  return <FieldShell id={id} label={label} error={error} hint={hint}><textarea id={id} className={cn(controlClass, 'min-h-32 py-3', className)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} {...props} /></FieldShell>
}
