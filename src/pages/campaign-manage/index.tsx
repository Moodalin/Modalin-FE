import { useEffect, useState } from 'react'
import { ArrowLeft, ExternalLink, ImagePlus, LockKeyhole, Save, Send, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteCampaign, getManagedCampaign, publishCampaign, updateCampaign, updateCampaignImage, updateCampaignProductImage } from '@/api/campaigns/campaigns'
import type { UpdateCampaignInput } from '@/api/campaigns/campaigns'
import { DashboardLayout } from '@/components/layout/dashboard'
import { Button, ButtonLink } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/field'
import { PageLoading } from '@/components/ui/page-loading'
import { RichTextEditor } from '@/components/ui/rich-text'
import { richTextLength } from '@/components/ui/rich-text-value'
import { Select, type SelectOption } from '@/components/ui/select'
import { getApiErrorMessage } from '@/config/api-error'
import { formatRupiah } from '@/config/format'
import { useToast } from '@/hooks/use-toast'
import type { ManagedCampaign } from '@/types/campaign'

const statusLabels: Record<string, string> = {
  DRAFT: 'Draf', REVIEW: 'Perlu ditinjau', PUBLISHED: 'Terbit', FUNDING: 'Pre-order dibuka', EXTENDED: 'Diperpanjang', TARGET_REACHED: 'Target tercapai', IN_PRODUCTION: 'Dalam produksi', QUALITY_CHECK: 'Pemeriksaan kualitas', PACKING: 'Pengemasan', SHIPPING: 'Pengiriman', COMPLETED: 'Selesai', FAILED: 'Target tidak tercapai', CANCELLED: 'Dibatalkan',
}

const costOptions: SelectOption[] = [
  { value: 'MATERIAL', label: 'Bahan' }, { value: 'LABOUR', label: 'Tenaga kerja' }, { value: 'PACKAGING', label: 'Kemasan' }, { value: 'TRANSPORT', label: 'Transportasi' }, { value: 'OTHER', label: 'Lainnya' }, { value: 'RESERVE', label: 'Cadangan' },
]

type EditForm = Pick<ManagedCampaign, 'title' | 'description' | 'motifStory' | 'productionDurationDays' | 'minimumFundingTargetIdr' | 'minimumOrderQuantity' | 'products' | 'costItems'>

function campaignForm(campaign: ManagedCampaign): EditForm {
  return {
    title: campaign.title,
    description: campaign.description,
    motifStory: campaign.motifStory,
    productionDurationDays: campaign.productionDurationDays,
    minimumFundingTargetIdr: campaign.minimumFundingTargetIdr,
    minimumOrderQuantity: campaign.minimumOrderQuantity,
    products: campaign.products.map((product) => ({ ...product })),
    costItems: campaign.costItems.map((item) => ({ ...item })),
  }
}

