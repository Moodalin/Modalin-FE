import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/components/ui/utils'

type SkeletonBlockProps = {
  className?: string
  delay?: number
  reduceMotion: boolean | null
}

function SkeletonBlock({ className, delay = 0, reduceMotion }: SkeletonBlockProps) {
  return (
    <motion.div
      aria-hidden="true"
      className={cn('rounded bg-[linear-gradient(110deg,var(--color-line)_20%,white_45%,var(--color-line)_70%)] bg-[length:200%_100%]', className)}
      animate={reduceMotion ? { opacity: 0.72 } : { backgroundPosition: ['200% 0', '-200% 0'], opacity: [0.62, 1, 0.62] }}
      transition={reduceMotion ? { duration: 0 } : { backgroundPosition: { duration: 1.8, repeat: Infinity, ease: 'linear', delay }, opacity: { duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay } }}
    />
  )
}


export function CampaignCollectionLoading({ id = 'collection', title = 'Preview koleksi kain tenun' }: { id?: string; title?: string }) {
  const reduceMotion = useReducedMotion()
  const titleId = `${id}-loading-title`

  return (
    <section id={id} aria-labelledby={titleId} aria-busy="true" className="bg-white px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-[1120px]">
        <h2 id={titleId} className="sr-only">{title}</h2>
        <div aria-hidden="true" className="mt-7 flex items-center justify-center gap-3 overflow-hidden sm:gap-5">
          {Array.from({ length: 5 }, (_, index) => {
            const isActive = index === 2
            const isOuter = index === 0 || index === 4
            return <div key={index} className={isActive ? 'h-[280px] w-[300px] rounded-lg border border-primary bg-white p-4 shadow-[0_5px_12px_rgba(8,116,95,.14)]' : isOuter ? 'hidden h-[126px] w-[136px] rounded-md border border-line bg-white p-3 opacity-45 sm:block' : 'h-[210px] w-[225px] rounded-md border border-line bg-white p-4 opacity-80'}>
              <SkeletonBlock className="h-[52%] w-full" delay={index * 0.12} reduceMotion={reduceMotion} />
              <SkeletonBlock className="mt-3 h-2 w-4/5" delay={index * 0.12 + 0.08} reduceMotion={reduceMotion} />
              <SkeletonBlock className="mt-2 h-1.5 w-full" delay={index * 0.12 + 0.16} reduceMotion={reduceMotion} />
              <SkeletonBlock className="mt-3 h-1 w-full" delay={index * 0.12 + 0.24} reduceMotion={reduceMotion} />
            </div>
          })}
        </div>
      </div>
    </section>
  )
}


