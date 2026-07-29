import { ArrowRight, HandCoins, PackageCheck, PenLine, ShoppingBag, ShoppingCart, Tag, Truck } from 'lucide-react'
import { AnimatePresence, motion, type Transition, useInView, useReducedMotion } from 'motion/react'
import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { MarketingHeader } from '@/components/layout/marketing'
import { CampaignCollectionLoading } from '@/components/campaign/campaign-loading'
import { ButtonLink } from '@/components/ui/button'
import { useCampaigns } from '@/hooks/campaign/use-campaigns'

const workflow = [
  { icon: PenLine, title: 'Persiapan pengrajin', text: 'Pengrajin mengatur target modal awal dan profil.' },
  { icon: ShoppingBag, title: 'Target Tercapai', text: 'Target pre-order terpenuhi, produksi siap dimulai.' },
  { icon: PackageCheck, title: 'Proses Produksi', text: 'Pengrajin mulai membuat pesanan secara bertahap.' },
  { icon: Truck, title: 'Pengiriman', text: 'Pesanan selesai dan dikirim ke pelanggan.' },
]

const problems = [
  <>Pesanan sebenarnya sudah ada, tapi kami <strong className="text-primary-dark">belum punya modal</strong> untuk mulai membuatnya</>,
  <>Kalau ada modal untuk bahan, <strong className="text-primary-dark">pesanan ini sudah bisa kami kerjakan</strong></>,
  <>Saya sering menerima pesan, <strong className="text-primary-dark">Kalau dibuat lagi saya mau pesan.</strong> Tapi tanpa modal, saya belum bisa membuatnya.</>,
]

function CollectionPreview() {
  const { campaigns, loading, error } = useCampaigns({ notifyOnError: false })
  const shouldReduceMotion = useReducedMotion()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const previewCampaigns = campaigns

  useEffect(() => {
    setSelectedIndex((current) => Math.min(current, Math.max(0, previewCampaigns.length - 1)))
  }, [previewCampaigns.length])


  if (loading) return <CampaignCollectionLoading />
  if (error || previewCampaigns.length === 0) return <section id="collection" aria-labelledby="collection-heading" className="bg-white px-5 py-20 lg:px-8 lg:py-28"><div className="mx-auto max-w-[1120px]"><h2 id="collection-heading" className="sr-only">Preview koleksi kain tenun</h2><p className="text-center text-sm text-muted">Belum ada koleksi yang tersedia.</p></div></section>

  const activeIndex = Math.min(Math.max(0, selectedIndex), previewCampaigns.length - 1)
  const selected = previewCampaigns[activeIndex]!
  const slots = [
    { key: 'outer-left', offset: -2, className: 'hidden h-[126px] w-[136px] sm:block', scale: .45, opacity: .45 },
    { key: 'left', offset: -1, className: 'h-[210px] w-[225px]', scale: .75, opacity: .8 },
    { key: 'active', offset: 0, className: 'h-[280px] w-[300px]', scale: 1, opacity: 1 },
    { key: 'right', offset: 1, className: 'h-[210px] w-[225px]', scale: .75, opacity: .8 },
    { key: 'outer-right', offset: 2, className: 'hidden h-[126px] w-[136px] sm:block', scale: .45, opacity: .45 },
  ]
  const visibleCount = Math.min(5, previewCampaigns.length)
  const startOffset = -Math.min(2, Math.floor(visibleCount / 2))
  const visibleSlots = slots.filter(({ offset }) => offset >= startOffset && offset < startOffset + visibleCount)
  const collectionTransition: Transition = { duration: shouldReduceMotion ? 0 : .3, ease: [0.16, 1, 0.3, 1] }

  const cardContent = (campaign: typeof selected) => {
    const progress = campaign.targetAmount ? Math.min(100, Math.round(campaign.currentAmount / campaign.targetAmount * 100)) : 0
    return <>
      <img src={campaign.imageUrl} alt="" className="h-[52%] w-full rounded-md object-cover" loading="lazy" decoding="async" />
      <span className="mt-3 block">
        <span className="flex items-start justify-between gap-2"><span className="text-[12px] font-semibold leading-tight text-primary-dark">{campaign.title}</span><span className="shrink-0 text-[8px] font-medium text-primary-dark">{campaign.daysLeft} Hari Tersisa</span></span>
        <span className="mt-1.5 block text-[8px] text-muted">{campaign.location}</span>
        <span className="mt-5 flex items-baseline justify-between gap-1"><span className="text-sm font-semibold text-primary-dark">{progress}%</span><span className="text-[8px] text-muted">Dana Terkumpul</span></span>
        <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-line"><span className="block h-full rounded-full bg-primary-dark" style={{ width: `${progress}%` }} /></span>
      </span>
    </>
  }

  return (
    <section id="collection" aria-labelledby="collection-heading" className="overflow-hidden bg-white py-20 lg:py-28">
      <h2 id="collection-heading" className="sr-only">Preview koleksi kain tenun</h2>
      <div className="mx-auto flex max-w-[1120px] items-center justify-center gap-3 px-2 sm:gap-5 sm:px-5" aria-label="Preview koleksi kain tenun">
        {visibleSlots.map((slot) => {
          const campaignIndex = ((activeIndex + slot.offset) % previewCampaigns.length + previewCampaigns.length) % previewCampaigns.length
          const campaign = previewCampaigns[campaignIndex]!
          const isActive = slot.offset === 0
          const cardClassName = `block h-full w-full overflow-hidden rounded-lg border bg-white p-4 text-left ${isActive ? 'border-primary shadow-[0_5px_12px_rgba(8,116,95,.14)]' : 'border-line'}`
          return <motion.div key={campaign.id} layout className={`relative shrink-0 ${slot.className}`} animate={{ opacity: slot.opacity }} transition={{ layout: collectionTransition, opacity: collectionTransition }}>
            <motion.div className="absolute left-0 top-0 h-[280px] w-[300px] origin-top-left" animate={{ scale: slot.scale }} transition={collectionTransition}>
              {isActive
                ? <Link to={`/campaigns/${campaign.id}`} aria-label={`Buka ${campaign.title}`} className={`${cardClassName} focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary-dark`}>{cardContent(campaign)}</Link>
                : <button type="button" aria-label={`Tampilkan ${campaign.title} di tengah`} className={`${cardClassName} cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary-dark`} onClick={() => setSelectedIndex(campaignIndex)}>{cardContent(campaign)}</button>}
            </motion.div>
          </motion.div>
        })}
      </div>
      <div className="mt-6 flex justify-center px-5 lg:px-8"><ButtonLink to="/campaign" className="rounded-xl px-7 py-3 text-xs">Lihat Koleksi Selengkapnya</ButtonLink></div>
    </section>
  )
}

