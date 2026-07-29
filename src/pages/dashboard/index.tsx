import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Banknote, CalendarDays, ChartNoAxesColumn, ChevronDown, Clock3, FileText, Milestone, Plus, Receipt, ReceiptText, ShoppingBag, TrendingUp, UsersRound, WalletCards } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { getOwnedCampaigns } from '@/api/campaigns/campaigns'
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
import type { DashboardCostItem, DashboardOrder, DashboardResponse, OwnedCampaignSummary } from '@/types/campaign'

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
const activityPeriodFormatter = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

type ActivityRange = { from: string; to: string }

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null
}

function defaultActivityRange(): ActivityRange {
  const to = new Date()
  to.setHours(0, 0, 0, 0)
  const from = new Date(to)
  from.setDate(to.getDate() - 6)
  return { from: toDateInputValue(from), to: toDateInputValue(to) }
}

function getOrderActivity(orders: DashboardOrder[], range: ActivityRange) {
  const from = parseLocalDate(range.from)
  const to = parseLocalDate(range.to)
  if (!from || !to || from > to) return []
  const counts = new Map<string, number>()

  for (const order of orders) {
    const createdAt = new Date(order.createdAt)
    if (!Number.isNaN(createdAt.getTime())) {
      const key = toDateInputValue(createdAt)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }

  const activity = []
  for (const date = new Date(from); date <= to; date.setDate(date.getDate() + 1)) {
    const key = toDateInputValue(date)
    activity.push({
      key,
      day: activityDayFormatter.format(date).replace('.', ''),
      date: activityDateFormatter.format(date),
      value: counts.get(key) ?? 0,
    })
  }
  return activity
}

function OrderActivityGraph({ orders }: { orders: DashboardOrder[] }) {
  const initialRange = defaultActivityRange()
  const [range, setRange] = useState<ActivityRange>(initialRange)
  const [draftRange, setDraftRange] = useState<ActivityRange>(initialRange)
  const [isOpen, setIsOpen] = useState(false)
  const [rangeError, setRangeError] = useState('')
  const pickerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const activity = getOrderActivity(orders, range)
  const total = activity.reduce((sum, point) => sum + point.value, 0)
  const scale = Math.max(1, ...activity.map((point) => point.value))
  const fromDate = parseLocalDate(range.from)!
  const toDate = parseLocalDate(range.to)!
  const period = `${activityPeriodFormatter.format(fromDate)} – ${activityPeriodFormatter.format(toDate)}`
  const dayCount = activity.length
  const description = activity.map((point) => `${point.date}: ${point.value} pesanan masuk`).join(', ')
  const today = toDateInputValue(new Date())

  const closePicker = (restoreFocus = false) => {
    setIsOpen(false)
    setRangeError('')
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus())
  }

  useEffect(() => {
    if (!isOpen) return
    const closeOnOutsideInteraction = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) closePicker()
    }
    document.addEventListener('pointerdown', closeOnOutsideInteraction)
    return () => document.removeEventListener('pointerdown', closeOnOutsideInteraction)
  }, [isOpen])

  const openPicker = () => {
    setDraftRange(range)
    setRangeError('')
    setIsOpen(true)
  }

  const applyRange = () => {
    const from = parseLocalDate(draftRange.from)
    const to = parseLocalDate(draftRange.to)
    if (!from || !to) return setRangeError('Pilih tanggal mulai dan tanggal akhir.')
    if (from > to) return setRangeError('Tanggal mulai tidak boleh setelah tanggal akhir.')
    setRange(draftRange)
    closePicker(true)
  }

  return <figure aria-labelledby="order-activity-title" aria-describedby="order-activity-description" className="mt-6 rounded-2xl border border-line bg-white">
    <div className="flex flex-col justify-between gap-4 border-b border-line p-5 sm:flex-row sm:items-center sm:p-7">
      <SectionTitle id="order-activity-title" title="Aktivitas pesanan" note={`Pesanan masuk per hari pada ${period}, termasuk semua status pembayaran.`} />
      <div ref={pickerRef} className="relative">
          <button ref={triggerRef} type="button" aria-haspopup="dialog" aria-expanded={isOpen} aria-controls="activity-date-filter" onClick={() => isOpen ? closePicker() : openPicker()} className="inline-flex min-h-10 w-full items-center justify-between gap-2 rounded-xl border border-line bg-white px-3 text-xs font-extrabold text-ink transition hover:border-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark sm:w-auto"><CalendarDays size={16} className="text-primary-dark" aria-hidden="true" /><span>{period}</span><ChevronDown size={14} className={isOpen ? 'rotate-180 text-primary-dark transition-transform' : 'text-muted transition-transform'} aria-hidden="true" /></button>
        {isOpen && <div id="activity-date-filter" role="dialog" aria-modal="false" aria-labelledby="activity-date-filter-title" onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); closePicker(true) } }} className="absolute right-0 top-[calc(100%+.5rem)] z-30 w-[min(20rem,calc(100vw-3rem))] rounded-xl border border-line bg-white p-4 text-xs shadow-[0_18px_42px_rgba(29,37,34,.16)]">
          <div><h3 id="activity-date-filter-title" className="text-sm font-extrabold text-ink">Pilih rentang tanggal</h3><p className="mt-1 leading-4 text-muted">Grafik diperbarui setelah Anda menekan Terapkan.</p></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 font-bold text-ink">Dari tanggal<input type="date" value={draftRange.from} max={draftRange.to || today} onChange={(event) => { setDraftRange((current) => ({ ...current, from: event.target.value })); setRangeError('') }} className="h-9 min-w-0 rounded-lg border border-line bg-white px-2 text-xs font-semibold text-ink outline-none focus:border-primary-dark focus:ring-2 focus:ring-primary/15" /></label><label className="grid gap-1.5 font-bold text-ink">Sampai tanggal<input type="date" value={draftRange.to} min={draftRange.from} max={today} onChange={(event) => { setDraftRange((current) => ({ ...current, to: event.target.value })); setRangeError('') }} className="h-9 min-w-0 rounded-lg border border-line bg-white px-2 text-xs font-semibold text-ink outline-none focus:border-primary-dark focus:ring-2 focus:ring-primary/15" /></label></div>
          {rangeError && <p role="alert" className="mt-3 font-bold text-error">{rangeError}</p>}
          <div className="mt-4 flex justify-end gap-2"><Button type="button" variant="outline" className="min-h-9 px-3 py-1.5 text-xs" onClick={() => closePicker(true)}>Batal</Button><Button type="button" className="min-h-9 px-3 py-1.5 text-xs" onClick={applyRange}>Terapkan</Button></div>
         </div>}
       </div>
     </div>
    {total === 0 ? <div className="p-3 sm:p-5"><EmptyState icon={ChartNoAxesColumn}>Belum ada pesanan pada rentang tanggal ini.</EmptyState></div> : <div className="overflow-x-auto px-4 pb-5 pt-4 sm:px-7 sm:pb-7">
      <ol className="grid h-40 gap-2 border-b border-line sm:gap-4" style={{ gridTemplateColumns: `repeat(${dayCount}, minmax(44px, 1fr))`, minWidth: dayCount > 10 ? `${dayCount * 56}px` : '100%' }} aria-label={`Grafik pesanan masuk pada ${period}, termasuk semua status pembayaran`}>
        {activity.map((point) => <li key={point.key} className="grid min-w-0 grid-rows-[1.25rem_1fr_2.25rem] items-end text-center" aria-label={`${point.date}, ${point.value} pesanan masuk`}>
          <span className="text-[10px] font-extrabold text-ink" aria-hidden="true">{point.value}</span>
          <span className="mx-auto w-full max-w-10 self-end rounded-t-md bg-primary" style={{ height: `${point.value / scale * 100}%` }} aria-hidden="true" />
          <span className="pt-2 text-[10px] font-bold capitalize leading-4 text-muted" aria-hidden="true">{point.day}<span className="block font-normal">{point.date}</span></span>
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
const CampaignLifecycleLabel: Record<string, string> = { DRAFT: 'Draf', REVIEW: 'Perlu ditinjau', PUBLISHED: 'Terbit', FUNDING: 'Pre-order dibuka', EXTENDED: 'Diperpanjang', TARGET_REACHED: 'Target tercapai', IN_PRODUCTION: 'Dalam produksi', QUALITY_CHECK: 'Pemeriksaan kualitas', PACKING: 'Pengemasan', SHIPPING: 'Pengiriman', COMPLETED: 'Selesai', FAILED: 'Target tidak tercapai', CANCELLED: 'Dibatalkan' }
const AssignmentStatusLabel: Record<string, string> = { PENDING: 'Menunggu', IN_PROGRESS: 'Berlangsung', COMPLETED: 'Selesai', LATE: 'Terlambat' }

function ExpenseRow({ item, pending, onSave }: { item: DashboardCostItem; pending: boolean; onSave: (costItemId: string, value: string) => Promise<void> }) {
  const [value, setValue] = useState(String(item.actualTotalIdr))
  useEffect(() => setValue(String(item.actualTotalIdr)), [item.actualTotalIdr])
  const variance = item.actualTotalIdr - item.plannedTotalIdr
  return <tr className="border-b border-line last:border-b-0"><td className="py-4 pr-4"><p className="font-extrabold text-ink">{item.name}</p><p className="mt-1 text-xs text-muted">{CostCategoryLabel[item.category] ?? 'Biaya produksi'}</p></td><td className="py-4 pr-4 text-muted">{formatRupiah(item.plannedTotalIdr)}</td><td className="py-4 pr-4"><p className="font-bold text-ink">{formatRupiah(item.actualTotalIdr)}</p><p className={`mt-1 text-xs ${variance > 0 ? 'text-error' : 'text-primary-dark'}`}>{variance === 0 ? 'Sesuai rencana' : `${variance > 0 ? '+' : ''}${formatRupiah(variance)}`}</p></td><td className="py-4"><label className="flex items-center gap-2"><span className="sr-only">Biaya aktual untuk {item.name}</span><input className="min-h-10 w-36 rounded-lg border border-line px-3 outline-none focus:border-primary-dark focus:ring-4 focus:ring-primary/15" type="number" min="0" value={value} onChange={(event) => setValue(event.target.value)} /><Button type="button" variant="outline" className="min-h-10 px-3 py-1.5 text-xs" onClick={() => onSave(item.id, value)} disabled={pending} loading={pending}>{pending ? 'Menyimpan…' : 'Simpan'}</Button></label></td></tr>
}

export default function DashboardPage() {
  const [params, setParams] = useSearchParams()
  const rawTab = params.get('tab') || 'overview'
  const active = ['overview', 'orders', 'production', 'finance'].includes(rawTab) ? rawTab : 'overview'
  const { toast } = useToast()
  const [campaigns, setCampaigns] = useState<OwnedCampaignSummary[]>([])
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState('')
  const loadVersion = useRef(0)

  const selectedCampaignId = params.get('campaignId') || ''

  const selectCampaign = useCallback((campaignId: string) => {
    const next = new URLSearchParams(params)
    next.set('campaignId', campaignId)
    next.set('tab', active)
    setParams(next)
  }, [active, params, setParams])

  const load = useCallback(async () => {
    const version = ++loadVersion.current
    setLoading(true)
    setDashboard(null)
    setRequestError(null)
    try {
      const ownedCampaigns = await getOwnedCampaigns()
      if (version !== loadVersion.current) return
      setCampaigns(ownedCampaigns)
      if (ownedCampaigns.length === 0) {
        setDashboard({ hasCampaign: false })
        return
      }
      const selected = ownedCampaigns.find((campaign) => campaign.id === selectedCampaignId) ?? ownedCampaigns[0]
      if (!selected) return
      if (selected.id !== selectedCampaignId) {
        const next = new URLSearchParams(params)
        next.set('campaignId', selected.id)
        next.set('tab', active)
        setParams(next, { replace: true })
      }
      const overview = await getDashboard(selected.id)
      if (version === loadVersion.current) setDashboard(overview)
    } catch (error) {
      if (version !== loadVersion.current) return
      setCampaigns([])
      setDashboard(null)
      setRequestError(getApiErrorMessage(error, 'Tidak dapat memuat dasbor. Periksa koneksi Anda lalu coba lagi.'))
    } finally {
      if (version === loadVersion.current) setLoading(false)
    }
  }, [active, params, selectedCampaignId, setParams])
  useEffect(() => { load() }, [load])

  const saveMilestone = async (milestoneId: string, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED') => {
    if (pendingAction) return
    setPendingAction(`${milestoneId}:${status}`)
    try { const response = await updateMilestone(selectedCampaignId, milestoneId, { status }); toast({ message: response.message, variant: 'success' }); await load() }
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
    try { const response = await updateExpense(selectedCampaignId, costItemId, { actualTotalIdr: amount }); toast({ message: response.message, variant: 'success' }); await load() }
    catch (error) { toast({ message: getApiErrorMessage(error, 'Tidak dapat memperbarui biaya.'), variant: 'error' }) }
    finally { setPendingAction('') }
  }

  if (loading) return <PageLoading />
  if (requestError) return <main id="main-content" className="grid min-h-[100dvh] place-items-center bg-white px-5 text-center"><section aria-labelledby="dashboard-load-error"><h1 id="dashboard-load-error" className="font-display text-4xl tracking-[-.05em] text-ink">Dasbor tidak dapat dimuat</h1><p role="alert" className="mt-3 max-w-md text-sm leading-6 text-muted">{requestError}</p><Button type="button" className="mt-6" onClick={load}>Coba lagi</Button></section></main>
  if (!dashboard) return null
  if (!dashboard.hasCampaign) return <DashboardLayout active={active}>{active === 'overview' ? <EmptyDashboardOverview /> : <EmptyCampaignTab active={active} />}</DashboardLayout>
  const progress = dashboard.metrics.fundingPercentage
  const campaignTitle = dashboard.campaign.title
  const selectedCampaign = campaigns.find((campaign) => campaign.id === dashboard.campaign.id)
  const isPublicCampaign = Boolean(selectedCampaign?.publishedAt)
  return <DashboardLayout active={active} campaigns={campaigns} selectedCampaignId={dashboard.campaign.id} onCampaignChange={selectCampaign}>
    {active === 'overview' && <div><div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end"><PageTitle title={campaignTitle} description="Pantau target pendanaan, pesanan, dan kesiapan produksi." /><div className="flex flex-col gap-3 sm:flex-row"><ButtonLink to="/campaigns/new"><Plus size={16} aria-hidden="true" />Buat kampanye baru</ButtonLink><ButtonLink to={`/campaigns/${dashboard.campaign.id}/manage`} variant="outline">Kelola kampanye</ButtonLink>{isPublicCampaign && <ButtonLink to={`/campaigns/${dashboard.campaign.id}`} variant="outline">Halaman publik</ButtonLink>}</div></div><section className="mt-8 overflow-hidden rounded-2xl border border-line bg-white"><div className="grid lg:grid-cols-[260px_1fr]"><img src={dashboard.campaign.heroImageUrl || '/hero/1.png'} alt={`Foto utama ${campaignTitle}`} className="aspect-[16/9] h-full w-full object-cover lg:aspect-auto" /><div className="p-5 sm:p-7"><div className="flex flex-wrap items-center gap-2"><Badge className="bg-primary/10 text-primary-dark">{CampaignLifecycleLabel[dashboard.campaign.status] ?? dashboard.campaign.status}</Badge><span className="text-xs font-semibold text-muted">{dashboard.campaign.groupName} · {dashboard.campaign.location}</span></div><h2 className="mt-4 text-xl font-extrabold tracking-[-.03em] text-ink">Detail kampanye</h2><dl className="mt-5 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2 xl:grid-cols-4"><div><dt className="text-xs font-semibold text-muted">Batas pre-order</dt><dd className="mt-1 font-extrabold text-ink">{new Date(dashboard.campaign.campaignDeadline).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</dd></div><div><dt className="text-xs font-semibold text-muted">Estimasi pengiriman</dt><dd className="mt-1 font-extrabold text-ink">{new Date(dashboard.campaign.estimatedDeliveryDate).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</dd></div><div><dt className="text-xs font-semibold text-muted">Durasi produksi</dt><dd className="mt-1 font-extrabold text-ink">{dashboard.campaign.productionDurationDays} hari</dd></div><div><dt className="text-xs font-semibold text-muted">Produk tersedia</dt><dd className="mt-1 font-extrabold text-ink">{dashboard.campaign.productCount} produk</dd></div></dl></div></div></section><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Produk dipesan" value={`${dashboard.campaign.currentOrderQuantity} / ${dashboard.campaign.minimumOrderQuantity}`} note="Target minimum" icon={ShoppingBag} /><Metric label="Dana terkumpul" value={formatCompactRupiah(dashboard.campaign.currentFundingAmountIdr)} note={`Target ${formatCompactRupiah(dashboard.campaign.minimumFundingTargetIdr)}`} icon={WalletCards} /><Metric label="Kemajuan dana" value={`${progress}%`} note="Dari target pendanaan" icon={TrendingUp} /><Metric label="Pesanan masuk" value={String(dashboard.metrics.orderCount)} note="Tercatat di sistem" icon={Receipt} /></div><section className="mt-6 overflow-hidden rounded-2xl border border-line bg-white"><div className="border-b border-line p-5 sm:p-7"><SectionTitle title="Kemajuan pendanaan" note="Dana yang dicatat berasal dari pre-order yang dikonfirmasi." /></div><div className="p-5 sm:p-7"><Progress value={progress} label="Target dana" /><div className="mt-6 grid gap-3 sm:grid-cols-3"><Metric label="Target" value={formatCompactRupiah(dashboard.campaign.minimumFundingTargetIdr)} note="Dana minimum" icon={FileText} /><Metric label="Terkumpul" value={formatCompactRupiah(dashboard.campaign.currentFundingAmountIdr)} note="Dana tercatat" icon={Banknote} /><Metric label="Sisa target" value={formatCompactRupiah(Math.max(0, dashboard.campaign.minimumFundingTargetIdr - dashboard.campaign.currentFundingAmountIdr))} note="Agar produksi dimulai" icon={Clock3} /></div></div></section></div>}
    {active === 'overview' && <OrderActivityGraph orders={dashboard.orders} />}

    {active === 'orders' && <div><PageTitle title="Pesanan" description={`${dashboard.orders.length} pesanan dari koleksi aktif beserta pembayaran dan status produksinya.`} /><section className="mt-8 overflow-hidden rounded-2xl border border-line bg-white"><div className="flex flex-col justify-between gap-3 border-b border-line p-5 sm:flex-row sm:items-center sm:p-7"><SectionTitle title="Daftar pesanan" note="Data pelanggan hanya digunakan untuk memenuhi pesanan." /><Badge className="bg-primary/10 text-primary-dark">{dashboard.orders.length} pesanan</Badge></div><div className="overflow-x-auto px-5 pb-3 sm:px-7"><table className="w-full min-w-[820px] text-left text-sm"><thead className="border-b border-line text-[10px] font-extrabold uppercase tracking-[.1em] text-muted"><tr><th scope="col" className="py-4 pr-4">Pelanggan</th><th scope="col" className="py-4 pr-4">Produk</th><th scope="col" className="py-4 pr-4">Total</th><th scope="col" className="py-4 pr-4">Pembayaran</th><th scope="col" className="py-4 pr-4">Status</th><th scope="col" className="py-4">Tanggal</th></tr></thead><tbody>{dashboard.orders.length === 0 ? <EmptyTableMessage colSpan={6} icon={ShoppingBag}>Belum ada pesanan.</EmptyTableMessage> : dashboard.orders.map((order) => <tr key={order.id} className="border-b border-line last:border-b-0"><td className="py-4 pr-4"><p className="font-extrabold text-ink">{order.customerName}</p><p className="mt-1 text-xs text-muted">{order.customerEmail}</p></td><td className="py-4 pr-4 text-ink">{order.items.reduce((sum, item) => sum + item.quantity, 0)} produk</td><td className="py-4 pr-4 font-extrabold text-ink">{formatRupiah(order.totalIdr)}</td><td className="py-4 pr-4"><Badge className="bg-cream text-muted">{PaymentStatusLabel[order.paymentStatus] ?? 'Status pembayaran belum tersedia'}</Badge></td><td className="py-4 pr-4"><OrderStatus status={order.status} /></td><td className="py-4 text-xs text-muted">{new Date(order.createdAt).toLocaleDateString('id-ID')}</td></tr>)}</tbody></table></div></section></div>}

    {active === 'production' && <div><PageTitle title="Produksi" description="Perbarui tahap produksi dan pantau beban kerja setiap perajin." /><div className="mt-8 grid gap-6 xl:grid-cols-[.9fr_1.1fr]"><section className="rounded-2xl border border-line bg-white p-5 sm:p-7"><SectionTitle title="Tahap koleksi" note="Status publik dapat memandu pembaruan untuk pelanggan." />{dashboard.milestones.length === 0 ? <div className="mt-6"><EmptyState icon={Milestone}>Belum ada tahap produksi.</EmptyState></div> : <ol className="mt-6">{dashboard.milestones.map((item, index) => <li key={item.id} className="grid grid-cols-[36px_1fr] gap-4"><div className="flex flex-col items-center"><span className={`grid h-9 w-9 place-items-center rounded-full text-xs font-extrabold ${item.status === 'COMPLETED' ? 'bg-primary text-white' : item.status === 'IN_PROGRESS' ? 'bg-amber text-ink' : item.status === 'BLOCKED' ? 'bg-error text-white' : 'bg-cream text-muted'}`}>{index + 1}</span>{index < dashboard.milestones.length - 1 && <span className="min-h-20 w-px flex-1 bg-line" />}</div><div className="pb-6"><div className="flex items-start justify-between gap-4"><div><p className="font-extrabold text-ink">{MilestoneTypeLabel[item.milestoneType] ?? 'Tahap produksi'}</p><p className="mt-1 text-xs text-muted">Tahap {item.sequence}</p></div><Badge className={item.status === 'COMPLETED' ? 'bg-primary/10 text-primary-dark' : item.status === 'BLOCKED' ? 'bg-error/5 text-error' : 'bg-amber/15 text-ink'}>{MilestoneStatusLabel[item.status] ?? 'Status tahap belum tersedia'}</Badge></div><div className="mt-3 flex flex-wrap gap-2"><Button type="button" variant="outline" className="min-h-9 px-3 py-1.5 text-xs" disabled={pendingAction.startsWith(`${item.id}:`)} loading={pendingAction === `${item.id}:IN_PROGRESS`} onClick={() => saveMilestone(item.id, 'IN_PROGRESS')}>Mulai</Button><Button type="button" className="min-h-9 px-3 py-1.5 text-xs" disabled={pendingAction.startsWith(`${item.id}:`)} loading={pendingAction === `${item.id}:COMPLETED`} onClick={() => saveMilestone(item.id, 'COMPLETED')}>Selesaikan</Button></div></div></li>)}</ol>}</section><section className="rounded-2xl border border-line bg-white p-5 sm:p-7"><SectionTitle title="Penugasan kerja" note="Kapasitas terlihat per perajin dan produk." />{dashboard.assignments.length === 0 ? <div className="mt-6"><EmptyState icon={UsersRound}>Belum ada penugasan kerja.</EmptyState></div> : <div className="mt-6 grid gap-4">{dashboard.assignments.map((assignment) => { const assignmentProgress = assignment.assignedQuantity ? assignment.completedQuantity / assignment.assignedQuantity * 100 : 0; return <article key={assignment.id} className="rounded-xl border border-line p-4"><div className="flex items-start justify-between gap-4"><div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-extrabold text-primary-dark">{assignment.artisan.name.charAt(0)}</span><div><p className="font-extrabold text-ink">{assignment.artisan.name}</p><p className="mt-1 text-xs text-muted">{assignment.product.name} · {assignment.artisan.specialization}</p></div></div><strong className="text-sm text-primary-dark">{Math.round(assignmentProgress)}%</strong></div><Progress className="mt-4" value={assignmentProgress} label={`${assignment.completedQuantity} dari ${assignment.assignedQuantity} produk`} showValue={false} /><div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-muted"><span>Tenggat {new Date(assignment.dueDate).toLocaleDateString('id-ID')}</span><Badge className="bg-cream text-muted">{AssignmentStatusLabel[assignment.status] ?? 'Status penugasan belum tersedia'}</Badge></div></article> })}</div>}</section></div></div>}

    {active === 'finance' && <div><PageTitle title="Keuangan" description="Perbarui biaya aktual dan bandingkan dengan rencana produksi." /><div className="mt-8 grid gap-4 sm:grid-cols-3"><Metric label="Biaya rencana" value={formatCompactRupiah(dashboard.metrics.plannedCostIdr)} note="Rencana produksi disetujui" icon={FileText} /><Metric label="Pengeluaran aktual" value={formatCompactRupiah(dashboard.metrics.actualCostIdr)} note="Biaya tercatat" icon={Receipt} /><Metric label="Estimasi margin" value={formatCompactRupiah(dashboard.metrics.estimatedProfitIdr)} note="Dana diterima dikurangi biaya rencana" icon={TrendingUp} /></div><section className="mt-6 overflow-hidden rounded-2xl border border-line bg-white"><div className="flex flex-col justify-between gap-4 border-b border-line p-5 sm:flex-row sm:items-center sm:p-7"><SectionTitle title="Rincian biaya" note="Bandingkan biaya rencana dan aktual untuk setiap item." /><Badge className={dashboard.metrics.overBudget ? 'bg-error/5 text-error' : 'bg-primary/10 text-primary-dark'}>{dashboard.metrics.overBudget ? 'Melebihi anggaran' : 'Sesuai anggaran'}</Badge></div><div className="overflow-x-auto px-5 pb-3 sm:px-7"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-line text-[10px] font-extrabold uppercase tracking-[.1em] text-muted"><tr><th scope="col" className="py-4 pr-4">Kategori</th><th scope="col" className="py-4 pr-4">Rencana</th><th scope="col" className="py-4 pr-4">Aktual</th><th scope="col" className="py-4">Perbarui aktual</th></tr></thead><tbody>{dashboard.costItems.length === 0 ? <EmptyTableMessage colSpan={4} icon={ReceiptText}>Belum ada rincian biaya.</EmptyTableMessage> : dashboard.costItems.map((item) => <ExpenseRow key={item.id} item={item} pending={pendingAction === item.id} onSave={saveExpense} />)}</tbody></table></div></section></div>}
  </DashboardLayout>
}
