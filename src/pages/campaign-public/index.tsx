import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowRight, CalendarDays, ChevronDown, Clock3, MapPin, ShieldCheck, Users } from 'lucide-react'
import { PageLoading } from '@/components/ui/page-loading'
import { CampaignProgress, SectionHeading } from '@/components/campaign/campaign-ui'
import { ProductCard } from '@/components/campaign/product-card'
import { TextileImage } from '@/components/campaign/textile-image'
import { MarketingFooter, MarketingHeader } from '@/components/layout/marketing'
import { ButtonLink } from '@/components/ui/button'
import { RichTextView } from '@/components/ui/rich-text'
import { formatRupiah } from '@/config/format'
import { TextileSources } from '@/constants/textile-sources'
import { useCampaign } from '@/hooks/campaign/use-campaign'

const faqs = [
  { q: 'Bagaimana jika kampanye tidak mencapai target?', a: 'Kampanye ditutup sesuai ketentuan pengembalian dana yang dipublikasikan. Perpanjangan hanya dapat dilakukan dengan persetujuan pelanggan.' },
  { q: 'Mengapa warna dan pola dapat berbeda?', a: 'Setiap produk diwarnai dan ditenun dengan tangan. Variasi kecil merupakan bagian dari kerajinan.' },
  { q: 'Kapan pesanan saya dikirim?', a: 'Kampanye mencantumkan perkiraan pengiriman yang dapat diperbarui kelompok pengrajin selama produksi.' },
]

