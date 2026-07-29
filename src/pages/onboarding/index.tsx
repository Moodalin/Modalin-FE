import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, BookOpenText, Check, MapPin, ShoppingBag, Store, UsersRound } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { completeArtisanOnboarding, getProfile } from '@/api/profile/profile'
import type { ArtisanOnboardingInput } from '@/api/profile/profile'
import { BrandMark } from '@/components/layout/marketing'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/field'
import { RichTextEditor } from '@/components/ui/rich-text'
import { richTextLength } from '@/components/ui/rich-text-value'
import { PageLoading } from '@/components/ui/page-loading'
import { getApiErrorMessage } from '@/config/api-error'
import { useToast } from '@/hooks/use-toast'

const initialForm = {
  name: '',
  location: '',
  description: '',
  communityStory: '',
  memberCount: '1',
  phone: '',
  email: '',
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { toast } = useToast()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState<Partial<Record<keyof typeof initialForm, string>>>({})
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [pending, setPending] = useState(false)
  const [accountType, setAccountType] = useState<'customer' | 'creator' | null>(null)
  const creatorMode = params.get('mode') === 'creator'
  const returnTo = params.get('returnTo') || '/campaigns/new'

  const steps = [
    { label: 'Kelompok', title: 'Kenalkan kelompok Anda.', description: 'Mulai dari identitas dasar yang akan muncul pada profil kampanye.', icon: UsersRound },
    { label: 'Profil', title: 'Ceritakan karya Anda.', description: 'Berikan gambaran singkat tentang keahlian dan proses yang dijalankan kelompok.', icon: MapPin },
    { label: 'Cerita', title: 'Bagikan cerita komunitas.', description: 'Cerita ini membantu pelanggan memahami makna di balik setiap karya.', icon: BookOpenText },
    { label: 'Kontak', title: 'Selesaikan profil.', description: 'Pastikan jumlah anggota benar. Kontak bersifat opsional dan dapat dilengkapi nanti.', icon: Check },
  ]

  useEffect(() => {
    let current = true
    setLoading(true)
    setProfileError(false)
    getProfile()
      .then((profile) => {
        if (!current) return
        if (profile.role === 'ADMIN' || (profile.role === 'ARTISAN' && profile.onboardingStatus === 'COMPLETED')) {
          navigate(returnTo, { replace: true })
          return
        }
        const group = profile.artisanGroup
        setForm({
          name: group?.name ?? '',
          location: group?.location ?? '',
          description: group?.description ?? '',
          communityStory: group?.communityStory ?? '',
          memberCount: String(group?.memberCount ?? 1),
          phone: group?.phone ?? profile.phone ?? '',
          email: group?.email ?? '',
        })
      })
      .catch(() => { if (current) setProfileError(true) })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [navigate, retry, returnTo])

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const fieldErrors = (fields: Array<keyof typeof form>) => {
    const next: Partial<Record<keyof typeof initialForm, string>> = {}
    if (fields.includes('name')) { const length = form.name.trim().length; if (length < 2 || length > 160) next.name = 'Masukkan 2–160 karakter.' }
    if (fields.includes('location')) { const length = form.location.trim().length; if (length < 2 || length > 160) next.location = 'Masukkan 2–160 karakter.' }
    if (fields.includes('description')) { const length = richTextLength(form.description); if (length < 10 || length > 2_000) next.description = 'Masukkan 10–2.000 karakter.' }
    if (fields.includes('communityStory')) { const length = richTextLength(form.communityStory); if (length < 10 || length > 2_000) next.communityStory = 'Masukkan 10–2.000 karakter.' }
    if (fields.includes('memberCount') && (!Number.isInteger(Number(form.memberCount)) || Number(form.memberCount) < 1 || Number(form.memberCount) > 10_000)) next.memberCount = 'Masukkan jumlah anggota dari 1 sampai 10.000.'
    if (fields.includes('phone') && form.phone.trim() && (form.phone.trim().length < 6 || form.phone.trim().length > 40)) next.phone = 'Masukkan 6–40 karakter.'
    if (fields.includes('email') && form.email.trim() && (!/^\S+@\S+\.\S+$/.test(form.email.trim()) || form.email.trim().length > 320)) next.email = 'Masukkan email valid hingga 320 karakter.'
    setErrors((current) => ({ ...current, ...next }))
    return next
  }

  const stepFields: Array<Array<keyof typeof form>> = [['name', 'location'], ['description'], ['communityStory'], ['memberCount', 'phone', 'email']]
  const nextStep = () => {
    if (Object.keys(fieldErrors(stepFields[step])).length > 0) return
    setStep((current) => Math.min(current + 1, steps.length - 1))
  }

  const previousStep = () => {
    if (step === 0) {
      navigate('/onboarding', { replace: true })
      return
    }
    setStep((current) => current - 1)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return
    if (step < steps.length - 1) {
      nextStep()
      return
    }
    const next = fieldErrors(stepFields.flat())
    if (Object.keys(next).length > 0) {
      const firstInvalidStep = stepFields.findIndex((fields) => fields.some((field) => field in next))
      setStep(firstInvalidStep < 0 ? step : firstInvalidStep)
      return
    }
    const input: ArtisanOnboardingInput = {
      name: form.name.trim(),
      location: form.location.trim(),
      description: form.description.trim(),
      communityStory: form.communityStory.trim(),
      memberCount: Number(form.memberCount),
      ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
    }
    setPending(true)
    try {
      await completeArtisanOnboarding(input)
      toast({ message: 'Profil kelompok berhasil disimpan.', variant: 'success' })
      navigate(returnTo, { replace: true })
    } catch (error) {
      toast({ message: getApiErrorMessage(error, 'Tidak dapat menyimpan profil kelompok. Periksa isian lalu coba lagi.'), variant: 'error' })
    } finally {
      setPending(false)
    }
  }

  if (loading) return <PageLoading />
  if (profileError) return <main id="main-content" className="grid min-h-[100dvh] place-items-center bg-cream px-5 text-center"><div><p role="alert" className="text-sm text-muted">Profil kelompok tidak dapat dimuat. Periksa koneksi Anda lalu coba lagi.</p><button type="button" className="mt-4 rounded-xl bg-primary-dark px-4 py-2 text-sm font-bold text-white" onClick={() => setRetry((current) => current + 1)}>Coba lagi</button></div></main>

  if (!creatorMode) return <main id="main-content" className="min-h-[100dvh] bg-cream lg:grid lg:h-[100dvh] lg:grid-cols-[minmax(300px,.8fr)_minmax(0,1.2fr)] lg:overflow-hidden"><aside className="relative overflow-hidden bg-primary-dark px-5 py-8 text-white sm:px-8 lg:flex lg:flex-col lg:px-12 lg:py-10"><div className="absolute -right-24 -top-16 h-72 w-72 rounded-full bg-primary/45 blur-3xl" aria-hidden="true" /><div className="relative"><BrandMark inverse /></div><div className="relative mt-16 max-w-sm lg:mt-auto"><p className="text-4xl font-medium leading-[.94] tracking-[-.055em]">Selamat datang di Modalin.</p><p className="mt-5 text-sm leading-6 text-white/75">Pilih cara Anda menggunakan Modalin. Pilihan ini dapat diubah nanti melalui halaman profil.</p></div></aside><section className="flex min-h-[60dvh] items-center px-5 py-10 sm:px-8 lg:min-h-0 lg:overflow-y-auto lg:px-14 xl:px-24"><div className="mx-auto w-full max-w-xl"><p className="text-xs font-bold uppercase tracking-[.14em] text-primary-dark">Mulai menggunakan Modalin</p><h1 id="onboarding-choice-title" className="mt-5 text-4xl font-extrabold leading-[.95] tracking-[-.055em] text-ink sm:text-5xl">Anda ingin melanjutkan sebagai apa?</h1><p className="mt-4 text-sm leading-6 text-muted">Pilih satu opsi, lalu lanjutkan.</p><div role="radiogroup" aria-labelledby="onboarding-choice-title" className="mt-8 grid gap-4 sm:grid-cols-2"><button type="button" role="radio" aria-checked={accountType === 'customer'} onClick={() => setAccountType('customer')} className={accountType === 'customer' ? 'rounded-2xl border border-primary-dark bg-primary/5 p-5 text-left ring-2 ring-primary/15' : 'rounded-2xl border border-line bg-white p-5 text-left hover:border-primary-dark'}><span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/12 text-primary-dark"><ShoppingBag size={21} aria-hidden="true" /></span><strong className="mt-5 block text-xl text-ink">Pelanggan</strong><span className="mt-2 block text-sm leading-6 text-muted">Jelajahi koleksi dan buat pre-order.</span></button><button type="button" role="radio" aria-checked={accountType === 'creator'} onClick={() => setAccountType('creator')} className={accountType === 'creator' ? 'rounded-2xl border border-primary-dark bg-primary/5 p-5 text-left ring-2 ring-primary/15' : 'rounded-2xl border border-line bg-white p-5 text-left hover:border-primary-dark'}><span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-dark text-white"><Store size={21} aria-hidden="true" /></span><strong className="mt-5 block text-xl text-ink">Creator</strong><span className="mt-2 block text-sm leading-6 text-muted">Daftarkan kelompok dan buat kampanye.</span></button></div><Button type="button" className="mt-7 w-full sm:w-auto" disabled={!accountType} onClick={() => accountType === 'customer' ? navigate('/campaign', { replace: true }) : navigate(`/onboarding?mode=creator&returnTo=${encodeURIComponent('/campaigns/new')}`, { replace: true })}>Lanjut <ArrowRight size={16} aria-hidden="true" /></Button></div></section></main>

  const currentStep = steps[step]
  const StepIcon = currentStep.icon
  return <main id="main-content" className="min-h-[100dvh] bg-cream lg:grid lg:h-[100dvh] lg:grid-cols-[minmax(300px,.8fr)_minmax(0,1.2fr)] lg:overflow-hidden">
    <aside className="relative overflow-hidden bg-primary-dark px-5 py-6 text-white sm:px-8 lg:flex lg:flex-col lg:px-12 lg:py-10"><div className="absolute -right-24 -top-16 h-72 w-72 rounded-full bg-primary/45 blur-3xl" aria-hidden="true" /><div className="relative flex items-center justify-between lg:block"><BrandMark inverse /><p className="text-xs font-bold text-white/70 lg:mt-16">Profil pengrajin</p><p className="text-sm font-extrabold lg:hidden">{step + 1}/4</p></div><div className="relative mt-8 lg:mt-auto"><p className="max-w-sm text-3xl font-medium leading-[.94] tracking-[-.055em] sm:text-4xl">Setiap karya punya cerita yang layak didengar.</p><p className="mt-4 max-w-xs text-sm leading-6 text-white/75">Lengkapi profil sekali saja. Informasi ini dipakai kembali saat membuat kampanye.</p></div><ol className="relative mt-8 grid grid-cols-4 gap-2 lg:mt-12 lg:grid-cols-1 lg:gap-1">{steps.map((item, index) => <li key={item.label} className={index === step ? 'rounded-xl bg-white/15 p-2 lg:p-3' : 'p-2 lg:p-3'}><button type="button" onClick={() => index < step && setStep(index)} disabled={index > step} aria-current={index === step ? 'step' : undefined} className="flex w-full flex-col items-center gap-1 text-center disabled:cursor-default lg:flex-row lg:gap-3 lg:text-left"><span className={index < step ? 'grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-primary-dark' : index === step ? 'grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-primary-dark' : 'grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/35 text-white/75'}>{index < step ? <Check size={14} aria-hidden="true" /> : index + 1}</span><span className="text-[10px] font-bold leading-tight text-white sm:text-xs lg:text-sm">{item.label}</span></button></li>)}</ol></aside>
    <section className="flex min-h-[calc(100dvh-252px)] items-center px-5 py-8 sm:px-8 lg:min-h-0 lg:overflow-y-auto lg:px-14 xl:px-24"><div className="mx-auto w-full max-w-xl"><div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[.14em] text-primary-dark"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15"><StepIcon size={18} aria-hidden="true" /></span>Langkah {step + 1} dari {steps.length}</div><h1 tabIndex={-1} className="mt-6 font-display text-4xl leading-[.9] tracking-[-.055em] text-ink outline-none sm:text-5xl">{currentStep.title}</h1><p className="mt-4 max-w-lg text-sm leading-6 text-muted">{currentStep.description}</p><div className="mt-7 h-1.5 overflow-hidden rounded-full bg-line" aria-label={`Kemajuan ${step + 1} dari ${steps.length}`} role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={step + 1}><div className="h-full rounded-full bg-primary-dark transition-all duration-300" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div><form className="mt-8" onSubmit={submit} noValidate>{step === 0 && <div className="grid gap-5"><Input id="group-name" label="Nama kelompok" error={errors.name} maxLength={160} required value={form.name} onChange={(event) => update('name', event.target.value)} /><Input id="group-location" label="Lokasi" error={errors.location} hint="Contoh: Sumba Timur, Nusa Tenggara Timur" maxLength={160} required value={form.location} onChange={(event) => update('location', event.target.value)} /></div>}{step === 1 && <RichTextEditor id="group-description" label="Deskripsi kelompok" error={errors.description} hint="10–2.000 karakter." maxLength={2_000} required value={form.description} onChange={(value) => update('description', value)} />}{step === 2 && <RichTextEditor id="community-story" label="Cerita komunitas" error={errors.communityStory} hint="10–2.000 karakter." maxLength={2_000} required value={form.communityStory} onChange={(value) => update('communityStory', value)} />}{step === 3 && <div className="grid gap-5"><Input id="member-count" label="Jumlah anggota" error={errors.memberCount} type="number" min={1} max={10_000} required value={form.memberCount} onChange={(event) => update('memberCount', event.target.value)} /><div className="grid gap-5 sm:grid-cols-2"><Input id="group-phone" label="Nomor telepon" error={errors.phone} type="tel" maxLength={40} value={form.phone} hint="Opsional" onChange={(event) => update('phone', event.target.value)} /><Input id="group-email" label="Email kelompok" error={errors.email} type="email" maxLength={320} value={form.email} hint="Opsional" onChange={(event) => update('email', event.target.value)} /></div></div>}<div className="mt-8 flex items-center justify-between gap-3"><Button type="button" variant="ghost" onClick={previousStep}><ArrowLeft size={16} aria-hidden="true" />Kembali</Button>{step === steps.length - 1 ? <Button type="submit" disabled={pending} loading={pending}>{pending ? 'Menyimpan…' : 'Simpan profil'}<Check size={16} aria-hidden="true" /></Button> : <Button type="submit">Lanjutkan<ArrowRight size={16} aria-hidden="true" /></Button>}</div></form></div></section>
  </main>
}
