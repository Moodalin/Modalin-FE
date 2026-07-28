import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronDown, Clock3, MapPin } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { MarketingFooter, MarketingHeader } from '@/components/layout/marketing'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/field'
import { richTextToPlainText } from '@/components/ui/rich-text-value'
import { getCampaignPage, type CampaignPageSort } from '@/api/campaigns/campaigns'
import { formatCompactRupiah } from '@/config/format'
import { CampaignStatusBadgeClassName, CampaignStatusLabel } from '@/constants/campaign-status'
import type { Campaign, CampaignStatus } from '@/types/campaign'

const statusOptions: Array<{ value: CampaignStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Semua status' },
  { value: 'funding', label: CampaignStatusLabel.funding },
  { value: 'target_reached', label: CampaignStatusLabel.target_reached },
  { value: 'in_production', label: CampaignStatusLabel.in_production },
  { value: 'completed', label: CampaignStatusLabel.completed },
]

type SortOption = CampaignPageSort

function campaignProgress(campaign: Campaign) {
  return campaign.targetAmount > 0 ? Math.min(100, Math.round(campaign.currentAmount / campaign.targetAmount * 100)) : 0
}

function appendDistinctCampaigns(current: Campaign[], incoming: Campaign[]) {
  const ids = new Set(current.map((campaign) => campaign.id))
  const distinct = incoming.filter((campaign) => {
    if (ids.has(campaign.id)) return false
    ids.add(campaign.id)
    return true
  })
  return distinct.length > 0 ? [...current, ...distinct] : current
}


function FilterMenu<T extends string>({ label, options, value, onChange }: { label: string; options: Array<{ value: T; label: string }>; value: T; onChange: (value: T) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const menuId = useId()
  const labelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value))
  const selected = options[selectedIndex]

  const focusOption = (index: number) => {
    setActiveIndex(index)
    requestAnimationFrame(() => optionRefs.current[index]?.focus())
  }
  const openMenu = (index = selectedIndex) => {
    setIsOpen(true)
    focusOption(index)
  }
  const closeMenu = (restoreFocus = false) => {
    setIsOpen(false)
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus())
  }
  const selectOption = (option: T) => {
    onChange(option)
    closeMenu(true)
  }

  useEffect(() => {
    if (!isOpen) return
    const closeOnOutsideInteraction = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) closeMenu()
    }
    document.addEventListener('pointerdown', closeOnOutsideInteraction)
    return () => document.removeEventListener('pointerdown', closeOnOutsideInteraction)
  }, [isOpen])

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      openMenu(Math.min(selectedIndex + 1, options.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      openMenu(Math.max(selectedIndex - 1, 0))
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (isOpen) closeMenu()
      else openMenu()
    } else if (event.key === 'Escape' && isOpen) {
      event.preventDefault()
      closeMenu(true)
    }
  }

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = optionRefs.current.indexOf(document.activeElement as HTMLButtonElement)
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusOption(Math.min(Math.max(currentIndex, 0) + 1, options.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusOption(Math.max(currentIndex - 1, 0))
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusOption(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusOption(options.length - 1)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (currentIndex >= 0) selectOption(options[currentIndex].value)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      closeMenu(true)
    } else if (event.key === 'Tab') {
      closeMenu()
    }
  }

  return <div ref={rootRef} className="relative grid gap-2">
    <span id={labelId} className="text-sm font-extrabold tracking-[-.01em] text-ink">{label}</span>
    <button ref={triggerRef} type="button" aria-haspopup="menu" aria-expanded={isOpen} aria-controls={menuId} aria-labelledby={labelId} onClick={() => { if (isOpen) closeMenu(); else openMenu() }} onKeyDown={handleTriggerKeyDown} className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 text-left text-base text-ink outline-none transition hover:border-primary-dark focus:border-primary-dark focus:ring-4 focus:ring-primary/15">
      <span className="truncate">{selected.label}</span>
      <ChevronDown size={18} className={isOpen ? 'shrink-0 rotate-180 text-primary-dark transition-transform' : 'shrink-0 text-muted transition-transform'} aria-hidden="true" />
    </button>
    {isOpen && <div id={menuId} role="menu" aria-labelledby={labelId} className="absolute inset-x-0 top-[calc(100%+.5rem)] z-20 overflow-hidden rounded-xl border border-line bg-white p-1 shadow-[0_16px_38px_rgba(29,37,34,.14)]" onKeyDown={handleMenuKeyDown}>
      {options.map((option, index) => <button key={option.value} ref={(element) => { optionRefs.current[index] = element }} tabIndex={index === activeIndex ? 0 : -1} type="button" role="menuitemradio" aria-checked={option.value === value} onClick={() => selectOption(option.value)} className={option.value === value ? 'flex min-h-10 w-full items-center justify-between gap-3 rounded-lg bg-primary/10 px-3 text-left text-sm font-extrabold text-primary-dark' : 'flex min-h-10 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-sm font-semibold text-ink hover:bg-cream focus:bg-cream focus:outline-none'}>
        <span>{option.label}</span>
        {option.value === value && <Check size={16} aria-hidden="true" />}
      </button>)}
    </div>}
  </div>
}

