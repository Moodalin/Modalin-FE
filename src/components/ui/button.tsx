import { LoaderCircle } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '@/components/ui/utils'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'dark'

const styles: Record<ButtonVariant, string> = {
  primary: 'border border-primary-dark bg-primary-dark !text-white hover:border-ink hover:bg-ink hover:!text-white',
  secondary: 'border border-amber bg-amber !text-ink hover:border-ink hover:bg-ink hover:!text-white',
  outline: 'border border-primary-dark bg-transparent !text-primary-dark hover:bg-primary-dark hover:!text-white',
  ghost: 'border border-transparent bg-transparent !text-primary-dark hover:border-line hover:bg-white hover:!text-primary-dark',
  dark: 'border border-ink bg-ink !text-white hover:border-primary-dark hover:bg-primary-dark hover:!text-white',
}

const base = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-extrabold tracking-[-.01em] transition-all focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary-dark disabled:cursor-not-allowed disabled:opacity-50'

export function Button({ className, variant = 'primary', loading = false, disabled, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; loading?: boolean }) {
  return <button className={cn(base, styles[variant], className)} aria-busy={loading || undefined} disabled={disabled || loading} {...props}>{loading && <LoaderCircle size={16} className="shrink-0 animate-spin" aria-hidden="true" />}{children}</button>
}

export function ButtonLink({ className, variant = 'primary', children, ...props }: LinkProps & { variant?: ButtonVariant; children: ReactNode }) {
  return <Link className={cn(base, styles[variant], className)} {...props}>{children}</Link>
}
