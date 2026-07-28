import { ArrowLeft } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button'
import { BrandMark } from '@/components/layout/marketing'

export default function NotFoundPage() {
  return <main id="main-content" className="grid min-h-screen place-items-center bg-cream px-5"><div className="max-w-lg text-center"><BrandMark /><p className="mt-12 text-8xl font-extrabold tracking-[-.08em] text-primary-dark">404</p><h1 tabIndex={-1} className="mt-2 font-display text-5xl leading-none text-ink outline-none">Halaman tidak ditemukan.</h1><p className="mt-5 text-muted">Tautan mungkin telah dipindahkan atau tidak lagi tersedia.</p><ButtonLink to="/" className="mt-7"><ArrowLeft size={16} aria-hidden="true" />Kembali ke beranda</ButtonLink></div></main>
}
