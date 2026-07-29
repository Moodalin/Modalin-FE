import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, Eye, EyeOff, ImagePlus, KeyRound, LoaderCircle, Mail, ReceiptText, Save, UserRound, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getProfile, updateProfile, uploadGroupBanner, uploadProfileImage, type ArtisanProfile, type UpdateProfileInput } from '@/api/profile/profile'
import { Avatar, MarketingHeader } from '@/components/layout/marketing'
import { Button, ButtonLink } from '@/components/ui/button'
import { Input } from '@/components/ui/field'
import { RichTextEditor } from '@/components/ui/rich-text'
import { AvatarCropDialog } from '@/components/ui/avatar-crop-dialog'
import { parseRichText, richTextLength } from '@/components/ui/rich-text-value'
import { PageLoading } from '@/components/ui/page-loading'
import { getApiErrorMessage } from '@/config/api-error'
import { TextileSources } from '@/constants/textile-sources'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

const emptyForm = {
  name: '',
  phone: '',
  groupName: '',
  location: '',
  description: '',
  communityStory: '',
  memberCount: '1',
  groupPhone: '',
  groupEmail: '',
}

type ProfileForm = typeof emptyForm
type ProfileField = keyof ProfileForm
type ProfileErrors = Partial<Record<ProfileField, string>>
function profileForm(profile: ArtisanProfile): ProfileForm {
  const group = profile.artisanGroup
  return {
    name: profile.user.name,
    phone: profile.phone ?? '',
    groupName: group?.name ?? '',
    location: group?.location ?? '',
    description: group?.description ?? '',
    communityStory: group?.communityStory ?? '',
    memberCount: String(group?.memberCount ?? 1),
    groupPhone: group?.phone ?? '',
    groupEmail: group?.email ?? '',
  }
}

