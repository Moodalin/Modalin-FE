import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Minus, Plus } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { createPreorder } from '@/api/orders/orders'
import { TextileImage } from '@/components/campaign/textile-image'
import { BrandMark } from '@/components/layout/marketing'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/field'
import { PageLoading } from '@/components/ui/page-loading'
import { Select, type SelectOption } from '@/components/ui/select'
import { getApiErrorMessage } from '@/config/api-error'
import { formatRupiah } from '@/config/format'
import { useCampaign } from '@/hooks/campaign/use-campaign'
import { useToast } from '@/hooks/use-toast'

type CartItem = { productId: string; variantId: string; quantity: number; notes: string }
type FieldId = 'customer-name' | 'customer-phone' | 'customer-email' | 'shipping-province' | 'shipping-city' | 'shipping-district' | 'shipping-postal-code' | 'shipping-address-detail' | 'preorder-consent'


const provinces = ['Aceh', 'Bali', 'Banten', 'Bengkulu', 'DI Yogyakarta', 'DKI Jakarta', 'Gorontalo', 'Jambi', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'Kalimantan Barat', 'Kalimantan Selatan', 'Kalimantan Tengah', 'Kalimantan Timur', 'Kalimantan Utara', 'Kepulauan Bangka Belitung', 'Kepulauan Riau', 'Lampung', 'Maluku', 'Maluku Utara', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur', 'Papua', 'Papua Barat', 'Papua Barat Daya', 'Papua Pegunungan', 'Papua Selatan', 'Papua Tengah', 'Riau', 'Sulawesi Barat', 'Sulawesi Selatan', 'Sulawesi Tengah', 'Sulawesi Tenggara', 'Sulawesi Utara', 'Sumatera Barat', 'Sumatera Selatan', 'Sumatera Utara']
const provinceOptions: SelectOption[] = provinces.map((province) => ({ value: province, label: province }))

export default function CheckoutPage() {
  const [params] = useSearchParams()
  const campaignId = params.get('campaign') || 'seed-modalin-eastern-sky-weave'
  const requestedProductId = params.get('product') || ''
  const { campaign, loading, error: campaignError, retry: retryCampaign } = useCampaign(campaignId)
  const navigate = useNavigate()
  const { toast } = useToast()
  const [items, setItems] = useState<CartItem[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [addressDetail, setAddressDetail] = useState('')
  const [consent, setConsent] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldId, string>>>({})
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const submissionInFlight = useRef(false)
  const cartDetails = useMemo(() => {
    if (!campaign) return []
    return items.flatMap((item, index) => {
      const product = campaign.products.find((candidate) => candidate.id === item.productId)
      if (!product) return []
      return [{ index, item, product, variant: product.variants.find((candidate) => candidate.id === item.variantId) }]
    })
  }, [campaign, items])
  const subtotal = cartDetails.reduce((sum, { item, product, variant }) => sum + (product.price + (variant?.additionalPrice || 0)) * item.quantity, 0)
  const serviceFee = 0
  const total = subtotal + serviceFee

  useEffect(() => {
    if (!campaign || items.length > 0) return
    const initialProduct = campaign.products.find((item) => item.id === requestedProductId) || campaign.products[0]
    if (initialProduct) setItems([{ productId: initialProduct.id, variantId: initialProduct.variants[0]?.id ?? '', quantity: 1, notes: '' }])
  }, [campaign, items.length, requestedProductId])


  const clearFieldError = (field: FieldId) => setFieldErrors((current) => (current[field] ? { ...current, [field]: undefined } : current))

  const updateItem = (index: number, update: Partial<CartItem>) => {
    setItems((current) => current.map((item, itemIndex) => {
      if (itemIndex !== index) return item
      if (update.productId && update.productId !== item.productId) {
        const nextProduct = campaign?.products.find((product) => product.id === update.productId)
        return { ...item, productId: update.productId, variantId: nextProduct?.variants[0]?.id ?? '' }
      }
      return { ...item, ...update }
    }))
  }

  const addItem = () => {
    const product = campaign?.products[0]
    if (!product || items.length >= 20) return
    setItems((current) => [...current, { productId: product.id, variantId: product.variants[0]?.id ?? '', quantity: 1, notes: '' }])
  }

  const validate = () => {
    const next: Partial<Record<FieldId, string>> = {}
    if (name.trim().length < 3) next['customer-name'] = 'Tulis nama penerima minimal 3 huruf.'
    if (phone.replace(/\D/g, '').length < 8) next['customer-phone'] = 'Nomor telepon minimal 8 angka.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next['customer-email'] = 'Format email belum benar.'
    if (!province) next['shipping-province'] = 'Pilih provinsi tujuan.'
    if (!city.trim()) next['shipping-city'] = 'Isi kota atau kabupaten.'
    if (!district.trim()) next['shipping-district'] = 'Isi kecamatan.'
    if (!/^\d{5}$/.test(postalCode.trim())) next['shipping-postal-code'] = 'Kode pos terdiri dari 5 angka.'
    if (addressDetail.trim().length < 10) next['shipping-address-detail'] = 'Alamat minimal 10 karakter agar kurir dapat menemukannya.'
    if (!consent) next['preorder-consent'] = 'Centang untuk melanjutkan.'
    return next
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submissionInFlight.current) return
    setError('')
    const nextErrors = validate()
    setFieldErrors(nextErrors)
    const firstInvalid = Object.keys(nextErrors)[0]
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus()
      return
    }
    if (!campaign || cartDetails.length === 0 || cartDetails.length !== items.length) return setError('Tambahkan setidaknya satu produk yang tersedia.')

    const shippingAddress = [
      addressDetail.trim(),
      `Kecamatan: ${district.trim()}`,
      `Kota/Kabupaten: ${city.trim()}`,
      `Provinsi: ${province}`,
      `Kode pos: ${postalCode.trim()}`,
    ].join('\n')

    submissionInFlight.current = true
    setPending(true)
    try {
      const response = await createPreorder(campaign.id, {
        items: cartDetails.map(({ item, product, variant }) => ({ productId: product.id, variantId: variant?.id || undefined, quantity: item.quantity, notes: item.notes })),
        customerName: name,
        email,
        phone,
        address: shippingAddress,
      })
      if (response.data.redirectUrl) {
        window.location.assign(response.data.redirectUrl)
        return
      }
      toast({ message: response.data.paymentRequiresReview ? 'Pesanan tersimpan. Status pembayaran sedang diperiksa.' : 'Pesanan tersimpan. Lanjutkan pembayaran dari riwayat pesanan.', variant: 'success' })
      navigate('/orders', { replace: true })
    } catch (caught) {
      const message = getApiErrorMessage(caught, 'Tidak dapat membuat pesanan. Periksa detail lalu coba lagi.')
      setError(message)
      toast({ message, variant: 'error' })
      submissionInFlight.current = false
      setPending(false)
    }
  }

  if (loading) return <PageLoading />
  if (campaignError || !campaign) return <main id="main-content" className="grid min-h-screen place-items-center bg-cream px-5"><div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 text-center"><h1 className="font-display text-2xl font-extrabold tracking-[-.04em] text-ink">Kampanye tidak dapat dimuat</h1><p role="alert" className="mt-3 text-sm leading-6 text-muted">Periksa koneksi Anda, lalu coba lagi.</p><div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center"><Button type="button" onClick={retryCampaign}>Coba lagi</Button><Button type="button" variant="outline" onClick={() => navigate('/')}>Kembali ke beranda</Button></div></div></main>

  if (!campaign.acceptsOrders) return <main id="main-content" className="grid min-h-screen place-items-center bg-cream px-5"><div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 text-center"><h1 className="font-display text-3xl font-extrabold tracking-[-.04em] text-ink">Pre-order sudah ditutup</h1><p className="mt-3 text-sm leading-6 text-muted">Kampanye ini tidak lagi menerima pesanan baru.</p><Button type="button" variant="outline" className="mt-6" onClick={() => navigate(`/campaigns/${campaign.id}`)}>Kembali ke kampanye</Button></div></main>

  const productOptions: SelectOption[] = campaign.products.map((candidate) => ({ value: candidate.id, label: candidate.name, description: formatRupiah(candidate.price) }))

  return <div className="min-h-screen bg-white">
    <header className="border-b border-line bg-white"><div className="mx-auto flex h-[72px] max-w-[1280px] items-center px-5 lg:px-8"><BrandMark /></div></header>
    <main id="main-content" className="mx-auto max-w-[1280px] px-5 py-8 lg:px-8 lg:py-12">
      <div className="mb-8 lg:mb-10">
        <Link to={`/campaigns/${campaign.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-1 text-sm font-extrabold text-primary-dark hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary-dark"><ArrowLeft size={16} aria-hidden="true" />Kembali ke kampanye</Link>
        <h1 tabIndex={-1} className="mt-5 max-w-2xl font-display text-4xl leading-[.95] tracking-[-.05em] text-ink outline-none sm:text-5xl">Lengkapi pesanan Anda.</h1>
        <p className="mt-4 text-sm leading-7 text-muted">{campaign.title} · {campaign.artisanGroup}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,.78fr)] lg:items-start">
        <form id="checkout-form" noValidate onSubmit={submit} aria-busy={pending} className="min-w-0 rounded-2xl border border-line bg-white p-5 shadow-[0_16px_38px_rgba(29,37,34,.05)] sm:p-7 lg:p-8">
          <fieldset disabled={pending} className="min-w-0 border-b border-line pb-8">
            <legend className="text-xl font-extrabold tracking-[-.03em] text-ink">Produk pesanan</legend>
            <p className="mt-2 text-sm leading-6 text-muted">Gabungkan beberapa produk dalam satu pembayaran.</p>

            <div className="mt-6 grid gap-5">
              {cartDetails.map(({ index, item, product, variant }) => {
                const unitPrice = product.price + (variant?.additionalPrice || 0)
                const variantOptions: SelectOption[] = product.variants.length === 0
                  ? [{ value: '', label: 'Tanpa varian' }]
                  : product.variants.map((candidate) => ({ value: candidate.id, label: candidate.label, description: candidate.additionalPrice ? `+${formatRupiah(candidate.additionalPrice)}` : undefined }))
                return <section key={`${product.id}-${index}`} aria-labelledby={`item-title-${index}`} className="min-w-0 rounded-2xl border border-line bg-cream/40 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <TextileImage imageUrl={product.imageUrl} imageAlt="" className="size-14 shrink-0 rounded-lg" />
                      <div className="min-w-0">
                        <p id={`item-title-${index}`} className="truncate text-sm font-extrabold text-ink">{product.name}</p>
                        <p className="mt-1 text-xs font-semibold text-muted">{formatRupiah(unitPrice)} / buah</p>
                      </div>
                    </div>
                    {items.length > 1 && <Button type="button" variant="ghost" className="min-h-11 shrink-0 px-3 text-xs" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Hapus ${product.name} dari pesanan`}>Hapus</Button>}
                  </div>

                  <div className="mt-5 grid min-w-0 gap-4 lg:grid-cols-2">
                    <Select id={`product-${index}`} label="Produk" value={item.productId} options={productOptions} onChange={(value) => updateItem(index, { productId: value })} />
                    <Select id={`variant-${index}`} label="Varian" value={item.variantId} options={variantOptions} disabled={product.variants.length === 0} onChange={(value) => updateItem(index, { variantId: value })} />
                  </div>

                  <div className="mt-4 flex flex-col gap-3 rounded-xl border border-line bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                    <span id={`quantity-label-${index}`} className="text-sm font-extrabold text-ink">Jumlah</span>
                    <div role="group" aria-labelledby={`quantity-label-${index}`} className="flex items-center justify-between gap-3 sm:justify-end">
                      <Button type="button" variant="outline" className="size-11 min-h-11 shrink-0 rounded-lg p-0" disabled={item.quantity === 1} onClick={() => updateItem(index, { quantity: Math.max(1, item.quantity - 1) })} aria-label={`Kurangi jumlah ${product.name}`}><Minus size={16} aria-hidden="true" /></Button>
                      <span className="min-w-8 text-center text-sm font-extrabold text-ink" aria-live="polite">{item.quantity}</span>
                      <Button type="button" variant="outline" className="size-11 min-h-11 shrink-0 rounded-lg p-0" disabled={item.quantity === 100} onClick={() => updateItem(index, { quantity: Math.min(100, item.quantity + 1) })} aria-label={`Tambah jumlah ${product.name}`}><Plus size={16} aria-hidden="true" /></Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Textarea id={`notes-${index}`} label="Catatan untuk pengrajin (opsional)" className="min-h-24" value={item.notes} onChange={(event) => updateItem(index, { notes: event.target.value })} />
                  </div>
                </section>
              })}
            </div>

            <Button type="button" variant="outline" className="mt-5 w-full sm:w-auto" onClick={addItem} disabled={items.length >= 20}><Plus size={16} aria-hidden="true" />Tambah produk</Button>
          </fieldset>

          <fieldset disabled={pending} className="min-w-0 border-b border-line py-8">
            <legend className="text-xl font-extrabold tracking-[-.03em] text-ink">Kontak penerima</legend>
            <p className="mt-2 text-sm leading-6 text-muted">Status pesanan dan tautan pembayaran dikirim ke email ini.</p>
            <div className="mt-6 grid gap-5">
              <Input id="customer-name" label="Nama penerima" autoComplete="shipping name" required value={name} error={fieldErrors['customer-name']} onChange={(event) => { setName(event.target.value); clearFieldError('customer-name') }} />
              <div className="grid gap-5 lg:grid-cols-2">
                <Input id="customer-phone" label="Nomor telepon" type="tel" inputMode="tel" autoComplete="shipping tel" required value={phone} error={fieldErrors['customer-phone']} onChange={(event) => { setPhone(event.target.value); clearFieldError('customer-phone') }} />
                <Input id="customer-email" label="Email" type="email" inputMode="email" autoComplete="shipping email" required value={email} error={fieldErrors['customer-email']} onChange={(event) => { setEmail(event.target.value); clearFieldError('customer-email') }} />
              </div>
            </div>
          </fieldset>

          <fieldset disabled={pending} className="min-w-0 border-b border-line py-8">
            <legend className="text-xl font-extrabold tracking-[-.03em] text-ink">Alamat pengiriman</legend>
            <p className="mt-2 text-sm leading-6 text-muted">Pesanan dikirim setelah produksi selesai.</p>
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <Select id="shipping-province" label="Provinsi" required value={province} options={provinceOptions} placeholder="Pilih provinsi" error={fieldErrors['shipping-province']} onChange={(value) => { setProvince(value); clearFieldError('shipping-province') }} />
              <Input id="shipping-city" label="Kota/Kabupaten" autoComplete="shipping address-level2" required value={city} error={fieldErrors['shipping-city']} onChange={(event) => { setCity(event.target.value); clearFieldError('shipping-city') }} />
              <Input id="shipping-district" label="Kecamatan" autoComplete="shipping address-level3" required value={district} error={fieldErrors['shipping-district']} onChange={(event) => { setDistrict(event.target.value); clearFieldError('shipping-district') }} />
              <Input id="shipping-postal-code" label="Kode pos" inputMode="numeric" autoComplete="shipping postal-code" maxLength={5} required value={postalCode} error={fieldErrors['shipping-postal-code']} onChange={(event) => { setPostalCode(event.target.value); clearFieldError('shipping-postal-code') }} />
              <div className="lg:col-span-2"><Textarea id="shipping-address-detail" label="Alamat lengkap" hint="Nama jalan, nomor rumah, RT/RW, dan patokan bila perlu." autoComplete="shipping street-address" required className="min-h-28" value={addressDetail} error={fieldErrors['shipping-address-detail']} onChange={(event) => { setAddressDetail(event.target.value); clearFieldError('shipping-address-detail') }} /></div>
            </div>
          </fieldset>

          <fieldset disabled={pending} className="min-w-0 pt-8">
            <legend className="text-xl font-extrabold tracking-[-.03em] text-ink">Pembayaran</legend>
            <p className="mt-2 text-sm leading-6 text-muted">Metode pembayaran dipilih di halaman penyedia pembayaran setelah Anda menekan Bayar.</p>
            <div className="mt-6 rounded-xl border border-line bg-cream/40 p-4">
              <div className="flex gap-3">
                <input id="preorder-consent" type="checkbox" required checked={consent} aria-invalid={Boolean(fieldErrors['preorder-consent'])} aria-describedby={fieldErrors['preorder-consent'] ? 'preorder-consent-error' : undefined} onChange={(event) => { setConsent(event.target.checked); clearFieldError('preorder-consent') }} className="mt-0.5 size-5 shrink-0 accent-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark" />
                <label htmlFor="preorder-consent" className="text-sm leading-6 text-ink">Saya mengerti ini pesanan pra-produksi: produksi baru dimulai setelah target minimum kampanye tercapai. Jika target tidak tercapai sampai batas waktu, pembayaran dikembalikan sesuai ketentuan kampanye.<span aria-hidden="true" className="text-error"> *</span></label>
              </div>
              {fieldErrors['preorder-consent'] && <p id="preorder-consent-error" role="alert" className="mt-2 text-xs font-bold text-error">{fieldErrors['preorder-consent']}</p>}
            </div>
            {error && <p id="checkout-error" role="alert" aria-live="assertive" className="mt-5 rounded-xl border border-error/25 bg-error/5 p-4 text-sm font-semibold text-error">{error}</p>}
          </fieldset>
        </form>

        <aside aria-labelledby="summary-heading" className="h-fit rounded-2xl bg-primary-dark p-6 text-white shadow-[0_16px_38px_rgba(8,116,95,.2)] sm:p-8 lg:sticky lg:top-8">
          <h2 id="summary-heading" className="text-lg font-extrabold tracking-[-.02em]">Ringkasan pesanan</h2>
          <ul className="mt-5 divide-y divide-white/20 border-y border-white/20">
            {cartDetails.map(({ index, item, product, variant }) => {
              const unitPrice = product.price + (variant?.additionalPrice || 0)
              return <li key={`${product.id}-summary-${index}`} className="flex gap-3 py-4">
                <TextileImage imageUrl={product.imageUrl} imageAlt="" className="size-12 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold">{product.name}</p>
                  <p className="mt-1 text-xs text-white/80">{variant?.label || 'Tanpa varian'}</p>
                  <p className="mt-1 text-xs text-white/80">{item.quantity} × {formatRupiah(unitPrice)}</p>
                </div>
                <p className="shrink-0 text-right text-sm font-bold">{formatRupiah(unitPrice * item.quantity)}</p>
              </li>
            })}
          </ul>
          <dl className="mt-5 grid gap-2 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-white/85">Subtotal</dt>
              <dd className="font-bold">{formatRupiah(subtotal)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-white/85">Biaya layanan</dt>
              <dd className="font-bold">{formatRupiah(serviceFee)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-white/20 pt-3">
              <dt className="font-bold">Total</dt>
              <dd className="text-lg font-extrabold">{formatRupiah(total)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs leading-5 text-white/80">Biaya pengiriman dikonfirmasi terpisah sebelum produk dikirim.</p>
          <Button type="submit" form="checkout-form" variant="secondary" className="mt-6 min-h-12 w-full" disabled={pending || cartDetails.length === 0} loading={pending}>{pending ? 'Menyiapkan pembayaran…' : `Bayar ${formatRupiah(total)}`}</Button>
        </aside>
      </div>
    </main>
  </div>
}