function CampaignCard({ campaign, index, shouldReduceMotion }: { campaign: Campaign; index: number; shouldReduceMotion: boolean | null }) {
  const progress = campaignProgress(campaign)
  const statusClassName = CampaignStatusBadgeClassName[campaign.status]

  return <motion.li initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: shouldReduceMotion ? 0 : .28, delay: shouldReduceMotion ? 0 : Math.min(index * .04, .2), ease: [0.16, 1, 0.3, 1] }}>
    <article className="group h-full overflow-hidden rounded-2xl border border-line bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(29,37,34,.09)] focus-within:shadow-[0_20px_45px_rgba(29,37,34,.09)]">
      <Link to={`/campaigns/${campaign.id}`} className="block focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary-dark">
        <img src={campaign.imageUrl} alt={campaign.imageAlt} className="aspect-[1.2] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" decoding="async" />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3"><Badge className={statusClassName}>{CampaignStatusLabel[campaign.status]}</Badge><span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-muted"><Clock3 size={14} aria-hidden="true" />{campaign.daysLeft > 0 ? `${campaign.daysLeft} hari` : 'Berakhir'}</span></div>
          <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-[-.045em] text-ink">{campaign.title}</h2>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{richTextToPlainText(campaign.description)}</p>
          <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-primary-dark"><MapPin size={15} aria-hidden="true" />{campaign.location}</p>
          <div className="mt-5 pt-4"><div className="flex items-baseline justify-between gap-3"><span className="text-xl font-extrabold tracking-[-.04em] text-primary-dark">{progress}%</span><span className="text-right text-xs text-muted">{formatCompactRupiah(campaign.currentAmount)} terkumpul</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-primary-dark" style={{ width: `${progress}%` }} /></div></div>
        </div>
      </Link>
    </article>
  </motion.li>
}

function CampaignResultsLoading() {
  const shouldReduceMotion = useReducedMotion()

  return <section aria-label="Memuat koleksi kampanye" aria-busy="true" className="mt-8"><div aria-hidden="true" className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <motion.div key={index} className="overflow-hidden rounded-2xl border border-line bg-white" animate={shouldReduceMotion ? { opacity: 1 } : { opacity: [0.62, 1, 0.62] }} transition={shouldReduceMotion ? { duration: 0 } : { duration: 1.3, delay: index * .08, repeat: Infinity, ease: 'easeInOut' }}><motion.div className="aspect-[1.2] bg-[linear-gradient(110deg,var(--color-line)_20%,white_45%,var(--color-line)_70%)] bg-[length:200%_100%]" animate={shouldReduceMotion ? { backgroundPosition: '0 0' } : { backgroundPosition: ['200% 0', '-200% 0'] }} transition={shouldReduceMotion ? { duration: 0 } : { duration: 1.8, delay: index * .08, repeat: Infinity, ease: 'linear' }} /><div className="space-y-3 p-5"><div className="h-5 w-28 rounded bg-line" /><div className="h-7 w-4/5 rounded bg-line" /><div className="h-4 w-full rounded bg-line" /><div className="h-4 w-3/5 rounded bg-line" /><div className="mt-5 h-1.5 w-full rounded bg-line" /></div></motion.div>)}</div></section>
}
 

