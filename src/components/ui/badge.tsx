import type { HTMLAttributes } from 'react'
import { cn } from '@/components/ui/utils'

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('inline-flex w-fit items-center gap-1.5 rounded-full border border-current/20 bg-white px-3 py-1.5 text-[11px] font-extrabold tracking-[.02em]', className)} {...props} />
}