export default function CampaignPublicPage() {
  const { campaignId = 'seed-modalin-eastern-sky-weave' } = useParams()
  const { campaign, loading, error } = useCampaign(campaignId)
  const [openFaq, setOpenFaq] = useState(0)
  if (loading) return <PageLoading />
  if (!campaign || error) return <main id="main-content" className="grid min-h-screen place-items-center bg-white"><ButtonLink to="/" variant="outline">Kembali ke beranda</ButtonLink></main>
  const progress = campaign.targetAmount ? campaign.currentAmount / campaign.targetAmount * 100 : 0
  return <div className="bg-white"><MarketingHeader /><main id="main-content" className="pb-24 lg:pb-0">
    <section className="landing-soft-gradient border-b border-line px-5 py-10 lg:px-8 lg:py-16">
      <div className="mx-auto grid max-w-[1180px] gap-9 lg:grid-cols-[1.02fr_.98fr] lg:items-start lg:gap-14">
        <div className="overflow-hidden rounded-2xl border border-line bg-cotton"><TextileImage imageUrl={campaign.imageUrl} imageAlt={campaign.imageAlt} className="aspect-[4/3]" imageClassName="h-full w-full object-cover" /></div>
        <div className="flex min-w-0 flex-col">
          <h1 tabIndex={-1} className="max-w-2xl font-display text-5xl leading-[.94] tracking-[-.055em] text-ink outline-none sm:text-6xl">{campaign.title}</h1>
          <RichTextView value={campaign.description} className="mt-5 max-w-xl text-base leading-7" />
          <dl className="mt-6 flex flex-wrap gap-x-7 gap-y-3 border-y border-line py-4 text-sm">
            <div className="flex items-center gap-2"><MapPin size={16} className="text-primary-dark" aria-hidden="true" /><dt className="sr-only">Lokasi</dt><dd className="font-bold text-ink">{campaign.location}</dd></div>
            <div className="flex items-center gap-2"><Users size={16} className="text-primary-dark" aria-hidden="true" /><dt className="sr-only">Jumlah pengrajin</dt><dd className="font-bold text-ink">{campaign.artisanCount} pengrajin</dd></div>
          </dl>
          <div className="mt-6"><CampaignProgress campaign={campaign} /></div>
          <ButtonLink to={`/checkout?campaign=${campaign.id}`} className="mt-4 w-full">Pesan produk <ArrowRight size={17} aria-hidden="true" /></ButtonLink>
          <p className="mt-3 text-center text-xs leading-5 text-muted">Produksi dimulai setelah target minimum tercapai.</p>
        </div>
      </div>
    </section>
    <section className="bg-white px-5 py-16 lg:px-8 lg:py-20"><div className="mx-auto max-w-[1180px]"><SectionHeading eyebrow="Koleksi" title="Pilih produk untuk dipesan." description="Pilih produk dan varian yang tersedia. Perbedaan kecil pada warna dan tekstur merupakan hasil proses buatan tangan." /><div className="mt-9 grid gap-5 lg:grid-cols-2">{campaign.products.map((product) => <ProductCard key={product.id} product={product} campaignId={campaign.id} />)}</div></div></section>
    <section className="px-5 py-16 lg:px-8 lg:py-24"><div className="mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-[.85fr_1.15fr] lg:items-center"><div className="overflow-hidden rounded-3xl"><TextileImage source={TextileSources.floresWeaver} className="aspect-square" showAttribution /></div><div><SectionHeading eyebrow="Kelompok pengrajin" title={campaign.artisanGroup} description={`Kelompok pengrajin di ${campaign.location} mengoordinasikan bahan, pembagian kerja, dan pemeriksaan akhir berdasarkan pesanan yang dikonfirmasi.`} /><div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-line bg-white p-4"><p className="text-2xl font-extrabold text-primary-dark">{campaign.artisanCount}</p><p className="mt-1 text-xs text-muted">anggota kelompok</p></div><div className="rounded-2xl border border-line bg-white p-4"><p className="text-2xl font-extrabold text-primary-dark">{campaign.targetOrders}</p><p className="mt-1 text-xs text-muted">target pesanan</p></div><div className="rounded-2xl border border-line bg-white p-4"><p className="text-2xl font-extrabold text-primary-dark">{campaign.deliveryEstimate}</p><p className="mt-1 text-xs text-muted">perkiraan kirim</p></div></div></div></div></section>
    <section className="bg-white px-5 py-16 lg:px-8 lg:py-24"><div className="mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-2 lg:items-center"><div><p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-primary-dark">Cerita motif</p><h2 className="mt-4 max-w-xl font-display text-5xl leading-[.88] tracking-[-.05em] text-ink">Konteks menyertai kain.</h2><RichTextView value={campaign.motifStory} className="mt-6 max-w-xl text-base leading-8" /></div><div className="overflow-hidden rounded-3xl"><TextileImage source={TextileSources.lembataIkat} imageClassName="mx-auto block !h-auto !w-auto max-h-[32rem] max-w-full object-contain lg:max-h-[38rem]" showAttribution /></div></div></section>
    <section className="bg-white px-5 py-16 lg:px-8 lg:py-24"><div className="mx-auto grid max-w-[1280px] gap-14 lg:grid-cols-2"><div><SectionHeading eyebrow="Anggaran produksi" title="Target yang dapat ditelusuri." description="Kelompok pengrajin mengonfirmasi perkiraan biaya sebelum kampanye dipublikasikan." /><div className="mt-8 overflow-hidden rounded-2xl border border-line">{campaign.fundAllocation.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 border-b border-line px-4 py-4 text-sm last:border-b-0"><span className="flex items-center gap-3 text-muted"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span><strong className="text-ink">{formatRupiah(item.amount)}</strong></div>)}</div></div><div><SectionHeading eyebrow="Tahap produksi" title="Dari pesanan ke pengiriman." description="Perkembangan dibagikan sepanjang proses produksi." /><ol className="mt-8 grid gap-3">{campaign.milestones.map((item) => <li key={item.id} className="rounded-2xl border border-line bg-white p-4"><div className="flex items-center justify-between gap-4"><strong className="text-ink">{item.title}</strong><span className="text-xs font-bold text-primary-dark">{item.date}</span></div><p className="mt-2 text-sm text-muted">{item.detail}</p></li>)}</ol></div></div></section>
    <section className="bg-white px-5 py-12 lg:px-8"><div className="mx-auto grid max-w-[1280px] overflow-hidden rounded-2xl border border-line bg-white sm:grid-cols-3">{[{ icon: ShieldCheck, title: 'Produk nyata', text: 'Anda membeli produk tekstil, bukan instrumen keuangan.' }, { icon: CalendarDays, title: `Ditutup ${campaign.deadline}`, text: 'Batas waktu kampanye berbeda dari perkiraan pengiriman.' }, { icon: Clock3, title: `Dikirim ${campaign.deliveryEstimate}`, text: 'Kelompok pengrajin membagikan perkembangan selama produksi.' }].map((item) => { const Icon = item.icon; return <article key={item.title} className="border-b border-line p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><Icon size={22} className="text-primary-dark" aria-hidden="true" /><h3 className="mt-5 font-display text-2xl text-ink">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted">{item.text}</p></article> })}</div></section>
    <section className="px-5 py-16 lg:px-8 lg:py-24"><div className="mx-auto max-w-3xl"><SectionHeading eyebrow="Sebelum memesan" title="Pertanyaan yang sering diajukan." /><div className="mt-8 overflow-hidden rounded-2xl border border-line bg-white">{faqs.map((faq, index) => <div key={faq.q} className="border-b border-line last:border-b-0"><button type="button" className="flex min-h-16 w-full items-center justify-between gap-4 px-5 text-left font-extrabold text-ink" aria-expanded={openFaq === index} aria-controls={`faq-${index}`} onClick={() => setOpenFaq(openFaq === index ? -1 : index)}>{faq.q}<ChevronDown className={openFaq === index ? 'rotate-180 text-primary-dark' : 'text-muted'} size={18} aria-hidden="true" /></button><div id={`faq-${index}`} hidden={openFaq !== index}><p className="px-5 pb-5 pr-10 text-sm leading-7 text-muted">{faq.a}</p></div></div>)}</div></div></section>
  </main><div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white p-3 lg:hidden"><ButtonLink to={`/checkout?campaign=${campaign.id}`} className="w-full">Pesan produk · {Math.round(progress)}%</ButtonLink></div><MarketingFooter /></div>
}