export default function CampaignCollectionPage() {
  const shouldReduceMotion = useReducedMotion()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [knownLocations, setKnownLocations] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [requestVersion, setRequestVersion] = useState(0)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [status, setStatus] = useState<CampaignStatus | 'all'>('all')
  const [location, setLocation] = useState('all')
  const [sort, setSort] = useState<SortOption>('progress')
  const sentinelRef = useRef<HTMLDivElement>(null)
  const requestControllerRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)
  const inFlightRef = useRef(false)

  const retry = useCallback(() => setRequestVersion((version) => version + 1), [])

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => window.clearTimeout(timeout)
  }, [query])

  useEffect(() => {
    const controller = new AbortController()
    const requestId = ++requestIdRef.current
    requestControllerRef.current?.abort()
    requestControllerRef.current = controller
    inFlightRef.current = true
    setCampaigns([])
    setNextCursor(null)
    setLoading(true)
    setError(false)
    setLoadingMore(false)
    setLoadMoreError(false)

    getCampaignPage({
      limit: 10,
      signal: controller.signal,
      query: debouncedQuery || undefined,
      status: status === 'all' ? undefined : status,
      location: location === 'all' ? undefined : location,
      sort,
    }).then((page) => {
      if (controller.signal.aborted || requestId !== requestIdRef.current) return
      setCampaigns(appendDistinctCampaigns([], page.items))
      setKnownLocations(page.facets.locations)
      setNextCursor(page.nextCursor)
    }).catch(() => {
      if (controller.signal.aborted || requestId !== requestIdRef.current) return
      setError(true)
    }).finally(() => {
      if (controller.signal.aborted || requestId !== requestIdRef.current) return
      inFlightRef.current = false
      setLoading(false)
      if (requestControllerRef.current === controller) requestControllerRef.current = null
    })

    return () => controller.abort()
  }, [debouncedQuery, location, requestVersion, sort, status])

  const loadMore = useCallback(() => {
    if (!nextCursor || inFlightRef.current) return
    const controller = new AbortController()
    const requestId = ++requestIdRef.current
    requestControllerRef.current = controller
    inFlightRef.current = true
    setLoadingMore(true)
    setLoadMoreError(false)

    getCampaignPage({
      limit: 10,
      cursor: nextCursor,
      signal: controller.signal,
      query: debouncedQuery || undefined,
      status: status === 'all' ? undefined : status,
      location: location === 'all' ? undefined : location,
      sort,
    }).then((page) => {
      if (controller.signal.aborted || requestId !== requestIdRef.current) return
      setCampaigns((current) => appendDistinctCampaigns(current, page.items))
      setNextCursor(page.nextCursor)
    }).catch(() => {
      if (controller.signal.aborted || requestId !== requestIdRef.current) return
      setLoadMoreError(true)
    }).finally(() => {
      if (controller.signal.aborted || requestId !== requestIdRef.current) return
      inFlightRef.current = false
      setLoadingMore(false)
      if (requestControllerRef.current === controller) requestControllerRef.current = null
    })
  }, [debouncedQuery, location, nextCursor, sort, status])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || loading || error || loadMoreError || !nextCursor) return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadMore()
    }, { rootMargin: '400px 0px' })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [error, loadMore, loadMoreError, loading, nextCursor])

  useEffect(() => () => requestControllerRef.current?.abort(), [])

  return <div className="min-h-screen bg-white text-ink"><MarketingHeader /><main id="main-content">
    <section className="bg-white px-5 py-12 lg:px-8 lg:py-20"><div className="mx-auto max-w-[1280px]"><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-primary-dark">Koleksi Modalin</p><h1 tabIndex={-1} className="mt-4 max-w-3xl font-display text-5xl leading-[.88] tracking-[-.065em] text-ink sm:text-6xl lg:text-7xl">Temukan kain yang dibuat dari permintaan nyata.</h1><p className="mt-6 max-w-2xl text-base leading-7 text-muted">Telusuri kampanye tenun dari kelompok pengrajin di berbagai daerah, lalu pesan produk yang membantu proses produksi dimulai.</p></div></section>
    <section className="px-5 py-8 lg:px-8 lg:py-12"><div className="mx-auto max-w-[1280px]">
      <form role="search" onSubmit={(event) => event.preventDefault()} className="grid gap-4 bg-white lg:grid-cols-[minmax(0,1fr)_190px_190px_190px] lg:items-end">
        <Input id="campaign-search" type="search" label="Cari kampanye" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nama kain, pengrajin, atau daerah" className="bg-white" />
        <FilterMenu label="Status" value={status} onChange={setStatus} options={statusOptions} />
        <FilterMenu label="Lokasi" value={location} onChange={setLocation} options={[{ value: 'all', label: 'Semua lokasi' }, ...knownLocations.map((option) => ({ value: option, label: option }))]} />
        <FilterMenu label="Urutkan" value={sort} onChange={setSort} options={[{ value: 'progress', label: 'Progres tertinggi' }, { value: 'deadline', label: 'Segera berakhir' }, { value: 'target', label: 'Target dana tertinggi' }]} />
      </form>

      {loading ? <CampaignResultsLoading /> : error ? <div className="grid min-h-80 place-items-center rounded-2xl border border-line bg-white p-8 text-center"><div><h2 className="text-2xl font-extrabold tracking-[-.04em] text-ink">Koleksi belum dapat dimuat.</h2><p className="mt-3 max-w-md text-sm leading-6 text-muted">Periksa koneksi Anda lalu coba muat koleksi kembali.</p><button type="button" onClick={retry} className="mt-6 min-h-11 rounded-xl border border-primary-dark px-5 text-sm font-extrabold text-primary-dark hover:bg-primary-dark hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary-dark">Muat ulang koleksi</button></div></div> : campaigns.length === 0 ? <div className="grid min-h-80 place-items-center p-8 text-center"><div><h2 className="text-2xl font-extrabold tracking-[-.04em] text-ink">Belum ada kampanye yang cocok.</h2><p className="mt-3 text-sm text-muted">Ubah kata kunci atau filter untuk melihat koleksi lain.</p></div></div> : <><ul className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{campaigns.map((campaign, index) => <CampaignCard key={campaign.id} campaign={campaign} index={index} shouldReduceMotion={shouldReduceMotion} />)}</ul><div ref={sentinelRef} className="mt-8 grid min-h-12 place-items-center text-center">{loadingMore ? <div role="status" aria-live="polite" aria-busy="true" className="flex items-center gap-3 text-sm font-semibold text-muted"><span aria-hidden="true" className="h-4 w-4 rounded-full border-2 border-line border-t-primary-dark motion-safe:animate-spin" />Memuat kampanye lainnya…</div> : loadMoreError ? <div role="alert"><p className="text-sm text-muted">Kampanye berikutnya belum dapat dimuat.</p><button type="button" onClick={loadMore} className="mt-3 min-h-11 rounded-xl border border-primary-dark px-5 text-sm font-extrabold text-primary-dark hover:bg-primary-dark hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary-dark">Coba lagi</button></div> : nextCursor === null ? <p role="status" className="text-sm text-muted">Semua kampanye telah dimuat.</p> : null}</div></>}
    </div></section>
  </main><MarketingFooter /></div>
}