function Workflow() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section id="how-it-works" aria-labelledby="workflow-heading" className="border-b-4 border-primary bg-white px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-[920px]">
        <h2 id="workflow-heading" className="ml-3 text-4xl font-medium leading-[.92] tracking-[-.065em] text-ink sm:text-5xl">
          Alur Kerja<br />
          <span className="inline-flex items-center gap-2 text-primary"><img src="/logo.svg" alt="" aria-hidden="true" className="h-8 w-auto" />Modalin</span>
        </h2>
        <div className="relative mt-10">
          <ol className="grid w-full grid-cols-4 items-stretch gap-1 sm:gap-3 lg:gap-5" aria-label="Empat tahap alur kerja Modalin">
            {workflow.map((step, index) => {
              const Icon = step.icon
              return <motion.li key={step.title} className="relative min-w-0" initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .45 }} transition={{ delay: shouldReduceMotion ? 0 : index * .06, duration: shouldReduceMotion ? 0 : .36, ease: [0.16, 1, 0.3, 1] }}>
                <article className="flex h-full min-h-[104px] flex-col items-center justify-center rounded-lg border border-primary/45 bg-white px-1.5 py-4 text-center sm:min-h-[116px] sm:px-3 lg:min-h-[172px] lg:rounded-xl lg:px-5 lg:py-6">
                  <Icon size={20} className="shrink-0 text-primary-dark sm:h-[22px] sm:w-[22px] lg:h-[25px] lg:w-[25px]" aria-hidden="true" />
                  <h3 className="mt-2 text-[9px] font-medium leading-[1.15] text-primary-dark sm:text-xs lg:mt-3 lg:text-sm lg:leading-tight">{step.title}</h3>
                  <p className="mt-2 hidden text-xs leading-5 text-primary-dark/85 lg:block">{step.text}</p>
                </article>
                {index < workflow.length - 1 && <ArrowRight size={18} className="absolute left-full top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/45 bg-white p-0.5 text-primary-dark lg:h-6 lg:w-6 lg:p-1" aria-hidden="true" />}
              </motion.li>
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}

function ProblemStatement() {
  const shouldReduceMotion = useReducedMotion()
  const [problemIndex, setProblemIndex] = useState(0)

  useEffect(() => {
    const timeout = window.setTimeout(() => setProblemIndex((current) => (current + 1) % problems.length), 3500)
    return () => window.clearTimeout(timeout)
  }, [problemIndex])

  return <blockquote className="mt-8 flex min-h-[112px] items-center justify-center rounded-xl border border-black/10 bg-white px-7 py-8 text-center shadow-[0_3px_5px_rgba(29,37,34,.18)] sm:px-12">
    <AnimatePresence mode="wait" initial={false}>
      <motion.p key={problemIndex} className="text-base font-semibold leading-6 text-ink sm:text-lg" initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: shouldReduceMotion ? 0 : .25 }}>
        <span aria-hidden="true">“</span>{problems[problemIndex]}<span aria-hidden="true">”</span>
      </motion.p>
    </AnimatePresence>
  </blockquote>
}

