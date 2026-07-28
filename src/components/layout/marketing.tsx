import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, LayoutDashboard, LogOut, Menu, UserRound, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ButtonLink } from '@/components/ui/button'
import { getApiErrorMessage } from '@/config/api-error'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/components/ui/utils'

export function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return <Link to="/" className={cn('inline-flex items-center gap-2 text-[17px] font-bold tracking-[-.05em] text-[#00B28F]', inverse && 'text-white')} aria-label="Beranda Modalin"><img src="/logo.svg" alt="" className={cn('h-6 w-auto', inverse && 'brightness-0 invert')} />Modalin</Link>
}

export function Avatar({ image, name, className }: { image?: string | null; name: string; className?: string }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'M'
  return <span aria-hidden="true" className={cn('relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary/12 text-xs font-extrabold text-primary-dark', className)}>{initials}{image && <img key={image} src={image} alt="" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.hidden = true }} className="absolute inset-0 h-full w-full object-cover" />}</span>
}

export function MarketingHeader() {
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [confirmingSignOut, setConfirmingSignOut] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const { session, loading, signOut } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const user = session?.user

  const closeMenus = () => { setOpen(false); setProfileOpen(false) }
  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      setConfirmingSignOut(false)
      closeMenus()
      toast({ message: 'Berhasil keluar.', variant: 'info' })
      navigate('/')
    } catch (error) {
      toast({ message: getApiErrorMessage(error, 'Tidak dapat keluar. Coba lagi.'), variant: 'error' })
    } finally {
      setSigningOut(false)
    }
  }

  const openSignOutConfirmation = () => { closeMenus(); setConfirmingSignOut(true) }
  const accountActions = user ? <><Link to="/profile" onClick={closeMenus} className="flex min-h-9 items-center gap-2 rounded-lg px-2.5 text-sm font-bold text-ink hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark"><UserRound size={15} aria-hidden="true" />Profil saya</Link><Link to="/dashboard" onClick={closeMenus} className="flex min-h-9 items-center gap-2 rounded-lg px-2.5 text-sm font-bold text-ink hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark"><LayoutDashboard size={15} aria-hidden="true" />Dashboard</Link><button type="button" onClick={openSignOutConfirmation} className="flex min-h-9 w-full items-center gap-2 rounded-lg bg-error/10 px-2.5 text-left text-sm font-bold text-error hover:bg-error/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"><LogOut size={15} aria-hidden="true" />Keluar</button></> : null

  const shouldReduceMotion = useReducedMotion()
  return <><div className="h-16" aria-hidden="true" /><header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-white/95 backdrop-blur"><div className="relative mx-auto flex h-[64px] max-w-[1280px] items-center px-5 lg:px-7"><BrandMark /><nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 text-[10px] font-medium text-ink md:flex" aria-label="Navigasi utama"><a href="/#problem" className="hover:text-primary-dark">Masalah Utama</a><a href="/#about" className="hover:text-primary-dark">Tentang</a><a href="/#collection" className="hover:text-primary-dark">Koleksi</a><a href="/#how-it-works" className="hover:text-primary-dark">Alur Kerja</a></nav><div className="relative z-10 ml-auto hidden items-center gap-3 md:flex">{!loading && (user ? <div className="relative" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setProfileOpen(false) }} onKeyDown={(event) => { if (event.key === 'Escape' && profileOpen) { event.preventDefault(); setProfileOpen(false); event.currentTarget.querySelector<HTMLButtonElement>('button')?.focus() } }}><button type="button" aria-label={profileOpen ? 'Tutup menu akun' : 'Buka menu akun'} aria-expanded={profileOpen} aria-controls="account-menu" onClick={() => setProfileOpen((value) => !value)} className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-left hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark"><Avatar image={user.image} name={user.name} className="h-7 w-7" /><span className="max-w-32 truncate text-sm font-bold text-ink">{user.name}</span><motion.span animate={{ rotate: profileOpen ? 180 : 0 }} transition={{ duration: shouldReduceMotion ? 0 : 0.16 }}><ChevronDown size={14} className="text-muted" aria-hidden="true" /></motion.span></button><AnimatePresence initial={false}>{profileOpen && <motion.div id="account-menu" role="group" aria-label="Tindakan akun" initial={shouldReduceMotion ? false : { opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: shouldReduceMotion ? 0 : 0.16, ease: 'easeOut' }} className="absolute right-0 top-[calc(100%+.5rem)] w-40 origin-top-right rounded-lg border border-line bg-white p-1 shadow-[0_10px_24px_rgba(29,37,34,.12)]">{accountActions}</motion.div>}</AnimatePresence></div> : <><Link to="/login" className="text-xs font-bold text-muted hover:text-primary-dark">Masuk</Link><ButtonLink to="/for-creator" className="min-h-9 rounded-lg px-4 py-2 text-xs">Untuk pengrajin</ButtonLink></>)}</div><button type="button" className="relative z-10 ml-auto grid h-10 w-10 place-items-center rounded-lg text-ink md:hidden" aria-label={open ? 'Tutup navigasi' : 'Buka navigasi'} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen((value) => !value)}>{open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}</button>{open && <nav id="mobile-navigation" className="absolute inset-x-0 top-[64px] border-b border-line bg-white p-5 md:hidden" aria-label="Navigasi utama"><div className="grid gap-3 text-sm font-bold"><a href="/#problem" onClick={() => setOpen(false)}>Masalah Utama</a><a href="/#about" onClick={() => setOpen(false)}>Tentang</a><a href="/#collection" onClick={() => setOpen(false)}>Koleksi</a><a href="/#how-it-works" onClick={() => setOpen(false)}>Alur Kerja</a><Link to="/faq" onClick={() => setOpen(false)}>FAQ</Link>{!loading && (user ? <div className="mt-2 border-t border-line pt-3"><div className="mb-2 flex items-center gap-3 px-3"><Avatar image={user.image} name={user.name} className="h-9 w-9" /><span className="truncate text-sm font-extrabold text-ink">{user.name}</span></div>{accountActions}</div> : <div className="mt-2 flex gap-3"><ButtonLink to="/login" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Masuk</ButtonLink><ButtonLink to="/for-creator" className="flex-1" onClick={() => setOpen(false)}>Untuk pengrajin</ButtonLink></div>)}</div></nav>}</div></header><ConfirmDialog open={confirmingSignOut} title="Keluar dari akun?" description="Anda perlu masuk lagi untuk mengakses ruang kerja Anda." confirmLabel="Keluar" pending={signingOut} onCancel={() => setConfirmingSignOut(false)} onConfirm={handleSignOut} /></>
}