export default function CampaignManagePage() {
  const { campaignId = '' } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [campaign, setCampaign] = useState<ManagedCampaign | null>(null)
  const [form, setForm] = useState<EditForm | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState('')
  const [error, setError] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [confirmingPublish, setConfirmingPublish] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    getManagedCampaign(campaignId)
      .then((data) => { if (active) { setCampaign(data); setForm(campaignForm(data)) } })
      .catch((caught) => { if (active) setError(getApiErrorMessage(caught, 'Kampanye tidak dapat dimuat.')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [campaignId])

  useEffect(() => {
    if (!image) return setPreviewUrl('')
    const url = URL.createObjectURL(image)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [image])

  const validImage = (file: File | null) => {
    if (!file) return false
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast({ message: 'Gunakan gambar JPG, PNG, atau WebP.', variant: 'error' }); return false }
    if (file.size > 10 * 1024 * 1024) { toast({ message: 'Pilih gambar di bawah 10 MB.', variant: 'error' }); return false }
    return true
  }

  const update = <K extends keyof EditForm>(key: K, value: EditForm[K]) => setForm((current) => current ? { ...current, [key]: value } : current)
  const updateProduct = <K extends keyof ManagedCampaign['products'][number]>(id: string, key: K, value: ManagedCampaign['products'][number][K]) => setForm((current) => current ? { ...current, products: current.products.map((product) => product.id === id ? { ...product, [key]: value } : product) } : current)
  const updateCost = <K extends keyof ManagedCampaign['costItems'][number]>(id: string, key: K, value: ManagedCampaign['costItems'][number][K]) => setForm((current) => current ? { ...current, costItems: current.costItems.map((item) => item.id === id ? { ...item, [key]: value } : item) } : current)

  const save = async () => {
    if (!campaign || !form) return
    if (form.title.trim().length < 3 || form.title.trim().length > 200 || richTextLength(form.description) < 1 || richTextLength(form.motifStory) < 1) return toast({ message: 'Lengkapi judul, cerita kampanye, dan konteks motif.', variant: 'error' })
  const commercialUnlocked = ['DRAFT', 'REVIEW', 'PUBLISHED', 'FUNDING', 'EXTENDED'].includes(campaign.status) && campaign._count.orders === 0
    if (commercialUnlocked && (form.productionDurationDays < 1 || form.productionDurationDays > 365 || form.minimumFundingTargetIdr < 1 || form.minimumOrderQuantity < 1 || form.products.some((product) => product.name.trim().length < 2 || !product.productType.trim() || richTextLength(product.description) < 1 || product.priceIdr < 1) || form.costItems.some((item) => !item.name.trim() || item.plannedTotalIdr < 0))) return toast({ message: 'Periksa kembali produk, harga, target, durasi, dan rincian biaya.', variant: 'error' })
    const input: UpdateCampaignInput = {
      title: form.title.trim(), description: form.description, motifStory: form.motifStory,
      ...(commercialUnlocked ? {
        productionDurationDays: form.productionDurationDays,
        minimumFundingTargetIdr: form.minimumFundingTargetIdr,
        minimumOrderQuantity: form.minimumOrderQuantity,
        products: form.products.map(({ id, name, productType, description, priceIdr }) => ({ id, name: name.trim(), productType: productType.trim(), description, priceIdr })),
        costItems: form.costItems.map(({ id, category, name, plannedTotalIdr }) => ({ id, category, name: name.trim(), plannedTotalIdr })),
      } : {}),
    }
    setPending('save')
    try {
      const response = await updateCampaign(campaignId, input)
      setCampaign(response.data)
      setForm(campaignForm(response.data))
      toast({ message: 'Perubahan kampanye berhasil disimpan.', variant: 'success' })
    } catch (caught) {
      toast({ message: getApiErrorMessage(caught, 'Perubahan kampanye tidak dapat disimpan.'), variant: 'error' })
    } finally { setPending('') }
  }

  const saveImage = async () => {
    if (!image) return
    setPending('image')
    try {
      const response = await updateCampaignImage(campaignId, image)
      setCampaign(response.data); setImage(null)
      toast({ message: 'Foto utama kampanye diperbarui.', variant: 'success' })
    } catch (caught) { toast({ message: getApiErrorMessage(caught, 'Foto kampanye tidak dapat diperbarui.'), variant: 'error' }) }
    finally { setPending('') }
  }

  const saveProductImage = async (productId: string, file: File | null) => {
    if (!validImage(file) || !file) return
    setPending(`product-${productId}`)
    try {
      const response = await updateCampaignProductImage(campaignId, productId, file)
      setCampaign(response.data); setForm(campaignForm(response.data))
      toast({ message: 'Foto produk diperbarui.', variant: 'success' })
    } catch (caught) { toast({ message: getApiErrorMessage(caught, 'Foto produk tidak dapat diperbarui.'), variant: 'error' }) }
    finally { setPending('') }
  }

  const publish = async () => {
    setPending('publish')
    try { const response = await publishCampaign(campaignId); setCampaign(response.data); setForm(campaignForm(response.data)); setConfirmingPublish(false); toast({ message: 'Kampanye berhasil diterbitkan.', variant: 'success' }) }
    catch (caught) { toast({ message: getApiErrorMessage(caught, 'Kampanye tidak dapat diterbitkan.'), variant: 'error' }) }
    finally { setPending('') }
  }

  const remove = async () => {
    setPending('delete')
    try { await deleteCampaign(campaignId); toast({ message: 'Kampanye draf berhasil dihapus.', variant: 'success' }); navigate('/my-campaigns', { replace: true }) }
    catch (caught) { toast({ message: getApiErrorMessage(caught, 'Kampanye tidak dapat dihapus.'), variant: 'error' }) }
    finally { setPending('') }
  }

  if (loading) return <PageLoading />
  if (error || !campaign || !form) return <main id="main-content" className="grid min-h-[100dvh] place-items-center px-5 text-center"><div><h1 className="text-3xl font-extrabold text-ink">Kampanye tidak dapat dimuat</h1><p role="alert" className="mt-3 text-sm text-muted">{error}</p><ButtonLink to="/my-campaigns" className="mt-6">Kembali</ButtonLink></div></main>

  const canPublish = ['DRAFT', 'REVIEW'].includes(campaign.status)
  const canDelete = canPublish && !campaign.publishedAt && campaign._count.orders === 0
  const commercialUnlocked = campaign._count.orders === 0
  const plannedTotal = form.costItems.reduce((sum, item) => sum + item.plannedTotalIdr, 0)
  const disabledClass = commercialUnlocked ? '' : 'opacity-70'

  return <DashboardLayout active="overview">
    <div className="mx-auto max-w-5xl">
      <Link to="/my-campaigns" className="inline-flex min-h-11 items-center gap-2 text-sm font-extrabold text-primary-dark"><ArrowLeft size={17} aria-hidden="true" />Kampanye Saya</Link>
      <header className="mt-5 flex flex-col justify-between gap-5 border-b border-line pb-7 sm:flex-row sm:items-end"><div><p className="text-xs font-extrabold uppercase tracking-[.12em] text-primary-dark">{statusLabels[campaign.status] ?? campaign.status}</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-.04em] text-ink">Kelola kampanye</h1><p className="mt-2 text-sm leading-6 text-muted">Perbarui informasi kampanye sesuai tahap dan pesanan yang sudah masuk.</p></div>{campaign.publishedAt && <ButtonLink to={`/campaigns/${campaign.id}`} variant="outline"><ExternalLink size={16} aria-hidden="true" />Halaman publik</ButtonLink>}</header>

      {!commercialUnlocked && <div className="mt-6 flex gap-3 rounded-2xl border border-amber/40 bg-amber/10 p-4 text-sm leading-6 text-ink"><LockKeyhole size={19} className="mt-0.5 shrink-0 text-primary-dark" aria-hidden="true" /><p><strong>Data komersial dikunci.</strong> Produk, harga, target, durasi, dan biaya tidak dapat diubah karena kampanye sudah memiliki pesanan. Judul, cerita, konteks motif, dan foto utama tetap dapat diperbaiki.</p></div>}

      <div className="mt-6 grid gap-6">
        <section className="rounded-2xl border border-line bg-white p-5 sm:p-7"><h2 className="text-xl font-extrabold text-ink">Informasi publik</h2><p className="mt-1 text-xs leading-5 text-muted">Informasi ini tampil pada halaman kampanye.</p><div className="mt-6 grid gap-5"><Input id="campaign-title" label="Judul kampanye" required maxLength={200} value={form.title} onChange={(event) => update('title', event.target.value)} /><RichTextEditor id="campaign-description" label="Cerita kampanye" required maxLength={5000} value={form.description} onChange={(value) => update('description', value)} /><RichTextEditor id="campaign-motif" label="Konteks motif dan budaya" required maxLength={5000} value={form.motifStory} onChange={(value) => update('motifStory', value)} /></div></section>

        <section className="rounded-2xl border border-line bg-white p-5 sm:p-7"><h2 className="text-xl font-extrabold text-ink">Foto utama</h2><p className="mt-1 text-xs text-muted">Foto utama tetap dapat diperbaiki selama kampanye berjalan.</p><div className="mt-5 grid gap-5 sm:grid-cols-[260px_1fr] sm:items-start"><img src={previewUrl || campaign.heroImageUrl || '/hero/1.png'} alt={`Foto utama ${campaign.title}`} className="aspect-[16/9] w-full rounded-xl border border-line object-cover" /><div><input id="campaign-image" type="file" accept="image/jpeg,image/png,image/webp" className="peer sr-only" onChange={(event) => { const file = event.target.files?.[0] ?? null; if (validImage(file)) setImage(file); event.currentTarget.value = '' }} /><label htmlFor="campaign-image" className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary-dark px-4 py-2 text-sm font-extrabold text-primary-dark peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-dark"><ImagePlus size={16} aria-hidden="true" />Pilih foto</label>{image && <Button type="button" className="ml-2" onClick={saveImage} disabled={pending !== ''} loading={pending === 'image'}>Simpan foto</Button>}</div></div></section>

        <section className={`rounded-2xl border border-line bg-white p-5 sm:p-7 ${disabledClass}`} aria-disabled={!commercialUnlocked}><div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-extrabold text-ink">Produk dan harga</h2><p className="mt-1 text-xs text-muted">Perubahan tersedia sebelum pesanan pertama masuk.</p></div>{!commercialUnlocked && <LockKeyhole size={18} className="text-muted" aria-hidden="true" />}</div><div className="mt-6 grid gap-5">{form.products.map((product, index) => <fieldset key={product.id} disabled={!commercialUnlocked} className="rounded-xl border border-line p-4"><legend className="px-1 text-sm font-extrabold text-ink">Produk {index + 1}</legend><div className="grid gap-5 lg:grid-cols-[180px_1fr]"><div><img src={product.imageUrl || '/hero/1.png'} alt={`Foto ${product.name}`} className="aspect-square w-full rounded-xl border border-line object-cover" />{commercialUnlocked && <><input id={`product-image-${product.id}`} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { void saveProductImage(product.id, event.currentTarget.files?.[0] ?? null); event.currentTarget.value = '' }} /><label htmlFor={`product-image-${product.id}`} className="mt-3 inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary-dark px-3 text-sm font-extrabold text-primary-dark"><ImagePlus size={15} aria-hidden="true" />{pending === `product-${product.id}` ? 'Mengunggah…' : 'Ganti foto'}</label></>}</div><div className="grid gap-5 sm:grid-cols-2"><Input id={`product-name-${product.id}`} label="Nama produk" required value={product.name} onChange={(event) => updateProduct(product.id, 'name', event.target.value)} /><Input id={`product-type-${product.id}`} label="Jenis produk" required value={product.productType} onChange={(event) => updateProduct(product.id, 'productType', event.target.value)} /><Input id={`product-price-${product.id}`} label="Harga" type="number" min={1} required value={product.priceIdr} onChange={(event) => updateProduct(product.id, 'priceIdr', Number(event.target.value))} /><div className="sm:col-span-2"><RichTextEditor id={`product-description-${product.id}`} label="Deskripsi produk" required disabled={!commercialUnlocked} maxLength={2000} value={product.description} onChange={(value) => updateProduct(product.id, 'description', value)} /></div></div></div></fieldset>)}</div></section>

        <section className={`rounded-2xl border border-line bg-white p-5 sm:p-7 ${disabledClass}`} aria-disabled={!commercialUnlocked}><div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-extrabold text-ink">Target produksi</h2><p className="mt-1 text-xs text-muted">Target dan estimasi terkunci setelah pesanan masuk.</p></div>{!commercialUnlocked && <LockKeyhole size={18} className="text-muted" aria-hidden="true" />}</div><fieldset disabled={!commercialUnlocked} className="mt-6 grid gap-5 sm:grid-cols-3"><Input id="production-duration" label="Durasi produksi (hari)" type="number" min={1} max={365} required value={form.productionDurationDays} onChange={(event) => update('productionDurationDays', Number(event.target.value))} /><Input id="minimum-funding" label="Target dana" type="number" min={1} required value={form.minimumFundingTargetIdr} onChange={(event) => update('minimumFundingTargetIdr', Number(event.target.value))} /><Input id="minimum-orders" label="Minimum pesanan" type="number" min={1} required value={form.minimumOrderQuantity} onChange={(event) => update('minimumOrderQuantity', Number(event.target.value))} /></fieldset></section>

        <section className={`rounded-2xl border border-line bg-white p-5 sm:p-7 ${disabledClass}`} aria-disabled={!commercialUnlocked}><div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-extrabold text-ink">Rincian biaya</h2><p className="mt-1 text-xs text-muted">Total rencana {formatRupiah(plannedTotal)}</p></div>{!commercialUnlocked && <LockKeyhole size={18} className="text-muted" aria-hidden="true" />}</div><fieldset disabled={!commercialUnlocked} className="mt-6 grid gap-5">{form.costItems.map((item) => <div key={item.id} className="grid gap-4 border-t border-line pt-5 first:border-t-0 first:pt-0 sm:grid-cols-3"><Select id={`cost-category-${item.id}`} label="Kategori" required value={item.category} options={costOptions} onChange={(value) => updateCost(item.id, 'category', value as typeof item.category)} /><Input id={`cost-name-${item.id}`} label="Nama biaya" required value={item.name} onChange={(event) => updateCost(item.id, 'name', event.target.value)} /><Input id={`cost-total-${item.id}`} label="Jumlah rencana" type="number" min={0} required value={item.plannedTotalIdr} onChange={(event) => updateCost(item.id, 'plannedTotalIdr', Number(event.target.value))} /></div>)}</fieldset></section>

        <div className="sticky bottom-0 z-10 flex flex-col gap-3 border-t border-line bg-white/95 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between"><Button type="button" onClick={save} disabled={pending !== ''} loading={pending === 'save'}><Save size={16} aria-hidden="true" />{pending === 'save' ? 'Menyimpan…' : 'Simpan perubahan'}</Button><div className="flex flex-col gap-2 sm:flex-row">{canPublish && <Button type="button" variant="outline" disabled={pending !== ''} onClick={() => setConfirmingPublish(true)}><Send size={16} aria-hidden="true" />Terbitkan</Button>}<Button type="button" variant="ghost" className="text-error hover:border-error hover:bg-error/5 hover:!text-error" disabled={!canDelete || pending !== ''} onClick={() => setConfirmingDelete(true)}><Trash2 size={16} aria-hidden="true" />Hapus</Button></div></div>
      </div>
    </div>
    <ConfirmDialog open={confirmingPublish} title="Terbitkan kampanye?" description="Kampanye akan tampil ke pelanggan dan mulai menerima pre-order." confirmLabel="Terbitkan" pending={pending === 'publish'} onCancel={() => setConfirmingPublish(false)} onConfirm={publish} />
    <ConfirmDialog open={confirmingDelete} title="Hapus kampanye draf?" description={`“${campaign.title}” beserta produk, foto, dan rencana biayanya akan dihapus permanen.`} confirmLabel="Hapus kampanye" pending={pending === 'delete'} onCancel={() => setConfirmingDelete(false)} onConfirm={remove} />
  </DashboardLayout>
}