function PhoneScene() {
  const reference = useRef<HTMLDivElement>(null)
  const isInView = useInView(reference, { amount: 0.28 })
  const shouldReduceMotion = useReducedMotion()
  const [isChatVisible, setIsChatVisible] = useState(shouldReduceMotion)
  const fadeUp = { opacity: 1, y: 0 }
  const phoneInitial = shouldReduceMotion ? fadeUp : { opacity: 0, y: 32 }
  const messageInitial = shouldReduceMotion ? fadeUp : { opacity: 0, y: 22 }

  useEffect(() => {
    if (shouldReduceMotion) {
      setIsChatVisible(true)
      return
    }

    setIsChatVisible(false)
    if (!isInView) return

    const revealChat = window.setTimeout(() => setIsChatVisible(true), 620)
    return () => window.clearTimeout(revealChat)
  }, [isInView, shouldReduceMotion])

  return <div ref={reference} className="problem-phone-scene relative mx-auto mt-14 h-[420px] max-w-[920px] overflow-hidden sm:h-[510px]">
    <div className="phone-ring phone-ring-one" aria-hidden="true" />
    <div className="phone-ring phone-ring-two" aria-hidden="true" />
    <div className="phone-ring phone-ring-three" aria-hidden="true" />
    <div className="phone-ring phone-ring-four" aria-hidden="true" />
    <motion.div className="absolute bottom-[-16px] left-1/2 z-10 w-[290px] -translate-x-1/2 sm:w-[340px]" initial={phoneInitial} animate={isInView ? fadeUp : phoneInitial} transition={{ duration: shouldReduceMotion ? 0 : 0.58, ease: [0.16, 1, 0.3, 1] }}>
      <div className="relative">
        <img src="/phone.png" alt="" aria-hidden="true" className="w-full" />
        <motion.div className="absolute left-[15%] top-[20%] w-[70%] rounded-2xl border border-primary-dark/40 bg-white p-3 text-left text-[11px] leading-[1.05] text-primary-dark shadow-sm sm:p-4 sm:text-sm" initial={messageInitial} animate={isChatVisible ? fadeUp : messageInitial} transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}>Setiap pesanan memiliki potensi menjadi modal. Sayangnya, potensi itu sering terhenti di percakapan.</motion.div>
        <motion.span className="absolute right-[11%] top-[52%] rounded-full bg-[#5d34ff] px-4 py-1.5 text-[10px] font-medium text-white shadow-sm sm:text-xs" initial={messageInitial} animate={isChatVisible ? fadeUp : messageInitial} transition={{ delay: isChatVisible && !shouldReduceMotion ? 0.18 : 0, duration: shouldReduceMotion ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}>Percakapan.</motion.span>
      </div>
    </motion.div>
  </div>
}

