import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, CreditCard, PackageCheck, PackageOpen, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { continueOrderPayment, getOrderHistory } from '@/api/orders/orders'
import { MarketingHeader } from '@/components/layout/marketing'
import { Button, ButtonLink } from '@/components/ui/button'
import { getApiErrorMessage } from '@/config/api-error'
import { formatRupiah } from '@/config/format'
import { useToast } from '@/hooks/use-toast'
import type { OrderHistoryItem, OrderPaymentStatus, OrderShippingStatus, OrderStatus } from '@/types/campaign'

const orderDateFormatter = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' })
const orderStatusLabels: Record<OrderStatus, string> = {
  CONDITIONAL: 'Menunggu target kampanye',
  CONFIRMED: 'Pesanan dikonfirmasi',
  PACKED: 'Pesanan dikemas',
  SHIPPED: 'Pesanan dikirim',
  DELIVERED: 'Pesanan diterima',
  CANCELLED: 'Pesanan dibatalkan',
  REFUNDED: 'Pesanan dikembalikan',
}
const paymentStatusLabels: Record<OrderPaymentStatus, string> = {
  PENDING: 'Menunggu pembayaran',
  PAID: 'Sudah dibayar',
  FAILED: 'Pembayaran gagal',
  REFUND_PENDING: 'Pengembalian diproses',
  REFUNDED: 'Sudah dikembalikan',
}
const shippingStatusLabels: Record<OrderShippingStatus, string> = {
  PENDING: 'Belum dikirim',
  PACKED: 'Sedang dikemas',
  SHIPPED: 'Dalam pengiriman',
  DELIVERED: 'Sudah diterima',
}

function formatOrderDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : orderDateFormatter.format(date)
}

