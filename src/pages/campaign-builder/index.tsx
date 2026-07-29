import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { ArrowLeft, ArrowRight, Check, ImagePlus, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import campaignFallback from '@/assets/textiles/flores-weaver.jpg'
import { createCampaign } from '@/api/campaigns/campaigns'
import { BrandMark } from '@/components/layout/marketing'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/field'
import { RichTextEditor, RichTextView } from '@/components/ui/rich-text'
import { richTextLength } from '@/components/ui/rich-text-value'
import { Select, type SelectOption } from '@/components/ui/select'
import { getApiErrorMessage } from '@/config/api-error'
import { formatRupiah } from '@/config/format'
import { useToast } from '@/hooks/use-toast'
import type { BuilderCostDraft, BuilderDraft, BuilderNumber, BuilderProductDraft, CostCategory, CreateCampaignInput } from '@/types/builder'

const steps = [
  { title: 'Koleksi', purpose: 'Cerita dan konteks' },
  { title: 'Produk', purpose: 'Pilihan, harga, dan foto' },
  { title: 'Produksi', purpose: 'Target, jadwal, dan biaya' },
  { title: 'Tinjau', purpose: 'Pemeriksaan dan persetujuan' },
]

const costCategories: SelectOption[] = [
  { value: 'MATERIAL', label: 'Bahan' },
  { value: 'LABOUR', label: 'Tenaga kerja' },
  { value: 'PACKAGING', label: 'Kemasan' },
  { value: 'TRANSPORT', label: 'Transportasi' },
  { value: 'OTHER', label: 'Lainnya' },
  { value: 'RESERVE', label: 'Cadangan' },
]

const newId = () => crypto.randomUUID()
const newProduct = (): BuilderProductDraft => ({ id: newId(), name: '', productType: '', description: '', priceIdr: '', image: null })
const newCost = (): BuilderCostDraft => ({ id: newId(), category: '', name: '', plannedTotalIdr: '' })
const numericValue = (value: string): BuilderNumber => value === '' ? '' : Number(value)
const numericAmount = (value: BuilderNumber) => value === '' ? 0 : value
const isWholeNumber = (value: BuilderNumber) => value !== '' && Number.isFinite(value) && Number.isInteger(value)
const formatFileSize = (bytes: number) => bytes >= 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1_024))} KB`

const initialDraft: BuilderDraft = {
  collectionName: '',
  story: '',
  motifStory: '',
  productionWeeks: '',
  minimumFundingTargetIdr: '',
  minimumOrderQuantity: '',
  products: [newProduct()],
  costs: [newCost()],
  designImage: null,
  confirmed: false,
}

function Stepper({ active, onSelect, compact = false }: { active: number; onSelect: (step: number) => void; compact?: boolean }) {
  if (compact) {
    return <div>
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-xs font-bold text-white/70">Langkah {active + 1} dari {steps.length}</p>
          <p className="mt-1 text-base font-extrabold text-white">{steps[active].title}</p>
          <p className="mt-0.5 text-xs leading-5 text-white/70">{steps[active].purpose}</p>
        </div>
        <span className="grid h-9 min-w-9 place-items-center rounded-full bg-white text-sm font-extrabold text-primary-dark" aria-hidden="true">{active + 1}</span>
      </div>
      <ol aria-label="Progres pembuatan kampanye" className="mt-3 grid grid-cols-4 gap-2">
        {steps.map((item, index) => <li key={item.title}>
          <button type="button" disabled={index > active} onClick={() => onSelect(index)} aria-current={index === active ? 'step' : undefined} aria-label={`Langkah ${index + 1}: ${item.title} — ${item.purpose}`} className="flex min-h-11 w-full items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-default">
            <span className={`h-1.5 w-full rounded-full ${index <= active ? 'bg-white' : 'bg-white/25'}`} aria-hidden="true" />
          </button>
        </li>)}
      </ol>
    </div>
  }

  return <ol aria-label="Progres pembuatan kampanye" className="grid gap-1">
    {steps.map((item, index) => <li key={item.title}>
      <button type="button" disabled={index > active} onClick={() => onSelect(index)} aria-current={index === active ? 'step' : undefined} className={`flex min-h-14 w-full items-center gap-3 border-l-2 px-3 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-default ${index === active ? 'border-white bg-white/15' : 'border-white/20'}`}>
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-extrabold ${index === active ? 'border-white bg-white text-primary-dark' : index < active ? 'border-primary bg-primary text-primary-dark' : 'border-white/35 bg-transparent text-white/70'}`}>{index < active ? <Check size={14} aria-hidden="true" /> : index + 1}</span>
        <span className="min-w-0">
          <span className={`block text-sm font-extrabold ${index === active ? 'text-white' : 'text-white/70'}`}>{item.title}</span>
          <span className="mt-0.5 block text-xs leading-5 text-white/60">{item.purpose}</span>
        </span>
      </button>
    </li>)}
  </ol>
}

