import { useEffect, useState } from 'react'
import { ArrowLeft, PackageOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getOrderHistory } from '@/api/orders/orders'
import { MarketingHeader } from '@/components/layout/marketing'
import { Button } from '@/components/ui/button'
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

  const continuePayment = async (order: OrderHistoryItem) => {
    if (continuingPaymentId) return
    setContinuingPaymentId(order.id)
    try {
      const currentOrders = await getOrderHistory()
      setOrders(currentOrders)
      const currentOrder = currentOrders.find((candidate) => candidate.id === order.id)
      if (currentOrder?.paymentStatus !== 'PENDING' || !currentOrder.paymentUrl) {
        toast({ message: 'Status pembayaran pesanan ini telah diperbarui.', variant: 'success' })
        return
      }
      window.location.assign(currentOrder.paymentUrl)
    } catch (caught) {
      toast({ message: getApiErrorMessage(caught, 'Status pembayaran tidak dapat diperiksa. Coba lagi.'), variant: 'error' })
    } finally {
      setContinuingPaymentId('')
    }
  }

  return <div className="min-h-[100dvh] bg-white">
    <MarketingHeader />
    <main id="main-content" className="mx-auto max-w-[1120px] px-5 py-8 sm:py-12 lg:px-8">
      <Link to="/profile" className="inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-primary-dark hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark"><ArrowLeft size={17} aria-hidden="true" />Kembali ke profil</Link>
      <div className="mt-6 flex flex-col justify-between gap-3 border-b border-line pb-6 sm:flex-row sm:items-end">
        <h1 className="font-display text-3xl font-extrabold tracking-[-.04em] text-ink sm:text-4xl">Riwayat pesanan</h1>
        {!loading && !error && orders.length > 0 && <p className="text-sm font-bold text-muted">{orders.length} pesanan</p>}
      </div>

      {loading && <div role="status" aria-live="polite" className="mt-6 bg-white px-5 py-10 text-center text-sm font-semibold text-muted">Memuat riwayat pesanan…</div>}
      {!loading && error && <div className="mt-6 rounded-2xl border border-error/30 bg-white px-5 py-6 sm:flex sm:items-center sm:justify-between sm:gap-6"><p role="alert" className="text-sm font-semibold text-error">{error}</p><Button type="button" variant="outline" className="mt-4 w-full sm:mt-0 sm:w-auto" onClick={() => setRequest((current) => current + 1)}>Coba lagi</Button></div>}
      {!loading && !error && orders.length === 0 && <div className="mt-6 px-5 py-12 text-center"><PackageOpen size={28} aria-hidden="true" className="mx-auto text-stone" /><p className="mt-3 text-sm font-semibold text-muted">Belum ada pesanan di akun ini.</p></div>}
      {!loading && !error && orders.length > 0 && <ol className="mt-6 grid gap-4">
        {orders.map((order) => <li key={order.id}>
          <article aria-labelledby={`order-${order.id}-title`} className="overflow-hidden rounded-2xl border border-line bg-white">
            <div className="flex flex-col gap-3 border-b border-line bg-cotton/70 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
              <div className="min-w-0">
                <h2 id={`order-${order.id}-title`} className="text-base font-extrabold tracking-[-.02em] text-ink"><Link to={`/campaigns/${order.campaign.slug}`} className="hover:text-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark">{order.campaign.title}</Link></h2>
                <p className="mt-1 text-xs font-semibold text-muted"><time dateTime={order.createdAt}>{formatOrderDate(order.createdAt)}</time></p>
              </div>
              <p className="shrink-0 text-base font-extrabold text-ink">{formatRupiah(order.totalIdr)}</p>
            </div>
            <div className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)] lg:gap-8">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.1em] text-muted">Item pesanan</p>
                <ul className="mt-3 grid gap-2">
                  {order.items.map((item) => <li key={item.id} className="flex items-start justify-between gap-4 text-sm">
                    <p className="min-w-0 font-semibold leading-5 text-ink"><span>{item.quantity} × {item.productName}</span>{item.variantLabel && <span className="block text-xs font-normal text-muted">{item.variantLabel}</span>}</p>
                    <p className="shrink-0 font-bold text-ink">{formatRupiah(item.unitPriceIdr * item.quantity)}</p>
                  </li>)}
                </ul>
              </div>
              <div className="border-t border-line pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                <dl className="grid gap-3 text-sm">
                  <div className="grid grid-cols-[7.5rem_1fr] gap-3"><dt className="text-muted">Status pesanan</dt><dd className="font-bold text-ink">{orderStatusLabels[order.status]}</dd></div>
                  <div className="grid grid-cols-[7.5rem_1fr] gap-3"><dt className="text-muted">Pembayaran</dt><dd className="font-bold text-ink">{paymentStatusLabels[order.paymentStatus]}</dd></div>
                  <div className="grid grid-cols-[7.5rem_1fr] gap-3"><dt className="text-muted">Pengiriman</dt><dd className="font-bold text-ink">{shippingStatusLabels[order.shippingStatus]}</dd></div>
                  {order.trackingNumber && <div className="grid grid-cols-[7.5rem_1fr] gap-3"><dt className="text-muted">Nomor resi</dt><dd className="break-all font-bold text-ink">{order.trackingNumber}</dd></div>}
                </dl>
                {order.paymentStatus === 'PENDING' && order.paymentUrl && <Button type="button" className="mt-5 w-full sm:w-auto" disabled={continuingPaymentId === order.id} loading={continuingPaymentId === order.id} onClick={() => continuePayment(order)}>{continuingPaymentId === order.id ? 'Memeriksa pembayaran…' : 'Lanjutkan pembayaran'}</Button>}
              </div>
            </div>
          </article>
        </li>)}
      </ol>}
    </main>
  </div>
}