export default function LandingPage() {
  const shouldReduceMotion = useReducedMotion()


  return <div className="overflow-hidden bg-white text-ink"><MarketingHeader /><main id="main-content">
    <section className="bg-white px-5 pb-16 pt-10 sm:pb-20 lg:px-8 lg:pb-24 lg:pt-14"><div className="mx-auto grid max-w-[1120px] items-center gap-12 lg:grid-cols-[.95fr_1.05fr] lg:gap-16">
      <motion.div initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: shouldReduceMotion ? 0 : .48, ease: [0.16, 1, 0.3, 1] }}><h1 tabIndex={-1} className="max-w-[500px] text-5xl font-medium leading-[.9] tracking-[-.08em] text-black sm:text-6xl lg:text-7xl">Mengubah<br />Ketertarikan<br />Menjadi<br />Modal</h1><div className="mt-9 flex flex-wrap items-center gap-5"><p className="max-w-[184px] text-xs leading-5 text-muted">Tertarik dengan produk tekstil? Langsung saja cek koleksi kami.</p><a href="/campaign" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[linear-gradient(120deg,#00b89c_0%,#168cf2_48%,#5d34ff_100%)] px-5 py-2.5 text-xs font-semibold !text-white shadow-[0_8px_20px_rgba(93,52,255,.2)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary-dark">Cek Koleksi <ArrowRight size={15} aria-hidden="true" /></a></div></motion.div>
      <motion.div className="relative mx-auto aspect-[1.25] w-full max-w-[520px]" initial={shouldReduceMotion ? false : { opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: shouldReduceMotion ? 0 : .08, duration: shouldReduceMotion ? 0 : .56, ease: [0.16, 1, 0.3, 1] }}><img src="/hero/1.png" alt="Pengrajin sedang menjahit kain" className="absolute left-[7%] top-0 w-[56%]" /><img src="/hero/2.png" alt="Pengrajin sedang membatik" className="absolute right-[3%] top-0 w-[34%]" /><img src="/hero/3.png" alt="Pengrajin lansia sedang membatik" className="absolute right-[3%] top-[43%] w-[57%]" /><span className="hero-orb absolute left-[3%] top-[38%] h-[22%] w-[17%] bg-[radial-gradient(circle_at_30%_25%,#866fff,#5d34ff_55%,#3d18ce)] shadow-[0_12px_28px_rgba(93,52,255,.28)]" aria-hidden="true" /><span className="hero-orb absolute bottom-[9%] left-[24%] h-[23%] w-[16%] bg-[linear-gradient(135deg,#ffd465,#ffb62e)] shadow-[0_10px_24px_rgba(255,182,46,.25)]" aria-hidden="true" /><span className="hero-orb absolute bottom-[1%] right-[26%] h-[24%] w-[19%] bg-[linear-gradient(135deg,#00c7a3,#00a98c)] shadow-[0_10px_24px_rgba(0,178,143,.22)]" aria-hidden="true" /></motion.div>
    </div></section>
    <section id="problem" className="bg-white px-5 pt-14 lg:px-8 lg:pt-20"><div className="mx-auto max-w-[820px] text-center"><h2 className="text-4xl font-medium tracking-[-.07em] text-black sm:text-5xl">Masalah Utama</h2><ProblemStatement /></div><PhoneScene /></section>
    <section id="about" className="scroll-mt-16 bg-primary-dark px-5 py-20 text-white sm:py-24 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-[720px]">
        <h2 className="text-center text-2xl font-medium leading-tight tracking-[-.05em] sm:text-3xl">Modalin Hadir Untuk Memastikan Setiap Pesanan<br />Memiliki Kesempatan Menjadi Karya Nyata.</h2>
        <ol className="mx-auto mt-10 grid max-w-[580px] gap-5 sm:mt-12">
          {[[Tag, 'Temukan', 'Jelajahi koleksi kerajinan tangan dari pengrajin lokal yang telah terverifikasi.'], [ShoppingCart, 'Pre-Order', 'Pesan produk favoritmu sebelum proses produksi dimulai.'], [HandCoins, 'Dukung Produksi', 'Saat target minimum tercapai, pesanan bersama akan menjadi modal produksi bagi pengrajin.']].map(([Icon, title, text], index) => {
            const StepIcon = Icon as typeof Tag
            const offsetClass = index === 0 ? 'mr-10 sm:mr-20' : index === 1 ? 'mx-5 sm:mx-10' : 'ml-10 sm:ml-20'
            return <li key={title as string} className={`grid grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-4 ${offsetClass}`}>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-sm font-bold text-primary-dark">{index + 1}</span>
              <article className="grid min-h-[88px] grid-cols-[4.5rem_1fr] items-center rounded-xl bg-white py-3 text-primary-dark shadow-[0_8px_18px_rgba(0,45,37,.2)] sm:min-h-[100px]">
                <div className="grid h-full place-items-center border-r border-primary-dark/25"><StepIcon size={26} strokeWidth={1.8} aria-hidden="true" /></div>
                <div className="px-5"><h3 className="text-base font-medium">{title as string}</h3><p className="mt-1 text-xs leading-4 text-primary-dark/80">{text as string}</p></div>
              </article>
            </li>
          })}
        </ol>
      </div>
    </section>
    <CollectionPreview />
    <Workflow />
  </main><footer className="bg-primary-dark bg-[linear-gradient(to_bottom,rgba(255,255,255,0.10)_0,transparent_0.5rem)] px-5 py-12 text-white lg:px-8 lg:py-16"><div className="mx-auto flex max-w-[1120px] flex-col justify-between gap-9 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2"><img src="/logo.svg" alt="" aria-hidden="true" className="h-7 w-auto brightness-0 invert" /><span className="text-xl font-medium tracking-[-.05em]">Modalin</span></div><p className="mt-1 text-[10px] text-white/80">Mengubah Ketertarikan Menjadi Modal</p></div><address className="not-italic text-left text-xs leading-5 text-white/80 sm:text-right"><a href="tel:+62888163519" className="block hover:text-white">+628 8816 3519</a><a href="mailto:info@contact.modalin" className="block hover:text-white">info@contact.modalin</a></address></div></footer></div>
}
