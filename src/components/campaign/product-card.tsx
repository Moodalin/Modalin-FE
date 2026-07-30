import { ArrowRight, Check, Package } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TextileImage } from '@/components/campaign/textile-image'
import { formatRupiah } from '@/config/format'
import { RichTextView } from '@/components/ui/rich-text'
import type { Product } from '@/types/campaign'

export function ProductCard({ product, campaignId, orderingOpen = true }: { product: Product; campaignId?: string; orderingOpen?: boolean }) {
  const checkoutPath = `/checkout?product=${product.id}${campaignId ? `&campaign=${encodeURIComponent(campaignId)}` : ''}`

  return <article className="group grid overflow-hidden rounded-2xl border border-line bg-white transition-shadow duration-300 hover:shadow-[0_18px_38px_rgba(29,37,34,.09)] lg:grid-cols-[.9fr_1.1fr]">
    <TextileImage imageUrl={product.imageUrl} imageAlt={product.imageAlt} className="aspect-[4/3] lg:aspect-auto lg:min-h-72" imageClassName="transition-transform duration-500 group-hover:scale-[1.025]" />
    <div className="flex flex-col p-5 sm:p-6">
      <p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-primary-dark">{product.type}</p>
      <h3 className="mt-2 text-2xl font-extrabold tracking-[-.04em] text-ink">{product.name}</h3>
      <RichTextView value={product.description} className="mt-3 line-clamp-3 text-sm leading-6" />
      <div className="mt-auto pt-6">
        <p className="text-xl font-extrabold tracking-[-.03em] text-ink">{formatRupiah(product.price)}</p>
        <div className="mt-4 flex items-center justify-between gap-4"><span className="text-xs font-bold text-muted">{product.variants.length} pilihan</span>{orderingOpen ? <ButtonLink to={checkoutPath} className="min-h-10 rounded-lg px-4 py-2 text-xs">Pesan <ArrowRight size={15} aria-hidden="true" /></ButtonLink> : <span className="rounded-lg bg-cream px-3 py-2 text-xs font-bold text-muted">Ditutup</span>}</div>
      </div>
    </div>
  </article>
}

export function FeatureList({ items }: { items: string[] }) {
  return <ul className="grid gap-3">{items.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-muted"><span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-primary-dark"><Check size={14} aria-hidden="true" /></span><span>{item}</span></li>)}</ul>
}

export function OrderStatus({ status }: { status: string }) {
  const labels: Record<string, string> = { PENDING: 'Menunggu pembayaran', CONFIRMED: 'Dikonfirmasi', IN_PRODUCTION: 'Dalam produksi', SHIPPED: 'Dikirim', DELIVERED: 'Terkirim', CANCELLED: 'Dibatalkan' }
  const confirmed = status === 'CONFIRMED'
  return <Badge className={confirmed ? 'bg-primary/10 text-primary-dark' : 'bg-amber/15 text-ink'}><Package size={13} aria-hidden="true" />{labels[status] ?? 'Status pesanan belum tersedia'}</Badge>
}
