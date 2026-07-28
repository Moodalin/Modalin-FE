import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Banknote, ChartNoAxesColumn, Clock3, FileText, Milestone, Plus, Receipt, ReceiptText, ShoppingBag, TrendingUp, UsersRound, WalletCards } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { getDashboard, updateExpense, updateMilestone } from '@/api/production/dashboard'
import { OrderStatus } from '@/components/campaign/product-card'
import { DashboardLayout } from '@/components/layout/dashboard'
import { Badge } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { PageLoading } from '@/components/ui/page-loading'
import { getApiErrorMessage } from '@/config/api-error'
import { formatCompactRupiah, formatRupiah } from '@/config/format'
import { useToast } from '@/hooks/use-toast'
import type { DashboardCostItem, DashboardOrder, DashboardResponse } from '@/types/campaign'

function Metric({ label, value, note, icon: Icon }: { label: string; value: string; note: string; icon: LucideIcon }) {
  return <article className="rounded-2xl border border-line bg-white p-5 text-ink"><span className="grid h-10 w-10 place-items-center rounded-xl border border-line text-muted"><Icon size={19} aria-hidden="true" /></span><p className="mt-6 text-[10px] font-extrabold uppercase tracking-[.12em] text-muted">{label}</p><p className="mt-2 text-3xl font-extrabold tracking-[-.05em]">{value}</p><p className="mt-2 text-xs text-muted">{note}</p></article>
}

function PageTitle({ title, description }: { title: string; description: string }) {
  return <div><h1 tabIndex={-1} className="max-w-4xl text-2xl font-extrabold tracking-[-.03em] text-ink outline-none">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p></div>
}

function SectionTitle({ title, note, id }: { title: string; note?: string; id?: string }) {
  return <div><h2 id={id} className="text-xl font-extrabold tracking-[-.04em] text-ink">{title}</h2>{note && <p className="mt-1 text-xs text-muted">{note}</p>}</div>
}

const activityDayFormatter = new Intl.DateTimeFormat('id-ID', { weekday: 'short' })
const activityDateFormatter = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' })

function getLocalDayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function getOrderActivity(orders: DashboardOrder[]) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const counts = new Map<string, number>()

  for (const order of orders) {
    const createdAt = new Date(order.createdAt)
    if (!Number.isNaN(createdAt.getTime())) {
      const key = getLocalDayKey(createdAt)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))
    return {
      key: getLocalDayKey(date),
      day: activityDayFormatter.format(date).replace('.', ''),
      date: activityDateFormatter.format(date),
      value: counts.get(getLocalDayKey(date)) ?? 0,
    }
  })
}

function OrderActivityGraph({ orders }: { orders: DashboardOrder[] }) {
  const activity = getOrderActivity(orders)
  const total = activity.reduce((sum, point) => sum + point.value, 0)
  const scale = Math.max(1, ...activity.map((point) => point.value))
  const description = activity.map((point) => `${point.date}: ${point.value} pesanan masuk`).join(', ')

  return <figure aria-labelledby="order-activity-title" aria-describedby="order-activity-description" className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
    <div className="flex flex-col justify-between gap-3 border-b border-line p-5 sm:flex-row sm:items-center sm:p-7">
      <SectionTitle id="order-activity-title" title="Aktivitas pesanan" note="Pesanan masuk per hari selama 7 hari terakhir, termasuk semua status pembayaran." />
      <Badge className="bg-primary/10 text-primary-dark">7 hari · {total} pesanan</Badge>
    </div>
    {total === 0 ? <div className="p-3 sm:p-5"><EmptyState icon={ChartNoAxesColumn}>Belum ada pesanan dalam 7 hari terakhir.</EmptyState></div> : <div className="px-4 pb-5 pt-4 sm:px-7 sm:pb-7">
      <ol className="grid h-36 grid-cols-7 gap-2 border-b border-line sm:gap-4" aria-label="Grafik pesanan masuk 7 hari terakhir, termasuk semua status pembayaran">
        {activity.map((point) => <li key={point.key} className="grid min-w-0 grid-rows-[1.25rem_1fr_1.5rem] items-end text-center" aria-label={`${point.date}, ${point.value} pesanan masuk`}>
          <span className="text-[10px] font-extrabold text-ink" aria-hidden="true">{point.value}</span>
          <span className="mx-auto w-full max-w-10 self-end rounded-t-md bg-primary" style={{ height: `${point.value / scale * 100}%` }} aria-hidden="true" />
          <span className="pt-2 text-[10px] font-bold capitalize text-muted" aria-hidden="true">{point.day}</span>
        </li>)}
      </ol>
    </div>}
    <figcaption id="order-activity-description" className="sr-only">{description}.</figcaption>
  </figure>
}

