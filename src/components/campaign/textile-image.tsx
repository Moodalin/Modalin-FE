import type { ImgHTMLAttributes } from 'react'
import { cn } from '@/components/ui/utils'
import type { TextileSource } from '@/constants/textile-sources'

interface TextileImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  imageUrl?: string
  imageAlt?: string
  source?: TextileSource
  imageClassName?: string
  showAttribution?: boolean
  attributionVariant?: 'caption' | 'overlay'
}

export function TextileImage({ imageUrl, imageAlt, source, className, imageClassName, showAttribution = false, attributionVariant = 'caption', ...props }: TextileImageProps) {
  const src = source?.imageUrl ?? imageUrl
  const alt = source?.imageAlt ?? imageAlt
  if (!src) return null
  const attribution = showAttribution && source && <figcaption className={attributionVariant === 'overlay' ? 'absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(37,35,31,.86))] px-4 pb-3 pt-10 text-[10px] leading-4 text-white/85' : 'border-t border-charcoal/15 bg-cotton px-3 py-2 text-[10px] leading-4 text-stone'}>{source.title} · {source.region} · <a href={source.sourceUrl} className="font-bold underline underline-offset-2" target="_blank" rel="noreferrer">Sumber</a></figcaption>
  return <figure className={cn('relative overflow-hidden bg-cotton', className)}><img src={src} alt={alt ?? ''} className={cn('h-full w-full object-cover', imageClassName)} loading="lazy" decoding="async" {...props} />{attribution}</figure>
}
