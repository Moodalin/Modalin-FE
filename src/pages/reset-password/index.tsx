import { useState, type FormEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { BrandMark } from '@/components/layout/marketing'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/field'
import { authClient } from '@/config/auth-client'
import { getApiErrorMessage } from '@/config/api-error'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const invalidToken = params.get('error') === 'INVALID_TOKEN' || !token
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [complete, setComplete] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (password.length < 8 || password.length > 128) return setError('Gunakan 8–128 karakter untuk kata sandi.')
    if (password !== confirmation) return setError('Konfirmasi kata sandi belum sama.')
    setPending(true)
    try {
      const result = await authClient.resetPassword({ token, newPassword: password })
      if (result.error) throw { data: result.error }
      setComplete(true)
      setPassword('')
      setConfirmation('')
    } catch (caught) {
      setError(getApiErrorMessage(caught, 'Tautan tidak valid atau sudah kedaluwarsa. Minta tautan baru dari halaman profil.'))
    } finally {
      setPending(false)
    }
  }

  return <main id="main-content" className="grid min-h-[100dvh] place-items-center bg-cream px-5 py-10"><section aria-labelledby="reset-password-title" className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-[0_16px_40px_rgba(29,37,34,.08)] sm:p-8"><BrandMark /><h1 id="reset-password-title" className="mt-8 text-3xl font-extrabold tracking-[-.04em] text-ink">{complete ? 'Kata sandi berhasil dibuat' : 'Buat kata sandi baru'}</h1>{complete ? <div><p role="status" className="mt-3 text-sm leading-6 text-muted">Kata sandi sudah diperbarui dan sesi lain telah dikeluarkan untuk keamanan akun.</p><Link to="/login" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary-dark px-5 text-sm font-extrabold text-white">Masuk kembali</Link></div> : invalidToken ? <div><p role="alert" className="mt-3 text-sm leading-6 text-muted">Tautan tidak valid atau sudah kedaluwarsa. Minta tautan baru dari halaman profil.</p><Link to="/login" className="mt-6 inline-flex min-h-11 items-center rounded-xl border border-primary-dark px-5 text-sm font-extrabold text-primary-dark">Kembali ke halaman masuk</Link></div> : <form className="mt-6 grid gap-5" onSubmit={submit} noValidate>{error && <p role="alert" className="rounded-xl border border-error/25 bg-error/5 px-3 py-2.5 text-sm text-error">{error}</p>}<div className="relative"><Input id="new-password" label="Kata sandi baru" type={visible ? 'text' : 'password'} autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} hint="Gunakan 8–128 karakter." /><button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} className="absolute right-1.5 top-7 grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-cream hover:text-ink">{visible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}</button></div><Input id="confirm-password" label="Konfirmasi kata sandi" type={visible ? 'text' : 'password'} autoComplete="new-password" minLength={8} maxLength={128} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /><Button type="submit" loading={pending} disabled={pending}>Simpan kata sandi</Button></form>}</section></main>
}