function validate(form: ProfileForm, hasGroup: boolean): ProfileErrors {
  const errors: ProfileErrors = {}
  const nameLength = form.name.trim().length
  if (nameLength < 2 || nameLength > 160) errors.name = 'Masukkan 2–160 karakter.'
  if (form.phone.trim() && (form.phone.trim().length < 6 || form.phone.trim().length > 40)) errors.phone = 'Masukkan 6–40 karakter.'

  if (!hasGroup) return errors
  const groupNameLength = form.groupName.trim().length
  const locationLength = form.location.trim().length
  const descriptionLength = richTextLength(form.description)
  const storyLength = richTextLength(form.communityStory)
  if (groupNameLength < 2 || groupNameLength > 160) errors.groupName = 'Masukkan 2–160 karakter.'
  if (locationLength < 2 || locationLength > 160) errors.location = 'Masukkan 2–160 karakter.'
  if (descriptionLength < 10 || descriptionLength > 2_000) errors.description = 'Masukkan 10–2.000 karakter.'
  if (storyLength < 10 || storyLength > 2_000) errors.communityStory = 'Masukkan 10–2.000 karakter.'
  const memberCount = Number(form.memberCount)
  if (!Number.isInteger(memberCount) || memberCount < 1 || memberCount > 10_000) errors.memberCount = 'Masukkan jumlah anggota dari 1 sampai 10.000.'
  if (form.groupPhone.trim() && (form.groupPhone.trim().length < 6 || form.groupPhone.trim().length > 40)) errors.groupPhone = 'Masukkan 6–40 karakter.'
  if (form.groupEmail.trim() && (!/^\S+@\S+\.\S+$/.test(form.groupEmail.trim()) || form.groupEmail.trim().length > 320)) errors.groupEmail = 'Masukkan email yang valid.'
  return errors
}
export default function ProfilePage() {
  const { refreshSession, changePassword, requestPasswordReset, hasCredentialAccount } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<ArtisanProfile | null>(null)
  const [form, setForm] = useState<ProfileForm>(emptyForm)
  const [errors, setErrors] = useState<ProfileErrors>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [pending, setPending] = useState(false)
  const [bannerPending, setBannerPending] = useState(false)
  const [credentialAccount, setCredentialAccount] = useState<boolean | null>(null)
  const [securityError, setSecurityError] = useState('')
  const [securityPending, setSecurityPending] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')
  const [imageError, setImageError] = useState<string>()
  const [cropSourceImage, setCropSourceImage] = useState<File | null>(null)
  const [bannerCropSourceImage, setBannerCropSourceImage] = useState<File | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!profileImage) {
      setImagePreviewUrl('')
      return
    }
    const previewUrl = URL.createObjectURL(profileImage)
    setImagePreviewUrl(previewUrl)
    return () => URL.revokeObjectURL(previewUrl)
  }, [profileImage])

  useEffect(() => {
    let current = true
    setLoading(true)
    setLoadError(false)
    setCredentialAccount(null)
    Promise.all([getProfile(), hasCredentialAccount().catch(() => null)])
      .then(([result, hasCredential]) => {
        if (!current) return
        setProfile(result)
        setForm(profileForm(result))
        setCredentialAccount(hasCredential)
        setSecurityError(hasCredential === null ? 'Status keamanan belum dapat dimuat.' : '')
      })
      .catch(() => { if (current) setLoadError(true) })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [hasCredentialAccount, retry])

  const update = (field: ProfileField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const selectProfileImage = (file: File | null) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setImageError('Pilih file JPEG, PNG, atau WebP.')
      return
    }
    setImageError(undefined)
    setCropSourceImage(file)
  }

  const selectBannerImage = (file: File | null) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({ message: 'Pilih file JPEG, PNG, atau WebP.', variant: 'error' })
      return
    }
    setBannerCropSourceImage(file)
  }

  const uploadBanner = async (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({ message: 'Pilih file JPEG, PNG, atau WebP.', variant: 'error' })
      return
    }
    setBannerPending(true)
    try {
      const result = await uploadGroupBanner(file)
      setProfile(result)
      toast({ message: 'Banner kelompok berhasil diperbarui.', variant: 'success' })
    } catch (error) {
      toast({ message: getApiErrorMessage(error, 'Banner kelompok tidak dapat diperbarui. Coba lagi.'), variant: 'error' })
    } finally {
      setBannerPending(false)
    }
  }

  const reloadCredentialStatus = async () => {
    setSecurityError('')
    try {
      setCredentialAccount(await hasCredentialAccount())
    } catch (error) {
      setSecurityError(getApiErrorMessage(error, 'Status keamanan belum dapat dimuat.'))
    }
  }

  const submitPassword = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    setSecurityError('')
    if (securityPending) return
    if (!credentialAccount) {
      const email = profile?.user.email
      if (!email) return setSecurityError('Email akun belum tersedia untuk menerima tautan.')
      setSecurityPending(true)
      try {
        await requestPasswordReset(email, `${window.location.origin}/reset-password`)
        toast({ message: 'Tautan untuk membuat kata sandi dikirim ke email akun Anda.', variant: 'success' })
      } catch (error) {
        setSecurityError(getApiErrorMessage(error, 'Tautan kata sandi tidak dapat dikirim. Coba lagi.'))
      } finally {
        setSecurityPending(false)
      }
      return
    }
    if (currentPassword.length === 0) return setSecurityError('Masukkan kata sandi saat ini.')
    if (newPassword.length < 8 || newPassword.length > 128) return setSecurityError('Gunakan 8–128 karakter untuk kata sandi baru.')
    if (newPassword !== confirmPassword) return setSecurityError('Konfirmasi kata sandi belum sama.')
    if (currentPassword === newPassword) return setSecurityError('Kata sandi baru harus berbeda dari kata sandi saat ini.')
    setSecurityPending(true)
    try {
      await changePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast({ message: 'Kata sandi diperbarui. Sesi lain telah dikeluarkan.', variant: 'success' })
    } catch (error) {
      setSecurityError(getApiErrorMessage(error, 'Kata sandi tidak dapat diperbarui. Periksa kata sandi saat ini.'))
    } finally {
      setSecurityPending(false)
    }
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending || bannerPending) return
    const hasGroup = Boolean(profile?.artisanGroup)
    const nextErrors = validate(form, hasGroup)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0 || imageError) return

    const input: UpdateProfileInput = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      ...(hasGroup ? {
        artisanGroup: {
          name: form.groupName.trim(),
          location: form.location.trim(),
          description: JSON.stringify(parseRichText(form.description)),
          communityStory: JSON.stringify(parseRichText(form.communityStory)),
          memberCount: Number(form.memberCount),
          phone: form.groupPhone.trim(),
          email: form.groupEmail.trim(),
        },
      } : {}),
    }

    setPending(true)
    try {
      if (profileImage) {
        const uploadedProfile = await uploadProfileImage(profileImage)
        setProfile(uploadedProfile)
        setProfileImage(null)
      }
      const result = await updateProfile(input)
      setProfile(result)
      setForm(profileForm(result))
      await refreshSession()
      toast({ message: 'Profil berhasil diperbarui.', variant: 'success' })
    } catch (error) {
      toast({ message: getApiErrorMessage(error, 'Profil tidak dapat diperbarui. Periksa isian lalu coba lagi.'), variant: 'error' })
    } finally {
      setPending(false)
    }
  }

  if (loading) return <PageLoading />
  if (loadError || !profile) return <main id="main-content" className="grid min-h-[100dvh] place-items-center bg-white px-5 text-center"><div><p role="alert" className="text-sm text-muted">Profil tidak dapat dimuat. Periksa koneksi Anda lalu coba lagi.</p><button type="button" className="mt-4 rounded-xl bg-primary-dark px-4 py-2 text-sm font-bold text-white" onClick={() => setRetry((current) => current + 1)}>Coba lagi</button></div></main>

  const group = profile.artisanGroup
  const backTo = profile.role === 'ARTISAN' || profile.role === 'ADMIN' ? '/dashboard' : '/'
  const bannerSource = group?.avatarUrl || TextileSources.ikatWeaverArchive.imageUrl
  const bannerAlt = group?.avatarUrl ? `Foto kelompok ${group.name}` : TextileSources.ikatWeaverArchive.imageAlt
  return <>
    <MarketingHeader />
    <main id="main-content" className="min-h-[calc(100dvh-64px)] bg-white px-5 py-8 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-[1120px]">
        <Link to={backTo} className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-primary-dark hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark"><ArrowLeft size={17} aria-hidden="true" />Kembali</Link>
        <div className="mt-5 flex flex-col justify-between gap-5 border-b border-line pb-8 sm:flex-row sm:items-end">
          <div><p className="text-xs font-extrabold uppercase tracking-[.14em] text-primary-dark">Pengaturan akun</p><h1 className="mt-3 text-4xl font-medium leading-none tracking-[-.055em] text-ink sm:text-5xl">Profil saya</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted">Perbarui identitas akun dan informasi kelompok yang tampil pada kampanye.</p></div>
        </div>

        <form id="profile-form" onSubmit={submit} noValidate className="mt-8 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
          <aside className="rounded-2xl border border-line bg-white lg:sticky lg:top-24">
            <div className="group/banner relative h-36 overflow-hidden rounded-t-[calc(1rem-1px)] bg-cream sm:h-44 lg:h-36">
              <img
                key={bannerSource}
                src={bannerSource}
                alt={bannerAlt}
                className="h-full w-full object-cover object-[52%_24%]"
                onError={(event) => {
                  if (event.currentTarget.dataset.fallbackApplied) return
                  event.currentTarget.dataset.fallbackApplied = 'true'
                  event.currentTarget.src = TextileSources.ikatWeaverArchive.imageUrl
                  event.currentTarget.alt = TextileSources.ikatWeaverArchive.imageAlt
                }}
              />
              <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent" />
              {group && <>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(event) => {
                    selectBannerImage(event.currentTarget.files?.[0] ?? null)
                    event.currentTarget.value = ''
                  }}
                />
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={pending || bannerPending}
                  aria-label="Ubah banner kelompok"
                  aria-busy={bannerPending}
                  className="absolute right-3 top-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink/85 px-3 py-2 text-xs font-extrabold text-white opacity-100 transition-opacity hover:bg-ink focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60 sm:opacity-0 sm:group-hover/banner:opacity-100 sm:group-focus-within/banner:opacity-100 motion-reduce:transition-none"
                >
                  {bannerPending ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <ImagePlus size={16} aria-hidden="true" />}
                  {bannerPending ? 'Mengunggah…' : 'Ubah banner'}
                </button>
              </>}
            </div>
            <div className="relative px-6 pb-6">
              <div className="relative -mt-12 h-24 w-24 overflow-visible rounded-full bg-white p-1 shadow-sm">
                <Avatar image={imagePreviewUrl || profile.user.image} name={form.name || 'Akun'} className="h-full w-full text-xl" />
                <input
                  ref={imageInputRef}
                  id="profile-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(event) => {
                    selectProfileImage(event.target.files?.[0] ?? null)
                    event.currentTarget.value = ''
                  }}
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={pending || bannerPending}
                  aria-label={profileImage ? 'Ganti foto profil yang dipilih' : 'Ganti foto profil'}
                  aria-invalid={Boolean(imageError)}
                  aria-describedby={imageError ? 'profile-image-hint profile-image-error' : 'profile-image-hint'}
                  aria-busy={pending && Boolean(profileImage)}
                  className="absolute -bottom-1 -right-1 z-10 grid h-11 w-11 cursor-pointer place-items-center rounded-full border-4 border-white bg-ink text-white transition-colors hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
                >
                  <ImagePlus size={17} aria-hidden="true" />
                </button>
              </div>
              <p className="mt-4 break-words text-xl font-extrabold leading-6 text-ink">{form.name.trim() || 'Nama akun'}</p>
              <p className="mt-1 break-all text-xs text-muted">{profile.user.email}</p>
              <ButtonLink to="/orders" variant="outline" className="mt-5 w-full"><ReceiptText size={17} aria-hidden="true" />Riwayat pesanan</ButtonLink>
              <p id="profile-image-hint" className="mt-4 text-xs leading-5 text-muted">JPEG, PNG, atau WebP. Foto dipotong menjadi 512 × 512 piksel.</p>
              {profileImage && !imageError && <p role="status" className="mt-2 text-xs font-bold text-primary-dark">Foto baru siap disimpan.</p>}
              {imageError && <p id="profile-image-error" role="alert" className="mt-2 text-xs font-bold text-error">{imageError}</p>}
            </div>
          </aside>

          <div className="grid gap-6">
            <section aria-labelledby="account-heading" className="rounded-2xl border border-line bg-white p-5 sm:p-7">
              <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/12 text-primary-dark"><UserRound size={19} aria-hidden="true" /></span><div><h2 id="account-heading" className="text-lg font-extrabold text-ink">Identitas akun</h2><p className="text-xs leading-5 text-muted">Digunakan pada navigasi dan komunikasi akun.</p></div></div>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Input id="profile-name" label="Nama lengkap" value={form.name} onChange={(event) => update('name', event.target.value)} error={errors.name} maxLength={160} autoComplete="name" />
                <Input id="profile-phone" label="Nomor telepon" value={form.phone} onChange={(event) => update('phone', event.target.value)} error={errors.phone} maxLength={40} autoComplete="tel" placeholder="Contoh: 081234567890" />
                <Input id="profile-email" label="Email login" value={profile.user.email} disabled hint="Email login tidak dapat diubah dari halaman ini." autoComplete="email" />
              </div>
            </section>

            {group && <section aria-labelledby="group-heading" className="rounded-2xl border border-line bg-white p-5 sm:p-7">
              <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/12 text-primary-dark"><UsersRound size={19} aria-hidden="true" /></span><div><h2 id="group-heading" className="text-lg font-extrabold text-ink">Profil kelompok</h2><p className="text-xs leading-5 text-muted">Informasi publik yang menjelaskan kelompok pengrajin.</p></div></div>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Input id="group-name" label="Nama kelompok" value={form.groupName} onChange={(event) => update('groupName', event.target.value)} error={errors.groupName} maxLength={160} />
                <Input id="group-location" label="Lokasi" value={form.location} onChange={(event) => update('location', event.target.value)} error={errors.location} maxLength={160} />
                <RichTextEditor id="group-description" label="Deskripsi kelompok" value={form.description} onChange={(value) => update('description', value)} error={errors.description} maxLength={2000} hint="Masukkan 10–2.000 karakter terlihat." className="sm:col-span-2" />
                <RichTextEditor id="group-story" label="Cerita komunitas" value={form.communityStory} onChange={(value) => update('communityStory', value)} error={errors.communityStory} maxLength={2000} hint="Masukkan 10–2.000 karakter terlihat." className="sm:col-span-2" />
                <Input id="group-members" label="Jumlah anggota" type="number" min={1} max={10000} value={form.memberCount} onChange={(event) => update('memberCount', event.target.value)} error={errors.memberCount} inputMode="numeric" />
                <Input id="group-phone" label="Telepon kelompok" value={form.groupPhone} onChange={(event) => update('groupPhone', event.target.value)} error={errors.groupPhone} maxLength={40} autoComplete="tel" />
                <Input id="group-email" label="Email kelompok" type="email" value={form.groupEmail} onChange={(event) => update('groupEmail', event.target.value)} error={errors.groupEmail} maxLength={320} autoComplete="email" />
              </div>
            </section>}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link to={backTo} className="inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-extrabold text-primary-dark hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark">Batal</Link><Button type="submit" disabled={pending || bannerPending} loading={pending}><Save size={17} aria-hidden="true" />{pending ? 'Menyimpan…' : 'Simpan profil'}</Button></div>
          </div>
        </form>

        <section aria-labelledby="security-heading" className="mt-8 rounded-2xl border border-line bg-white p-5 sm:p-7 lg:ml-[292px]">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/12 text-primary-dark"><KeyRound size={19} aria-hidden="true" /></span><div><h2 id="security-heading" className="text-lg font-extrabold text-ink">Keamanan akun</h2><p className="text-xs leading-5 text-muted">Kelola kata sandi untuk login email tanpa memengaruhi login Google.</p></div></div>
          {credentialAccount === null ? <div className="mt-6 rounded-xl border border-line p-4"><p role="alert" className="text-sm text-muted">{securityError || 'Memuat status keamanan…'}</p><Button type="button" variant="outline" className="mt-3" onClick={reloadCredentialStatus}>Coba lagi</Button></div> : credentialAccount ? <form className="mt-6 grid gap-5" onSubmit={submitPassword} noValidate>{securityError && <p role="alert" className="rounded-xl border border-error/25 bg-error/5 px-3 py-2.5 text-sm text-error">{securityError}</p>}<div className="relative"><Input id="current-password" label="Kata sandi saat ini" type={showPasswords ? 'text' : 'password'} autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /><button type="button" onClick={() => setShowPasswords((current) => !current)} aria-label={showPasswords ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} className="absolute right-1.5 top-7 grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-cream hover:text-ink">{showPasswords ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}</button></div><div><p className="mb-3 text-xs leading-5 text-muted">Gunakan 8–128 karakter untuk kata sandi baru.</p><div className="grid items-start gap-5 sm:grid-cols-2"><Input id="profile-new-password" label="Kata sandi baru" type={showPasswords ? 'text' : 'password'} autoComplete="new-password" minLength={8} maxLength={128} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /><Input id="profile-confirm-password" label="Konfirmasi kata sandi" type={showPasswords ? 'text' : 'password'} autoComplete="new-password" minLength={8} maxLength={128} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div></div><Button type="submit" className="justify-self-start" loading={securityPending} disabled={securityPending}>Ubah kata sandi</Button></form> : <div className="mt-6 rounded-xl border border-line p-5"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cream text-primary-dark"><Mail size={18} aria-hidden="true" /></span><div><h3 className="font-extrabold text-ink">Buat kata sandi untuk login email</h3><p className="mt-1 text-sm leading-6 text-muted">Akun Anda masuk melalui Google dan belum memiliki kata sandi. Kami akan mengirim tautan aman ke <strong className="text-ink">{profile.user.email}</strong>. Tidak ada kata sandi awal atau kata sandi otomatis.</p></div></div>{securityError && <p role="alert" className="mt-4 text-sm text-error">{securityError}</p>}<Button type="button" className="mt-5" loading={securityPending} disabled={securityPending} onClick={() => void submitPassword()}>Kirim tautan ke email</Button></div>}
        </section>
      </div>
    </main>
    {cropSourceImage && <AvatarCropDialog file={cropSourceImage} onCancel={() => setCropSourceImage(null)} onConfirm={(file) => { setProfileImage(file); setImageError(undefined); setCropSourceImage(null) }} />}
    {bannerCropSourceImage && <AvatarCropDialog mode="banner" file={bannerCropSourceImage} onCancel={() => setBannerCropSourceImage(null)} onConfirm={(file) => { setBannerCropSourceImage(null); void uploadBanner(file) }} />}
  </>
}
