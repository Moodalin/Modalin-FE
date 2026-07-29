import { useEffect, useState } from 'react'
import { ArrowRight, CalendarDays, Plus } from 'lucide-react'
import { getOwnedCampaigns } from '@/api/campaigns/campaigns'
import { MarketingFooter, MarketingHeader } from '@/components/layout/marketing'
import { Badge } from '@/components/ui/badge'
import { Button, ButtonLink } from '@/components/ui/button'
import { PageLoading } from '@/components/ui/page-loading'
import { formatCompactRupiah } from '@/config/format'
import { TextileSources } from '@/constants/textile-sources'
import type { CampaignLifecycleStatus, OwnedCampaignSummary } from '@/types/campaign'

const statusLabels: Record<CampaignLifecycleStatus, string> = {
  DRAFT: 'Draf',
  REVIEW: 'Perlu ditinjau',
  PUBLISHED: 'Terbit',
  FUNDING: 'Pre-order dibuka',
  TARGET_REACHED: 'Target tercapai',
  IN_PRODUCTION: 'Dalam produksi',
  QUALITY_CHECK: 'Pemeriksaan kualitas',
  PACKING: 'Pengemasan',
  SHIPPING: 'Pengiriman',
  COMPLETED: 'Selesai',
  FAILED: 'Target tidak tercapai',
  EXTENDED: 'Diperpanjang',
  CANCELLED: 'Dibatalkan',
}

const publicStatuses: CampaignLifecycleStatus[] = ['PUBLISHED', 'FUNDING', 'TARGET_REACHED', 'IN_PRODUCTION', 'QUALITY_CHECK', 'PACKING', 'SHIPPING', 'COMPLETED', 'EXTENDED']

export default function MyCampaignsPage() {
  const [campaigns, setCampaigns] = useState<OwnedCampaignSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let current = true
    setLoading(true)
    setError(false)
    getOwnedCampaigns()
      .then((result) => { if (current) setCampaigns(result) })
      .catch(() => { if (current) setError(true) })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [retry])

  if (loading) return <PageLoading />

  return <div className="min-h-screen bg-white text-ink"><MarketingHeader /><main id="main-content">
    <section className="px-5 py-12 lg:px-8 lg:py-20"><div className="mx-auto flex max-w-[1280px] flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-primary-dark">Ruang kerja pengrajin</p><h1 className="mt-4 text-5xl font-medium leading-[.9] tracking-[-.065em] sm:text-6xl">Kampanye Saya</h1><p className="mt-5 max-w-2xl text-sm leading-6 text-muted">Lihat progres dan kelola semua kampanye milik kelompok Anda.</p></div><ButtonLink to="/onboarding?mode=creator&returnTo=%2Fcampaigns%2Fnew"><Plus size={17} aria-hidden="true" />Buat kampanye</ButtonLink></div></section>
    <section className="px-5 pb-20 lg:px-8 lg:pb-28"><div className="mx-auto max-w-[1280px]">
      {error ? <div className="grid min-h-80 place-items-center rounded-2xl border border-line p-8 text-center"><div><h2 className="text-2xl font-extrabold tracking-[-.04em]">Kampanye belum dapat dimuat.</h2><p className="mt-3 text-sm text-muted">Periksa koneksi Anda lalu coba lagi.</p><Button type="button" variant="outline" className="mt-5" onClick={() => setRetry((value) => value + 1)}>Muat ulang</Button></div></div> : campaigns.length === 0 ? <div className="grid min-h-80 place-items-center rounded-2xl border border-line p-8 text-center"><div><h2 className="text-2xl font-extrabold tracking-[-.04em]">Belum ada kampanye.</h2><p className="mt-3 text-sm text-muted">Buat kampanye pertama untuk mulai mengumpulkan pre-order.</p><ButtonLink to="/onboarding?mode=creator&returnTo=%2Fcampaigns%2Fnew" className="mt-5">Buat kampanye</ButtonLink></div></div> : <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{campaigns.map((campaign) => {
        const fundingProgress = Math.min(100, Math.round(campaign.progress.fundingPercentage))
        const isPublic = publicStatuses.includes(campaign.status)
        return <li key={campaign.id}><article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(29,37,34,.09)]"><img src={campaign.heroImageUrl || TextileSources.eastSumbaHinggi.imageUrl} alt={campaign.heroImageUrl ? `Foto utama ${campaign.title}` : TextileSources.eastSumbaHinggi.imageAlt} className="aspect-[1.2] w-full object-cover" loading="lazy" decoding="async" /><div className="flex flex-1 flex-col p-5"><div className="flex items-start justify-between gap-3"><Badge className="bg-primary/10 text-primary-dark">{statusLabels[campaign.status]}</Badge><span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-muted"><CalendarDays size={14} aria-hidden="true" />{new Date(campaign.campaignDeadline).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span></div><h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-[-.045em]">{campaign.title}</h2><div className="mt-5 grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-muted">Dana terkumpul</p><p className="mt-1 font-extrabold text-primary-dark">{formatCompactRupiah(campaign.currentFundingAmountIdr)}</p></div><div><p className="text-xs text-muted">Pesanan</p><p className="mt-1 font-extrabold text-primary-dark">{campaign.currentOrderQuantity} / {campaign.minimumOrderQuantity}</p></div></div><div className="mt-5"><div className="flex items-baseline justify-between gap-3"><span className="font-extrabold text-primary-dark">{fundingProgress}%</span><span className="text-xs text-muted">Target {formatCompactRupiah(campaign.minimumFundingTargetIdr)}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-primary-dark" style={{ width: `${fundingProgress}%` }} /></div></div><div className="mt-auto flex flex-col gap-2 pt-6 sm:flex-row"><ButtonLink to={`/campaigns/${campaign.id}/manage`} className="flex-1">Kelola <ArrowRight size={16} aria-hidden="true" /></ButtonLink>{isPublic && <ButtonLink to={`/campaigns/${campaign.id}`} variant="outline" className="flex-1">Lihat publik</ButtonLink>}</div></div></article></li>
      })}</ul>}
    </div></section>
  </main><MarketingFooter /></div>
}
