import { cn } from '@/components/ui/utils'

export function Progress({ value, label, className, showValue = true }: { value: number; label: string; className?: string; showValue?: boolean }) {
  const clamped = Math.min(100, Math.max(0, value))
  return <div className={cn('grid gap-2', className)}>
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="font-bold text-ink">{label}</span>
      {showValue && <strong className="font-extrabold text-primary-dark">{Math.round(clamped)}%</strong>}
    </div>
    <div className="h-2.5 overflow-hidden rounded-full bg-primary-dark/10" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(clamped)}>
      <div className="h-full rounded-full bg-primary transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${clamped}%` }} />
    </div>
  </div>
}
