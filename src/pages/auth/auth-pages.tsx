import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import loginTextile from '@/assets/textiles/login-toraja-textile.jpg'
import registerWeavers from '@/assets/textiles/register-java-weavers.jpg'
import { BrandMark } from '@/components/layout/marketing'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/field'
import { GoogleIcon } from '@/components/ui/google-icon'
import { getApiErrorMessage } from '@/config/api-error'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

type AuthMode = 'login' | 'register'

const content = {
  login: {
    title: 'Selamat datang kembali',
    description: 'Masuk untuk melihat pesanan dan melanjutkan aktivitas Anda di Modalin.',
    image: loginTextile,
    imageTitle: 'Pesanan hari ini menjadi modal produksi esok hari.',
    imageDescription: 'Kelola permintaan pelanggan dan mulai produksi setelah target minimum tercapai.',
  },
  register: {
    title: 'Buat akun',
    description: 'Buat akun untuk berbelanja atau mulai menjadi creator di Modalin.',
    image: registerWeavers,
    imageTitle: 'Temukan karya yang ingin Anda dukung.',
    imageDescription: 'Belanja sebagai pelanggan atau daftarkan kelompok Anda sebagai creator.',
  },
} as const

export function AuthShell({ mode, children, footer }: { mode: AuthMode; children: React.ReactNode; footer: React.ReactNode }) {
  const page = content[mode]
  const imagePanel = <aside className="relative hidden h-screen overflow-hidden bg-primary-dark lg:block"><img src={page.image} alt="" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/15 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-10 text-white xl:p-14"><h2 className="max-w-xl text-4xl font-extrabold leading-[1.05] tracking-[-.05em] xl:text-5xl">{page.imageTitle}</h2><p className="mt-4 max-w-lg text-sm leading-6 text-white/75">{page.imageDescription}</p></div></aside>
  const formPanel = <section className="flex h-screen flex-col overflow-y-auto bg-white px-6 py-7 sm:px-10 sm:py-9 lg:px-14 xl:px-20"><BrandMark /><div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10"><h1 tabIndex={-1} className="text-4xl font-extrabold tracking-[-.055em] text-ink outline-none sm:text-5xl">{page.title}</h1><p className="mt-3 text-sm leading-6 text-muted">{page.description}</p>{children}<div className="mt-7">{footer}</div></div></section>
  return <main id="main-content" className="h-screen overflow-hidden bg-white"><div className="grid h-screen lg:grid-cols-2">{mode === 'register' && imagePanel}{formPanel}{mode === 'login' && imagePanel}</div></main>
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [pendingAction, setPendingAction] = useState<'google' | 'credentials' | null>(null)
  const requestedReturnTo = new URLSearchParams(location.search).get('returnTo')
  const returnTo = requestedReturnTo?.startsWith('/') && !requestedReturnTo.startsWith('//') ? requestedReturnTo : '/campaign'

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (pendingAction) return
    setError('')
    if (mode === 'register' && !name.trim()) return setError('Masukkan nama lengkap Anda.')
    if (!email.includes('@')) return setError('Masukkan alamat email yang valid.')
    if (password.length < 8) return setError('Gunakan minimal delapan karakter untuk kata sandi.')
    setPendingAction('credentials')
    try {
      if (mode === 'login') await signIn({ email, password })
      else await signUp({ name, email, password })
      toast({ message: mode === 'login' ? 'Berhasil masuk.' : 'Akun berhasil dibuat.', variant: 'success' })
      navigate(mode === 'register' ? '/onboarding' : returnTo)
    } catch (caught) {
      toast({ message: getApiErrorMessage(caught, mode === 'login' ? 'Tidak dapat masuk. Periksa data Anda lalu coba lagi.' : 'Tidak dapat membuat akun. Coba lagi.'), variant: 'error' })
    } finally { setPendingAction(null) }
  }

  const google = async () => {
    if (pendingAction) return
    setPendingAction('google')
    const callbackDestination = mode === 'register' ? '/onboarding' : returnTo
    const callbackUrl = new URL(callbackDestination, window.location.origin)
    try { await signInWithGoogle(callbackUrl.href) }
    catch (caught) {
      toast({ message: getApiErrorMessage(caught, 'Login dengan Google belum tersedia. Coba lagi.'), variant: 'error' })
      setPendingAction(null)
    }
  }

  return <div className="mt-8"><Button type="button" variant="outline" className="w-full" onClick={google} disabled={pendingAction !== null} loading={pendingAction === 'google'}><GoogleIcon />{pendingAction === 'google' ? 'Menghubungkan Google…' : 'Lanjutkan dengan Google'}</Button><div className="my-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[.12em] text-muted"><span className="h-px flex-1 bg-line" />atau<span className="h-px flex-1 bg-line" /></div><form className="grid gap-4" onSubmit={submit} noValidate>{error && <div role="alert" aria-live="assertive" className="rounded-xl border border-error/30 bg-error/5 px-3 py-2.5 text-sm text-error">{error}</div>}{mode === 'register' && <Input id="name" label="Nama lengkap" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} />}<Input id="email" label="Email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /><div className="relative"><Input id="password" label="Kata sandi" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} className="absolute right-1.5 top-7 grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-cream hover:text-ink" onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}</button></div><Button type="submit" className="mt-1 w-full" disabled={pendingAction !== null} loading={pendingAction === 'credentials'}>{pendingAction === 'credentials' ? mode === 'login' ? 'Sedang masuk…' : 'Mendaftarkan…' : mode === 'login' ? 'Masuk' : 'Daftar'}</Button></form></div>
}

export function AuthFooter({ mode }: { mode: AuthMode }) {
  const location = useLocation()
  const returnTo = new URLSearchParams(location.search).get('returnTo')
  const authPath = mode === 'login' ? '/register' : '/login'
  const destination = returnTo ? `${authPath}?returnTo=${encodeURIComponent(returnTo)}` : authPath
  return <p className="text-center text-sm text-muted">{mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'} <Link className="font-extrabold text-primary-dark hover:underline" to={destination}>{mode === 'login' ? 'Daftar' : 'Masuk'}</Link></p>
}

export function LoginPage() { return <AuthShell mode="login" footer={<AuthFooter mode="login" />}><AuthForm mode="login" /></AuthShell> }
export function RegisterPage() { return <AuthShell mode="register" footer={<AuthFooter mode="register" />}><AuthForm mode="register" /></AuthShell> }