function StepHeading({ eyebrow, title, description, headingRef }: { eyebrow: string; title: string; description: string; headingRef: RefObject<HTMLHeadingElement | null> }) {
  return <div>
    <p className="text-xs font-extrabold uppercase tracking-[.14em] text-primary-dark">{eyebrow}</p>
    <h1 ref={headingRef} tabIndex={-1} className="mt-3 font-display text-3xl leading-[.98] tracking-[-.045em] text-ink outline-none sm:text-4xl">{title}</h1>
    <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">{description}</p>
  </div>
}

function ProductImageField({ product, index, onSelect }: { product: BuilderProductDraft; index: number; onSelect: (file: File | null) => void }) {
  const [imageUrl, setImageUrl] = useState('')

  useEffect(() => {
    if (!product.image) return setImageUrl('')
    const url = URL.createObjectURL(product.image)
    setImageUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [product.image])

  const inputId = `product-image-${product.id}`
  return <div className="grid content-start gap-2">
    <label htmlFor={inputId} className="text-sm font-extrabold tracking-[-.01em] text-ink">Foto produk <span aria-hidden="true" className="text-error">*</span></label>
    <div className="relative aspect-square w-full max-w-[180px] overflow-hidden rounded-2xl border border-line bg-cream">
      <input id={inputId} type="file" accept="image/jpeg,image/png,image/webp" aria-describedby={`${inputId}-hint`} className="peer sr-only" onChange={(event) => { onSelect(event.target.files?.[0] ?? null); event.currentTarget.value = '' }} />
      {imageUrl && <img src={imageUrl} alt={`Pratinjau foto produk ${index + 1}`} className="absolute inset-0 h-full w-full object-cover" />}
      <label htmlFor={inputId} className={`absolute inset-0 flex cursor-pointer items-center justify-center p-4 text-center text-sm font-extrabold transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-[-4px] peer-focus-visible:outline-primary-dark ${imageUrl ? 'items-end bg-gradient-to-t from-ink/75 via-transparent to-transparent text-white opacity-0 hover:opacity-100' : 'border-2 border-dashed border-primary-dark/35 text-primary-dark hover:bg-primary/10'}`}><span className="inline-flex items-center gap-2"><ImagePlus size={18} aria-hidden="true" />{imageUrl ? 'Ganti foto' : 'Pilih foto'}</span></label>
      {imageUrl && <button type="button" onClick={() => onSelect(null)} className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white text-error shadow-sm hover:bg-error/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error" aria-label={`Hapus foto produk ${index + 1}`}><Trash2 size={15} aria-hidden="true" /></button>}
    </div>
    <div id={`${inputId}-hint`} className="max-w-[180px] text-xs leading-5 text-muted"><p>Format: JPG, PNG, atau WebP. Maksimal 10 MB.</p>{product.image && <p className="mt-1 truncate font-bold text-primary-dark" title={product.image.name}>{product.image.name} · {formatFileSize(product.image.size)}</p>}</div>
  </div>
}

export default function CampaignBuilderPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const mainRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const previousStep = useRef(step)
  const [draft, setDraft] = useState<BuilderDraft>(initialDraft)
  const [previewUrl, setPreviewUrl] = useState('')
  const [pending, setPending] = useState(false)
  const plannedCostTotal = useMemo(() => draft.costs.reduce((total, cost) => total + numericAmount(cost.plannedTotalIdr), 0), [draft.costs])

  useEffect(() => {
    if (!draft.designImage) {
      setPreviewUrl('')
      return
    }
    const nextPreviewUrl = URL.createObjectURL(draft.designImage)
    setPreviewUrl(nextPreviewUrl)
    return () => URL.revokeObjectURL(nextPreviewUrl)
  }, [draft.designImage])
  useEffect(() => {
    if (previousStep.current === step) return
    previousStep.current = step
    mainRef.current?.scrollTo({ top: 0 })
    window.scrollTo({ top: 0 })
    headingRef.current?.focus({ preventScroll: true })
  }, [step])

  const update = <K extends keyof BuilderDraft>(key: K, value: BuilderDraft[K]) => setDraft((current) => ({ ...current, [key]: value, ...(key === 'confirmed' ? {} : { confirmed: false }) }))
  const updateProduct = <K extends keyof BuilderProductDraft>(id: string, key: K, value: BuilderProductDraft[K]) => setDraft((current) => ({ ...current, confirmed: false, products: current.products.map((product) => product.id === id ? { ...product, [key]: value } : product) }))
  const updateCost = <K extends keyof BuilderCostDraft>(id: string, key: K, value: BuilderCostDraft[K]) => setDraft((current) => ({ ...current, confirmed: false, costs: current.costs.map((cost) => cost.id === id ? { ...cost, [key]: value } : cost) }))
  const addProduct = () => setDraft((current) => current.products.length >= 50 ? current : ({ ...current, confirmed: false, products: [...current.products, newProduct()] }))
  const removeProduct = (id: string) => setDraft((current) => current.products.length === 1 ? current : ({ ...current, confirmed: false, products: current.products.filter((product) => product.id !== id) }))
  const addCost = () => setDraft((current) => current.costs.length >= 100 ? current : ({ ...current, confirmed: false, costs: [...current.costs, newCost()] }))
  const removeCost = (id: string) => setDraft((current) => current.costs.length === 1 ? current : ({ ...current, confirmed: false, costs: current.costs.filter((cost) => cost.id !== id) }))

  const validImage = (file: File | null) => {
    if (!file) return true
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({ message: 'Gunakan gambar JPG, PNG, atau WebP.', variant: 'error' })
      return false
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ message: 'Pilih gambar di bawah 10 MB.', variant: 'error' })
      return false
    }
    return true
  }

  const selectDesignImage = (file: File | null) => {
    if (validImage(file)) update('designImage', file)
  }

  const selectProductImage = (productId: string, file: File | null) => {
    if (!file || validImage(file)) updateProduct(productId, 'image', file)
  }

  const validate = (throughStep: number) => {
    const collectionName = draft.collectionName.trim()
    const storyLength = richTextLength(draft.story)
    const motifStoryLength = richTextLength(draft.motifStory)
    if (throughStep >= 0 && (collectionName.length < 3 || collectionName.length > 200 || storyLength < 1 || storyLength > 5_000 || motifStoryLength < 1 || motifStoryLength > 5_000)) return 'Masukkan nama koleksi 3–200 karakter serta cerita dan konteks tekstil hingga 5.000 karakter.'
    if (throughStep >= 1 && (draft.products.length < 1 || draft.products.length > 50 || draft.products.some((product) => {
      const name = product.name.trim()
      const type = product.productType.trim()
      const descriptionLength = richTextLength(product.description)
      return name.length < 2 || name.length > 160 || !type || type.length > 80 || descriptionLength < 1 || descriptionLength > 2_000 || !isWholeNumber(product.priceIdr) || numericAmount(product.priceIdr) < 1 || !product.image
    }))) return 'Lengkapi setiap produk: foto, nama 2–160 karakter, jenis, deskripsi, dan harga bulat positif.'
    if (throughStep >= 2 && (!isWholeNumber(draft.productionWeeks) || numericAmount(draft.productionWeeks) < 1 || numericAmount(draft.productionWeeks) > 52 || !isWholeNumber(draft.minimumFundingTargetIdr) || numericAmount(draft.minimumFundingTargetIdr) < 1 || !isWholeNumber(draft.minimumOrderQuantity) || numericAmount(draft.minimumOrderQuantity) < 1 || draft.costs.length < 1 || draft.costs.length > 100 || draft.costs.some((cost) => {
      const name = cost.name.trim()
      return !cost.category || !name || name.length > 160 || !isWholeNumber(cost.plannedTotalIdr) || numericAmount(cost.plannedTotalIdr) < 0
    }))) return 'Lengkapi jadwal, target dana, minimum pesanan, dan setiap rincian biaya dengan bilangan bulat yang valid.'
    return ''
  }

  const next = () => {
    const message = validate(step)
    if (message) return toast({ message, variant: 'error' })
    setStep((current) => Math.min(steps.length - 1, current + 1))
  }

  const submit = async () => {
    if (pending) return
    if (!draft.confirmed) return
    const message = validate(2)
    if (message) return toast({ message, variant: 'error' })
    const input: CreateCampaignInput = {
      title: draft.collectionName.trim(),
      description: draft.story.trim(),
      motifStory: draft.motifStory.trim(),
      productionDurationDays: numericAmount(draft.productionWeeks) * 7,
      minimumFundingTargetIdr: numericAmount(draft.minimumFundingTargetIdr),
      minimumOrderQuantity: numericAmount(draft.minimumOrderQuantity),
      products: draft.products.map((product) => ({ name: product.name.trim(), productType: product.productType.trim(), description: product.description.trim(), priceIdr: numericAmount(product.priceIdr) })),
      costs: draft.costs.map((cost) => ({ category: cost.category as CostCategory, name: cost.name.trim(), plannedTotalIdr: numericAmount(cost.plannedTotalIdr) })),
    }
    setPending(true)
    try {
      const response = await createCampaign(input, { designImage: draft.designImage, productImages: draft.products.map((product) => product.image).filter((image): image is File => image !== null) })
      toast({ message: response.message, variant: 'success' })
      navigate(`/campaigns/${response.data.id}/manage`)
    } catch (caught) {
      toast({ message: getApiErrorMessage(caught, 'Tidak dapat membuat kampanye. Periksa detail lalu coba lagi.'), variant: 'error' })
    } finally {
      setPending(false)
    }
  }

  return <div className="min-h-[100dvh] bg-cream lg:fixed lg:inset-0 lg:grid lg:h-[100dvh] lg:w-full lg:grid-cols-[minmax(300px,.8fr)_minmax(0,1.2fr)] lg:overflow-hidden">
    <aside className="relative overflow-hidden bg-primary-dark px-5 py-6 text-white sm:px-8 lg:flex lg:min-h-0 lg:flex-col lg:overflow-y-auto lg:px-12 lg:py-10" aria-label="Ringkasan kampanye dan progres">
      <div className="absolute -right-24 -top-16 h-72 w-72 rounded-full bg-primary/45 blur-3xl" aria-hidden="true" />
      <div className="relative flex items-center justify-between gap-4">
        <BrandMark inverse />
        <p className="text-xs font-extrabold text-white/70">{step + 1}/{steps.length}</p>
      </div>
      <div className="relative mt-7 hidden lg:block">
        <p className="text-xs font-bold text-white/70">Studio kampanye</p>
        <p className="mt-3 max-w-sm text-3xl font-medium leading-[.94] tracking-[-.055em]">Ubah cerita koleksi menjadi rencana produksi.</p>
      </div>
      <figure className="relative mt-6 aspect-[16/7] overflow-hidden rounded-xl border border-white/15 bg-white/5 sm:aspect-[2/1] lg:aspect-[4/3]">
        <img src={previewUrl || campaignFallback} alt={draft.designImage ? `Pratinjau foto utama ${draft.collectionName || 'kampanye'}` : ''} aria-hidden={!draft.designImage} className="h-full w-full object-cover" />
        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-4 pb-4 pt-12 text-white">
          <span className="block text-[11px] font-bold uppercase tracking-[.12em] text-white/70">{draft.designImage ? 'Foto utama kampanye' : 'Pratinjau kampanye'}</span>
          <span className="mt-1 block truncate text-base font-extrabold">{draft.collectionName.trim() || 'Koleksi belum diberi nama'}</span>
        </figcaption>
      </figure>
      <dl className="mt-5 hidden divide-y divide-white/15 border-y border-white/15 text-xs lg:block">
        <div className="flex items-center justify-between gap-4 py-2.5"><dt className="text-white/65">Produk</dt><dd className="font-extrabold text-white">{draft.products.length}</dd></div>
        <div className="flex items-center justify-between gap-4 py-2.5"><dt className="text-white/65">Target minimum</dt><dd className="max-w-[10rem] truncate font-extrabold text-white">{numericAmount(draft.minimumFundingTargetIdr) > 0 ? formatRupiah(numericAmount(draft.minimumFundingTargetIdr)) : 'Belum diisi'}</dd></div>
        <div className="flex items-center justify-between gap-4 py-2.5"><dt className="text-white/65">Waktu produksi</dt><dd className="font-extrabold text-white">{isWholeNumber(draft.productionWeeks) ? `${numericAmount(draft.productionWeeks)} minggu` : 'Belum diisi'}</dd></div>
      </dl>
      <div className="relative mt-6 hidden lg:block"><Stepper active={step} onSelect={setStep} /></div>
      <div className="relative mt-6 lg:hidden"><Stepper active={step} onSelect={setStep} compact /></div>
    </aside>
    <main ref={mainRef} id="main-content" className="min-w-0 bg-white lg:h-full lg:overflow-y-auto lg:overscroll-contain">
      <div className="mx-auto w-full max-w-3xl px-5 py-7 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
        <section aria-label={`Langkah ${step + 1}: ${steps[step].title}`}>
          {step === 0 && <div>
            <StepHeading headingRef={headingRef} eyebrow="Cerita dan konteks" title="Ceritakan koleksi" description="Jelaskan koleksi dan konteks tekstil yang perlu diketahui pelanggan." />
            <div className="mt-7 grid gap-5">
              <Input id="collection-name" label="Nama koleksi" required maxLength={200} value={draft.collectionName} onChange={(event) => update('collectionName', event.target.value)} />
              <RichTextEditor id="collection-story" label="Cerita kampanye" required maxLength={5_000} value={draft.story} onChange={(value) => update('story', value)} />
              <RichTextEditor id="motif-story" label="Konteks motif dan budaya" required maxLength={5_000} value={draft.motifStory} onChange={(value) => update('motifStory', value)} />
            </div>
          </div>}

          {step === 1 && <div>
            <StepHeading headingRef={headingRef} eyebrow="Pilihan, harga, dan foto" title="Tambahkan produk dan harga" description="Susun setiap pilihan produk secara terpisah agar informasi dan harganya mudah diperiksa." />
            <div className="mt-7 grid gap-6">
              {draft.products.map((product, index) => <fieldset key={product.id} className="rounded-2xl border border-line p-4 sm:p-6">
                <legend className="sr-only">Produk {index + 1}</legend>
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div><p className="text-base font-extrabold text-ink">Produk {index + 1}</p><p className="mt-1 text-xs text-muted">Informasi ini tampil sebagai kartu produk di halaman kampanye.</p></div>
                  <button type="button" onClick={() => removeProduct(product.id)} disabled={draft.products.length === 1} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line text-error transition hover:border-error hover:bg-error/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error disabled:cursor-not-allowed disabled:opacity-40" aria-label={`Hapus produk ${index + 1}`}><Trash2 size={17} aria-hidden="true" /></button>
                </div>
                <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_180px]">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input id={`product-name-${product.id}`} label="Nama produk" required maxLength={160} value={product.name} onChange={(event) => updateProduct(product.id, 'name', event.target.value)} />
                    <Input id={`product-type-${product.id}`} label="Jenis produk" required maxLength={80} value={product.productType} onChange={(event) => updateProduct(product.id, 'productType', event.target.value)} />
                    <div className="sm:col-span-2"><Input id={`product-price-${product.id}`} label="Harga jual" hint="Masukkan harga satu produk dalam rupiah." type="number" min={1} step={1} required value={product.priceIdr} onChange={(event) => updateProduct(product.id, 'priceIdr', numericValue(event.target.value))} /></div>
                  </div>
                  <ProductImageField product={product} index={index} onSelect={(file) => selectProductImage(product.id, file)} />
                </div>
                <RichTextEditor id={`product-description-${product.id}`} label="Deskripsi dan batas kustomisasi" required maxLength={2_000} value={product.description} onChange={(value) => updateProduct(product.id, 'description', value)} className="mt-7" />
              </fieldset>)}

              <Button type="button" variant="outline" onClick={addProduct} disabled={draft.products.length >= 50} className="justify-self-start"><Plus size={16} aria-hidden="true" />Tambah produk</Button>

              <div className="rounded-2xl border border-line p-4 sm:p-6">
                <div><p className="text-base font-extrabold text-ink">Foto utama kampanye</p><p className="mt-1 text-xs leading-5 text-muted">Foto ini menjadi sampul kampanye di halaman koleksi.</p></div>
                <div className="mt-5 grid items-start gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
                  <div className="relative aspect-square w-full max-w-[180px] overflow-hidden rounded-2xl border border-line bg-cream">
                    <input id="design-image" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="design-image-hint" className="peer sr-only" onChange={(event) => { selectDesignImage(event.target.files?.[0] ?? null); event.currentTarget.value = '' }} />
                    <img src={previewUrl || campaignFallback} alt={draft.designImage ? `Pratinjau foto utama ${draft.collectionName || 'kampanye'}` : ''} aria-hidden={!draft.designImage} className="absolute inset-0 h-full w-full object-cover" />
                    <label htmlFor="design-image" className={`absolute inset-0 flex cursor-pointer items-center justify-center p-4 text-center text-sm font-extrabold transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-[-4px] peer-focus-visible:outline-primary-dark ${draft.designImage ? 'items-end bg-gradient-to-t from-ink/75 via-transparent to-transparent text-white opacity-0 hover:opacity-100' : 'bg-white/75 text-primary-dark hover:bg-white/90'}`}><span className="inline-flex items-center gap-2"><ImagePlus size={18} aria-hidden="true" />{draft.designImage ? 'Ganti foto' : 'Pilih foto'}</span></label>
                    {draft.designImage && <button type="button" onClick={() => update('designImage', null)} className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white text-error shadow-sm hover:bg-error/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error" aria-label="Hapus foto utama kampanye"><Trash2 size={15} aria-hidden="true" /></button>}
                  </div>
                  <div className="min-w-0"><p id="design-image-hint" className="text-xs leading-5 text-muted">JPG, PNG, atau WebP. Maksimum 10 MB.</p><p className="mt-2 truncate text-xs font-bold text-primary-dark">{draft.designImage ? `${draft.designImage.name} · ${formatFileSize(draft.designImage.size)}` : 'Belum ada foto utama yang dipilih.'}</p></div>
                </div>
              </div>
            </div>
          </div>}

          {step === 2 && <div>
            <StepHeading headingRef={headingRef} eyebrow="Target, jadwal, dan biaya" title="Tetapkan rencana produksi" description="Masukkan durasi, target minimum, dan rincian biaya yang menjadi dasar pelaksanaan kampanye." />
            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <Input id="production-weeks" label="Waktu produksi (minggu)" type="number" min={1} max={52} step={1} required value={draft.productionWeeks} onChange={(event) => update('productionWeeks', numericValue(event.target.value))} />
              <Input id="minimum-orders" label="Minimum jumlah pesanan" type="number" min={1} step={1} required value={draft.minimumOrderQuantity} onChange={(event) => update('minimumOrderQuantity', numericValue(event.target.value))} />
              <div className="md:col-span-2"><Input id="funding-target" label="Target minimum pendanaan" type="number" min={1} step={1} required value={draft.minimumFundingTargetIdr} onChange={(event) => update('minimumFundingTargetIdr', numericValue(event.target.value))} /></div>
            </div>

            <div className="mt-8 border-t border-line pt-7">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                <div><h2 className="text-xl font-extrabold tracking-[-.04em] text-ink">Rincian biaya</h2><p className="mt-1 text-xs leading-5 text-muted">Pisahkan setiap kebutuhan agar rencana mudah ditinjau.</p></div>
                <p className="text-sm text-muted">Total <strong className="text-ink">{formatRupiah(plannedCostTotal)}</strong></p>
              </div>
              <div className="mt-5 grid gap-6">
                {draft.costs.map((cost, index) => <fieldset key={cost.id} className="border-t border-line pt-6 first:border-t-0 first:pt-0">
                  <legend className="sr-only">Biaya {index + 1}</legend>
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <p className="text-sm font-extrabold text-ink">Biaya {index + 1}</p>
                    <button type="button" onClick={() => removeCost(cost.id)} disabled={draft.costs.length === 1} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line text-error transition hover:border-error hover:bg-error/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error disabled:cursor-not-allowed disabled:opacity-40" aria-label={`Hapus biaya ${index + 1}`}><Trash2 size={17} aria-hidden="true" /></button>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2">
                    <Select id={`cost-category-${cost.id}`} label="Kategori" required value={cost.category} options={costCategories} placeholder="Pilih kategori" onChange={(value) => updateCost(cost.id, 'category', value as CostCategory | '')} />
                    <Input id={`cost-name-${cost.id}`} label="Nama biaya" required maxLength={160} value={cost.name} onChange={(event) => updateCost(cost.id, 'name', event.target.value)} />
                    <div className="md:col-span-2"><Input id={`cost-total-${cost.id}`} label="Jumlah rencana" type="number" min={0} step={1} required value={cost.plannedTotalIdr} onChange={(event) => updateCost(cost.id, 'plannedTotalIdr', numericValue(event.target.value))} /></div>
                  </div>
                </fieldset>)}
                <Button type="button" variant="outline" onClick={addCost} disabled={draft.costs.length >= 100} className="justify-self-start"><Plus size={16} aria-hidden="true" />Tambah rincian biaya</Button>
              </div>
            </div>
          </div>}

          {step === 3 && <div>
            <StepHeading headingRef={headingRef} eyebrow="Pemeriksaan dan persetujuan" title="Tinjau sebelum menyimpan" description="Periksa kembali keputusan utama kampanye. Anda masih dapat mengubah judul dan foto sebelum menerbitkannya." />
            <div className="mt-7 grid gap-6">
              <div>
                <p className="text-xs font-extrabold text-muted">Koleksi</p>
                <p className="mt-2 text-xl font-extrabold text-ink">{draft.collectionName}</p>
                <RichTextView value={draft.story} className="mt-2 text-sm leading-6" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-muted">Produk</p>
                <dl className="mt-2 divide-y divide-line border-y border-line text-sm">
                  {draft.products.map((product) => <div key={product.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <dt><span className="block font-extrabold text-ink">{product.name}</span><span className="mt-0.5 block text-xs text-muted">{product.productType}</span></dt>
                    <dd className="font-extrabold text-ink sm:shrink-0 sm:text-right">{formatRupiah(numericAmount(product.priceIdr))}</dd>
                  </div>)}
                </dl>
              </div>
              <dl className="divide-y divide-line border-y border-line text-sm">
                <div className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:gap-4"><dt className="text-muted">Target minimum pendanaan</dt><dd className="font-extrabold text-ink sm:text-right">{formatRupiah(numericAmount(draft.minimumFundingTargetIdr))}</dd></div>
                <div className="flex justify-between gap-4 py-3"><dt className="text-muted">Minimum pesanan</dt><dd className="font-extrabold text-ink">{numericAmount(draft.minimumOrderQuantity)} unit</dd></div>
                <div className="flex justify-between gap-4 py-3"><dt className="text-muted">Waktu produksi</dt><dd className="font-extrabold text-ink">{numericAmount(draft.productionWeeks)} minggu</dd></div>
                <div className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:gap-4"><dt className="text-muted">Biaya direncanakan</dt><dd className="font-extrabold text-ink sm:text-right">{formatRupiah(plannedCostTotal)}</dd></div>
              </dl>
              <label className="flex cursor-pointer gap-3 border-y border-line py-4">
                <input type="checkbox" checked={draft.confirmed} onChange={(event) => update('confirmed', event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark" />
                <span><span className="flex items-center gap-2 text-sm font-extrabold text-ink"><ShieldCheck size={17} aria-hidden="true" />Data sudah diperiksa</span><span className="mt-1 block text-xs leading-5 text-muted">Saya memastikan produk, harga, target, jadwal, dan biaya sesuai keputusan kelompok.</span></span>
              </label>
            </div>
          </div>}

          <div className={`mt-8 flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center ${step === 0 ? 'sm:justify-end' : 'sm:justify-between'}`}>
            {step > 0 && <Button type="button" variant="ghost" onClick={() => setStep((current) => Math.max(0, current - 1))} className="w-full sm:w-auto"><ArrowLeft size={15} aria-hidden="true" />Kembali</Button>}
            {step < 3 ? <Button type="button" onClick={next} className="w-full sm:w-auto">Berikutnya <ArrowRight size={15} aria-hidden="true" /></Button> : <Button type="button" onClick={submit} disabled={!draft.confirmed || pending} loading={pending} className="w-full sm:w-auto">{pending ? 'Menyimpan…' : 'Simpan draf'} <ArrowRight size={15} aria-hidden="true" /></Button>}
          </div>
        </section>
      </div>
    </main>
  </div>
}