export default function OrdersPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<OrderHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [request, setRequest] = useState(0)
  const [continuingPaymentId, setContinuingPaymentId] = useState('')
  const [visibleCount, setVisibleCount] = useState(10)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    getOrderHistory(controller.signal)
      .then(setOrders)
      .catch((caught) => {
        if (!controller.signal.aborted) setError(getApiErrorMessage(caught, 'Riwayat pesanan tidak dapat dimuat.'))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [request])

  useEffect(() => {
    setVisibleCount(10)
  }, [orders])

  useEffect(() => {
    const sentinel = loadMoreRef.current
    if (!sentinel || visibleCount >= orders.length) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) setVisibleCount((current) => Math.min(current + 10, orders.length))
    }, { rootMargin: '240px' })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [orders.length, visibleCount])

  const continuePayment = async (order: OrderHistoryItem) => {
    if (continuingPaymentId) return
    setContinuingPaymentId(order.id)
    try {
      const payment = await continueOrderPayment(order.id)
      window.location.assign(payment.redirectUrl)
    } catch (caught) {
      toast({ message: getApiErrorMessage(caught, 'Pembayaran tidak dapat dilanjutkan. Coba lagi.'), variant: 'error' })
      setRequest((current) => current + 1)
    } finally {
      setContinuingPaymentId('')
    }
  }

  return <div className="min-h-[100dvh] bg-white">
    <MarketingHeader />
    <main id="main-content" className="mx-auto max-w-[1120px] px-5 py-8 sm:py-12 lg:px-8">
      <Link to="/profile" className="inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-primary-dark hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark"><ArrowLeft size={17} aria-hidden="true" />Kembali ke profil</Link>
      <div className="mt-6 flex flex-col justify-between gap-3 border-b border-line pb-6 sm:flex-row sm:items-end">
        <h1 tabIndex={-1} className="font-display text-3xl font-extrabold tracking-[-.04em] text-ink outline-none sm:text-4xl">Riwayat pesanan</h1>
        {!loading && !error && orders.length > 0 && <p className="text-sm font-bold text-muted">{orders.length} pesanan</p>}
      </div>

      {loading && <div role="status" aria-live="polite" className="mt-6 bg-white px-5 py-10 text-center text-sm font-semibold text-muted">Memuat riwayat pesanan…</div>}
      {!loading && error && <div className="mt-6 rounded-2xl border border-error/30 bg-white px-5 py-6 sm:flex sm:items-center sm:justify-between sm:gap-6"><p role="alert" className="text-sm font-semibold text-error">{error}</p><Button type="button" variant="outline" className="mt-4 w-full sm:mt-0 sm:w-auto" onClick={() => setRequest((current) => current + 1)}>Coba lagi</Button></div>}
      {!loading && !error && orders.length === 0 && <div className="mt-6 px-5 py-12 text-center"><PackageOpen size={28} aria-hidden="true" className="mx-auto text-stone" /><p className="mt-3 text-sm font-semibold text-muted">Belum ada pesanan di akun ini.</p></div>}
      {!loading && !error && orders.length > 0 && <ol className="mt-6 grid gap-4">
        {orders.slice(0, visibleCount).map((order) => {
          const paymentLabel = order.paymentRequiresReview ? 'Pembayaran diperiksa' : paymentStatusLabels[order.paymentStatus]
          const paymentTone = order.paymentRequiresReview || order.paymentStatus === 'PENDING' ? 'border-amber/45 bg-amber/15 text-[#7A5100]' : order.paymentStatus === 'PAID' ? 'border-primary/30 bg-primary/10 text-primary-dark' : 'border-error/25 bg-error/5 text-error'
          return <li key={order.id}>
            <article aria-labelledby={`order-${order.id}-title`} className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_14px_34px_rgba(29,37,34,.07)]">
              <header className="flex flex-col gap-5 border-b border-line bg-[linear-gradient(135deg,#ffffff_0%,#f6fbf9_100%)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted">Pesanan · <time dateTime={order.createdAt}>{formatOrderDate(order.createdAt)}</time></p>
                  <h2 id={`order-${order.id}-title`} className="mt-2 text-xl font-extrabold tracking-[-.03em] text-ink sm:text-2xl">{order.campaign.title}</h2>
                  <span className={`mt-3 inline-flex rounded-full border px-3 py-1.5 text-xs font-extrabold ${paymentTone}`}>{paymentLabel}</span>
                </div>
                <div className="shrink-0 sm:text-right">
                  <p className="text-xs font-semibold text-muted">Total pembayaran</p>
                  <p className="mt-1 text-2xl font-extrabold tracking-[-.04em] text-primary-dark">{formatRupiah(order.totalIdr)}</p>
                </div>
              </header>
              <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,.9fr)] lg:gap-7">
                <section aria-labelledby={`order-${order.id}-items`} className="rounded-2xl border border-line bg-cream/50 p-4 sm:p-5">
                  <h3 id={`order-${order.id}-items`} className="text-xs font-extrabold uppercase tracking-[.1em] text-muted">{order.items.length} item pesanan</h3>
                  <ul className="mt-3 divide-y divide-line">
                    {order.items.map((item) => <li key={item.id} className="flex items-start justify-between gap-4 py-3 first:pt-1 last:pb-1">
                      <div className="flex min-w-0 gap-3">
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-dark text-xs font-extrabold text-white">{item.quantity}×</span>
                        <p className="min-w-0 text-sm font-bold leading-5 text-ink">{item.productName}{item.variantLabel && <span className="block text-xs font-normal text-muted">{item.variantLabel}</span>}</p>
                      </div>
                      <p className="shrink-0 text-sm font-extrabold text-ink">{formatRupiah(item.unitPriceIdr * item.quantity)}</p>
                    </li>)}
                  </ul>
                </section>
                <div>
                  <dl className="grid gap-3">
                    <div className="flex items-center gap-3 rounded-xl border border-line p-3.5"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary-dark"><PackageCheck size={18} aria-hidden="true" /></span><div><dt className="text-xs font-semibold text-muted">Status pesanan</dt><dd className="mt-0.5 text-sm font-extrabold text-ink">{orderStatusLabels[order.status]}</dd></div></div>
                    <div className="flex items-center gap-3 rounded-xl border border-line p-3.5"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary-dark"><CreditCard size={18} aria-hidden="true" /></span><div><dt className="text-xs font-semibold text-muted">Pembayaran</dt><dd className="mt-0.5 text-sm font-extrabold text-ink">{paymentLabel}</dd></div></div>
                    <div className="flex items-center gap-3 rounded-xl border border-line p-3.5"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary-dark"><Truck size={18} aria-hidden="true" /></span><div><dt className="text-xs font-semibold text-muted">Pengiriman</dt><dd className="mt-0.5 text-sm font-extrabold text-ink">{shippingStatusLabels[order.shippingStatus]}</dd>{order.trackingNumber && <p className="mt-1 break-all text-xs text-muted">Resi: {order.trackingNumber}</p>}</div></div>
                  </dl>
                  {order.paymentRequiresReview && <p className="mt-4 rounded-xl bg-amber/15 p-3 text-xs font-semibold leading-5 text-[#7A5100]">Status pembayaran sedang diperiksa. Jangan membuat pembayaran baru.</p>}
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    {order.canContinuePayment && !order.paymentRequiresReview && <Button type="button" className="w-full sm:w-auto" disabled={Boolean(continuingPaymentId)} loading={continuingPaymentId === order.id} onClick={() => continuePayment(order)}>{continuingPaymentId === order.id ? 'Menyiapkan pembayaran…' : 'Bayar sekarang'}</Button>}
                    <ButtonLink to={`/campaigns/${order.campaign.slug}`} variant="outline" className="w-full sm:w-auto">Lihat kampanye</ButtonLink>
                  </div>
                </div>
              </div>
            </article>
          </li>
        })}
        {visibleCount < orders.length && <li aria-hidden="true"><div ref={loadMoreRef} className="h-8" /></li>}
      </ol>}
    </main>
  </div>
}