export function MarketingFooter() {
  return <footer className="bg-primary-dark px-5 py-16 text-white lg:px-8 lg:py-20"><div className="mx-auto grid max-w-[1120px] gap-10 md:grid-cols-[1fr_auto] md:items-end"><div><p className="text-sm text-white/70">Panduan Pengrajin</p><h2 className="mt-2 max-w-sm text-4xl font-medium leading-[.88] tracking-[-.065em] sm:text-5xl">Mulai Langkah<br />Pertama Anda.</h2><p className="mt-5 max-w-md text-xs leading-5 text-white/75">Semua yang Anda Butuhkan Untuk Membuat Kampanye, Mengumpulkan Pre-Order, Dan Mengubah Pesanan Menjadi Modal Produksi.</p></div><ButtonLink to="/campaigns/new" variant="dark" className="h-fit rounded-lg border-ink bg-ink px-6 text-[11px] hover:border-white">Buat Kampanye Sekarang</ButtonLink></div><div className="mx-auto mt-20 grid max-w-[1120px] gap-7 border-t border-white/20 pt-5 text-[9px] text-white/70 sm:grid-cols-[1fr_auto] sm:items-end"><div><BrandMark inverse /><p className="mt-2">Mengubah Ketertarikan Menjadi Modal.</p></div><div className="text-left sm:text-right"><p>+628 8816 3519</p><a className="mt-1 block hover:text-white" href="mailto:info@contact.modalin">info@contact.modalin</a></div></div></footer>
}