function CampaignCreationHeader({ title, description }: { title: string; description: string }) {
  return <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
    <PageTitle title={title} description={description} />
    <ButtonLink to="/campaigns/new"><Plus size={16} aria-hidden="true" />Buat kampanye</ButtonLink>
  </div>
}

function EmptyState({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return <div className="flex min-h-32 flex-col items-center justify-center px-5 py-8 text-center text-sm font-semibold text-muted">
    <span className="mb-3 grid size-10 place-items-center text-muted" aria-hidden="true"><Icon size={21} strokeWidth={1.75} /></span>
    <p>{children}</p>
  </div>
}

function EmptyTableMessage({ colSpan, icon, children }: { colSpan: number; icon: LucideIcon; children: ReactNode }) {
  return <tr><td colSpan={colSpan} className="py-3"><EmptyState icon={icon}>{children}</EmptyState></td></tr>
}




function EmptyCampaignTab({ active }: { active: string }) {
  if (active === 'orders') return <div>
    <CampaignCreationHeader title="Pesanan" description="Pantau pesanan, pembayaran, dan status produksi dari kampanye Anda." />
    <section className="mt-8 overflow-hidden rounded-2xl border border-line bg-white">
      <div className="flex flex-col justify-between gap-3 border-b border-line p-5 sm:flex-row sm:items-center sm:p-7"><SectionTitle title="Daftar pesanan" note="Data pelanggan hanya digunakan untuk memenuhi pesanan." /><Badge className="bg-primary/10 text-primary-dark">0 pesanan</Badge></div>
      <div className="overflow-x-auto px-5 pb-3 sm:px-7"><table className="w-full min-w-[820px] text-left text-sm"><thead className="border-b border-line text-[10px] font-extrabold uppercase tracking-[.1em] text-muted"><tr><th scope="col" className="py-4 pr-4">Pelanggan</th><th scope="col" className="py-4 pr-4">Produk</th><th scope="col" className="py-4 pr-4">Total</th><th scope="col" className="py-4 pr-4">Pembayaran</th><th scope="col" className="py-4 pr-4">Status</th><th scope="col" className="py-4">Tanggal</th></tr></thead><tbody><EmptyTableMessage colSpan={6} icon={ShoppingBag}>Belum ada pesanan.</EmptyTableMessage></tbody></table></div>
    </section>
  </div>

  if (active === 'production') return <div>
    <CampaignCreationHeader title="Produksi" description="Pantau tahap koleksi dan pembagian kerja setelah kampanye dibuat." />
    <div className="mt-8 grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
      <section className="rounded-2xl border border-line bg-white p-5 sm:p-7"><SectionTitle title="Tahap koleksi" note="Status publik dapat memandu pembaruan untuk pelanggan." /><div className="mt-6"><EmptyState icon={Milestone}>Belum ada tahap produksi.</EmptyState></div></section>
      <section className="rounded-2xl border border-line bg-white p-5 sm:p-7"><SectionTitle title="Penugasan kerja" note="Kapasitas terlihat per perajin dan produk." /><div className="mt-6"><EmptyState icon={UsersRound}>Belum ada penugasan kerja.</EmptyState></div></section>
    </div>
  </div>

  if (active === 'finance') return <div>
    <CampaignCreationHeader title="Keuangan" description="Bandingkan rencana biaya dan pengeluaran aktual kampanye Anda." />
    <div className="mt-8 grid gap-4 sm:grid-cols-3"><Metric label="Biaya rencana" value={formatCompactRupiah(0)} note="Belum ada rencana produksi" icon={FileText} /><Metric label="Pengeluaran aktual" value={formatCompactRupiah(0)} note="Belum ada biaya tercatat" icon={Receipt} /><Metric label="Estimasi margin" value={formatCompactRupiah(0)} note="Belum ada dana diterima" icon={TrendingUp} /></div>
    <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
      <div className="flex flex-col justify-between gap-4 border-b border-line p-5 sm:flex-row sm:items-center sm:p-7"><SectionTitle title="Rincian biaya" note="Bandingkan biaya rencana dan aktual untuk setiap item." /><Badge className="bg-primary/10 text-primary-dark">Sesuai anggaran</Badge></div>
      <div className="overflow-x-auto px-5 pb-3 sm:px-7"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-line text-[10px] font-extrabold uppercase tracking-[.1em] text-muted"><tr><th scope="col" className="py-4 pr-4">Kategori</th><th scope="col" className="py-4 pr-4">Rencana</th><th scope="col" className="py-4 pr-4">Aktual</th><th scope="col" className="py-4">Perbarui aktual</th></tr></thead><tbody><EmptyTableMessage colSpan={4} icon={ReceiptText}>Belum ada rincian biaya.</EmptyTableMessage></tbody></table></div>
    </section>
  </div>

  return null
}

function EmptyDashboardOverview() {
  return <div>
    <CampaignCreationHeader title="Ringkasan" description="Pantau target pendanaan, pesanan, dan kesiapan produksi kampanye Anda." />
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Produk dipesan" value="0 / 0" note="Target minimum" icon={ShoppingBag} /><Metric label="Dana terkumpul" value={formatCompactRupiah(0)} note={`Target ${formatCompactRupiah(0)}`} icon={WalletCards} /><Metric label="Kemajuan dana" value="0%" note="Dari target pendanaan" icon={TrendingUp} /><Metric label="Pesanan masuk" value="0" note="Tercatat di sistem" icon={Receipt} /></div>
    <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-white"><div className="border-b border-line p-5 sm:p-7"><SectionTitle title="Kemajuan pendanaan" note="Dana yang dicatat berasal dari pre-order yang dikonfirmasi." /></div><div className="p-5 sm:p-7"><Progress value={0} label="Target dana" /><div className="mt-6 grid gap-3 sm:grid-cols-3"><Metric label="Target" value={formatCompactRupiah(0)} note="Dana minimum" icon={FileText} /><Metric label="Terkumpul" value={formatCompactRupiah(0)} note="Dana tercatat" icon={Banknote} /><Metric label="Sisa target" value={formatCompactRupiah(0)} note="Agar produksi dimulai" icon={Clock3} /></div></div></section>
    <OrderActivityGraph orders={[]} />
  </div>
}


const CostCategoryLabel: Record<string, string> = { MATERIAL: 'Bahan', LABOUR: 'Tenaga kerja', PACKAGING: 'Kemasan', TRANSPORT: 'Transportasi', OTHER: 'Lainnya', RESERVE: 'Cadangan' }
const MilestoneTypeLabel: Record<string, string> = { MATERIAL_PREPARATION: 'Persiapan bahan', WEAVING: 'Penenunan', QUALITY_CHECK: 'Pemeriksaan kualitas', PACKING: 'Pengemasan', SHIPPING: 'Pengiriman' }
const MilestoneStatusLabel: Record<string, string> = { COMPLETED: 'Selesai', IN_PROGRESS: 'Berlangsung', BLOCKED: 'Terhambat', PENDING: 'Menunggu' }
const PaymentStatusLabel: Record<string, string> = { PENDING: 'Menunggu pembayaran', PAID: 'Lunas', FAILED: 'Gagal', REFUND_PENDING: 'Pengembalian diproses', REFUNDED: 'Dikembalikan' }
const AssignmentStatusLabel: Record<string, string> = { PENDING: 'Menunggu', IN_PROGRESS: 'Berlangsung', COMPLETED: 'Selesai', LATE: 'Terlambat' }

function ExpenseRow({ item, pending, onSave }: { item: DashboardCostItem; pending: boolean; onSave: (costItemId: string, value: string) => Promise<void> }) {
  const [value, setValue] = useState(String(item.actualTotalIdr))
  useEffect(() => setValue(String(item.actualTotalIdr)), [item.actualTotalIdr])
  const variance = item.actualTotalIdr - item.plannedTotalIdr
  return <tr className="border-b border-line last:border-b-0"><td className="py-4 pr-4"><p className="font-extrabold text-ink">{item.name}</p><p className="mt-1 text-xs text-muted">{CostCategoryLabel[item.category] ?? 'Biaya produksi'}</p></td><td className="py-4 pr-4 text-muted">{formatRupiah(item.plannedTotalIdr)}</td><td className="py-4 pr-4"><p className="font-bold text-ink">{formatRupiah(item.actualTotalIdr)}</p><p className={`mt-1 text-xs ${variance > 0 ? 'text-error' : 'text-primary-dark'}`}>{variance === 0 ? 'Sesuai rencana' : `${variance > 0 ? '+' : ''}${formatRupiah(variance)}`}</p></td><td className="py-4"><label className="flex items-center gap-2"><span className="sr-only">Biaya aktual untuk {item.name}</span><input className="min-h-10 w-36 rounded-lg border border-line px-3 outline-none focus:border-primary-dark focus:ring-4 focus:ring-primary/15" type="number" min="0" value={value} onChange={(event) => setValue(event.target.value)} /><Button type="button" variant="outline" className="min-h-10 px-3 py-1.5 text-xs" onClick={() => onSave(item.id, value)} disabled={pending} loading={pending}>{pending ? 'Menyimpan…' : 'Simpan'}</Button></label></td></tr>
}

export default function DashboardPage() {
  const [params] = useSearchParams()
  const rawTab = params.get('tab') || 'overview'
  const active = ['overview', 'orders', 'production', 'finance'].includes(rawTab) ? rawTab : 'overview'
  const { toast } = useToast()
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setRequestError(null)
    try {
      setDashboard(await getDashboard())
    } catch (error) {
      setDashboard(null)
      setRequestError(getApiErrorMessage(error, 'Tidak dapat memuat dasbor. Periksa koneksi Anda lalu coba lagi.'))
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  const saveMilestone = async (milestoneId: string, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED') => {
    if (pendingAction) return
    setPendingAction(`${milestoneId}:${status}`)
    try { const response = await updateMilestone(milestoneId, { status }); toast({ message: response.message, variant: 'success' }); await load() }
    catch (error) { toast({ message: getApiErrorMessage(error, 'Tidak dapat memperbarui tahap produksi.'), variant: 'error' }) }
    finally { setPendingAction('') }
  }

  const saveExpense = async (costItemId: string, value: string) => {
    if (pendingAction) return
    const amount = Number(value)
    if (!Number.isInteger(amount) || amount < 0) {
      toast({ message: 'Masukkan bilangan bulat nol atau lebih.', variant: 'error' })
      return
    }
    setPendingAction(costItemId)
    try { const response = await updateExpense(costItemId, { actualTotalIdr: amount }); toast({ message: response.message, variant: 'success' }); await load() }
    catch (error) { toast({ message: getApiErrorMessage(error, 'Tidak dapat memperbarui biaya.'), variant: 'error' }) }
    finally { setPendingAction('') }
  }

  if (loading) return <PageLoading />
  if (requestError) return <main id="main-content" className="grid min-h-[100dvh] place-items-center bg-white px-5 text-center"><section aria-labelledby="dashboard-load-error"><h1 id="dashboard-load-error" className="font-display text-4xl tracking-[-.05em] text-ink">Dasbor tidak dapat dimuat</h1><p role="alert" className="mt-3 max-w-md text-sm leading-6 text-muted">{requestError}</p><Button type="button" className="mt-6" onClick={load}>Coba lagi</Button></section></main>
  if (!dashboard) return null
  if (!dashboard.hasCampaign) return <DashboardLayout active={active}>{active === 'overview' ? <EmptyDashboardOverview /> : <EmptyCampaignTab active={active} />}</DashboardLayout>
  const progress = dashboard.metrics.fundingPercentage
  const campaignTitle = dashboard.campaign.title
  return <DashboardLayout active={active} campaignTitle={campaignTitle} campaignProgress={progress}>
    {active === 'overview' && <div><div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end"><PageTitle title={campaignTitle} description="Pantau target pendanaan, pesanan, dan kesiapan produksi." /><ButtonLink to={`/campaigns/${dashboard.campaign.id}`} variant="outline">Halaman publik</ButtonLink></div><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Produk dipesan" value={`${dashboard.campaign.currentOrderQuantity} / ${dashboard.campaign.minimumOrderQuantity}`} note="Target minimum" icon={ShoppingBag} /><Metric label="Dana terkumpul" value={formatCompactRupiah(dashboard.campaign.currentFundingAmountIdr)} note={`Target ${formatCompactRupiah(dashboard.campaign.minimumFundingTargetIdr)}`} icon={WalletCards} /><Metric label="Kemajuan dana" value={`${progress}%`} note="Dari target pendanaan" icon={TrendingUp} /><Metric label="Pesanan masuk" value={String(dashboard.metrics.orderCount)} note="Tercatat di sistem" icon={Receipt} /></div><section className="mt-6 overflow-hidden rounded-2xl border border-line bg-white"><div className="border-b border-line p-5 sm:p-7"><SectionTitle title="Kemajuan pendanaan" note="Dana yang dicatat berasal dari pre-order yang dikonfirmasi." /></div><div className="p-5 sm:p-7"><Progress value={progress} label="Target dana" /><div className="mt-6 grid gap-3 sm:grid-cols-3"><Metric label="Target" value={formatCompactRupiah(dashboard.campaign.minimumFundingTargetIdr)} note="Dana minimum" icon={FileText} /><Metric label="Terkumpul" value={formatCompactRupiah(dashboard.campaign.currentFundingAmountIdr)} note="Dana tercatat" icon={Banknote} /><Metric label="Sisa target" value={formatCompactRupiah(Math.max(0, dashboard.campaign.minimumFundingTargetIdr - dashboard.campaign.currentFundingAmountIdr))} note="Agar produksi dimulai" icon={Clock3} /></div></div></section></div>}
    {active === 'overview' && <OrderActivityGraph orders={dashboard.orders} />}

    {active === 'orders' && <div><PageTitle title="Pesanan" description={`${dashboard.orders.length} pesanan dari koleksi aktif beserta pembayaran dan status produksinya.`} /><section className="mt-8 overflow-hidden rounded-2xl border border-line bg-white"><div className="flex flex-col justify-between gap-3 border-b border-line p-5 sm:flex-row sm:items-center sm:p-7"><SectionTitle title="Daftar pesanan" note="Data pelanggan hanya digunakan untuk memenuhi pesanan." /><Badge className="bg-primary/10 text-primary-dark">{dashboard.orders.length} pesanan</Badge></div><div className="overflow-x-auto px-5 pb-3 sm:px-7"><table className="w-full min-w-[820px] text-left text-sm"><thead className="border-b border-line text-[10px] font-extrabold uppercase tracking-[.1em] text-muted"><tr><th scope="col" className="py-4 pr-4">Pelanggan</th><th scope="col" className="py-4 pr-4">Produk</th><th scope="col" className="py-4 pr-4">Total</th><th scope="col" className="py-4 pr-4">Pembayaran</th><th scope="col" className="py-4 pr-4">Status</th><th scope="col" className="py-4">Tanggal</th></tr></thead><tbody>{dashboard.orders.length === 0 ? <EmptyTableMessage colSpan={6} icon={ShoppingBag}>Belum ada pesanan.</EmptyTableMessage> : dashboard.orders.map((order) => <tr key={order.id} className="border-b border-line last:border-b-0"><td className="py-4 pr-4"><p className="font-extrabold text-ink">{order.customerName}</p><p className="mt-1 text-xs text-muted">{order.customerEmail}</p></td><td className="py-4 pr-4 text-ink">{order.items.reduce((sum, item) => sum + item.quantity, 0)} produk</td><td className="py-4 pr-4 font-extrabold text-ink">{formatRupiah(order.totalIdr)}</td><td className="py-4 pr-4"><Badge className="bg-cream text-muted">{PaymentStatusLabel[order.paymentStatus] ?? 'Status pembayaran belum tersedia'}</Badge></td><td className="py-4 pr-4"><OrderStatus status={order.status} /></td><td className="py-4 text-xs text-muted">{new Date(order.createdAt).toLocaleDateString('id-ID')}</td></tr>)}</tbody></table></div></section></div>}

    {active === 'production' && <div><PageTitle title="Produksi" description="Perbarui tahap produksi dan pantau beban kerja setiap perajin." /><div className="mt-8 grid gap-6 xl:grid-cols-[.9fr_1.1fr]"><section className="rounded-2xl border border-line bg-white p-5 sm:p-7"><SectionTitle title="Tahap koleksi" note="Status publik dapat memandu pembaruan untuk pelanggan." />{dashboard.milestones.length === 0 ? <div className="mt-6"><EmptyState icon={Milestone}>Belum ada tahap produksi.</EmptyState></div> : <ol className="mt-6">{dashboard.milestones.map((item, index) => <li key={item.id} className="grid grid-cols-[36px_1fr] gap-4"><div className="flex flex-col items-center"><span className={`grid h-9 w-9 place-items-center rounded-full text-xs font-extrabold ${item.status === 'COMPLETED' ? 'bg-primary text-white' : item.status === 'IN_PROGRESS' ? 'bg-amber text-ink' : item.status === 'BLOCKED' ? 'bg-error text-white' : 'bg-cream text-muted'}`}>{index + 1}</span>{index < dashboard.milestones.length - 1 && <span className="min-h-20 w-px flex-1 bg-line" />}</div><div className="pb-6"><div className="flex items-start justify-between gap-4"><div><p className="font-extrabold text-ink">{MilestoneTypeLabel[item.milestoneType] ?? 'Tahap produksi'}</p><p className="mt-1 text-xs text-muted">Tahap {item.sequence}</p></div><Badge className={item.status === 'COMPLETED' ? 'bg-primary/10 text-primary-dark' : item.status === 'BLOCKED' ? 'bg-error/5 text-error' : 'bg-amber/15 text-ink'}>{MilestoneStatusLabel[item.status] ?? 'Status tahap belum tersedia'}</Badge></div><div className="mt-3 flex flex-wrap gap-2"><Button type="button" variant="outline" className="min-h-9 px-3 py-1.5 text-xs" disabled={pendingAction.startsWith(`${item.id}:`)} loading={pendingAction === `${item.id}:IN_PROGRESS`} onClick={() => saveMilestone(item.id, 'IN_PROGRESS')}>Mulai</Button><Button type="button" className="min-h-9 px-3 py-1.5 text-xs" disabled={pendingAction.startsWith(`${item.id}:`)} loading={pendingAction === `${item.id}:COMPLETED`} onClick={() => saveMilestone(item.id, 'COMPLETED')}>Selesaikan</Button></div></div></li>)}</ol>}</section><section className="rounded-2xl border border-line bg-white p-5 sm:p-7"><SectionTitle title="Penugasan kerja" note="Kapasitas terlihat per perajin dan produk." />{dashboard.assignments.length === 0 ? <div className="mt-6"><EmptyState icon={UsersRound}>Belum ada penugasan kerja.</EmptyState></div> : <div className="mt-6 grid gap-4">{dashboard.assignments.map((assignment) => { const assignmentProgress = assignment.assignedQuantity ? assignment.completedQuantity / assignment.assignedQuantity * 100 : 0; return <article key={assignment.id} className="rounded-xl border border-line p-4"><div className="flex items-start justify-between gap-4"><div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-extrabold text-primary-dark">{assignment.artisan.name.charAt(0)}</span><div><p className="font-extrabold text-ink">{assignment.artisan.name}</p><p className="mt-1 text-xs text-muted">{assignment.product.name} · {assignment.artisan.specialization}</p></div></div><strong className="text-sm text-primary-dark">{Math.round(assignmentProgress)}%</strong></div><Progress className="mt-4" value={assignmentProgress} label={`${assignment.completedQuantity} dari ${assignment.assignedQuantity} produk`} showValue={false} /><div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-muted"><span>Tenggat {new Date(assignment.dueDate).toLocaleDateString('id-ID')}</span><Badge className="bg-cream text-muted">{AssignmentStatusLabel[assignment.status] ?? 'Status penugasan belum tersedia'}</Badge></div></article> })}</div>}</section></div></div>}

    {active === 'finance' && <div><PageTitle title="Keuangan" description="Perbarui biaya aktual dan bandingkan dengan rencana produksi." /><div className="mt-8 grid gap-4 sm:grid-cols-3"><Metric label="Biaya rencana" value={formatCompactRupiah(dashboard.metrics.plannedCostIdr)} note="Rencana produksi disetujui" icon={FileText} /><Metric label="Pengeluaran aktual" value={formatCompactRupiah(dashboard.metrics.actualCostIdr)} note="Biaya tercatat" icon={Receipt} /><Metric label="Estimasi margin" value={formatCompactRupiah(dashboard.metrics.estimatedProfitIdr)} note="Dana diterima dikurangi biaya rencana" icon={TrendingUp} /></div><section className="mt-6 overflow-hidden rounded-2xl border border-line bg-white"><div className="flex flex-col justify-between gap-4 border-b border-line p-5 sm:flex-row sm:items-center sm:p-7"><SectionTitle title="Rincian biaya" note="Bandingkan biaya rencana dan aktual untuk setiap item." /><Badge className={dashboard.metrics.overBudget ? 'bg-error/5 text-error' : 'bg-primary/10 text-primary-dark'}>{dashboard.metrics.overBudget ? 'Melebihi anggaran' : 'Sesuai anggaran'}</Badge></div><div className="overflow-x-auto px-5 pb-3 sm:px-7"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-line text-[10px] font-extrabold uppercase tracking-[.1em] text-muted"><tr><th scope="col" className="py-4 pr-4">Kategori</th><th scope="col" className="py-4 pr-4">Rencana</th><th scope="col" className="py-4 pr-4">Aktual</th><th scope="col" className="py-4">Perbarui aktual</th></tr></thead><tbody>{dashboard.costItems.length === 0 ? <EmptyTableMessage colSpan={4} icon={ReceiptText}>Belum ada rincian biaya.</EmptyTableMessage> : dashboard.costItems.map((item) => <ExpenseRow key={item.id} item={item} pending={pendingAction === item.id} onSave={saveExpense} />)}</tbody></table></div></section></div>}
  </DashboardLayout>
}
