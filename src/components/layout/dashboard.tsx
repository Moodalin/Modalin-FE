import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, Menu, PanelLeftClose, PanelLeftOpen, UserRound, X } from 'lucide-react'
import { DashboardNavigation } from '@/constants/navigation'
import { getApiErrorMessage } from '@/config/api-error'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Avatar, BrandMark } from '@/components/layout/marketing'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Select } from '@/components/ui/select'
import type { OwnedCampaignSummary } from '@/types/campaign'
import { cn } from '@/components/ui/utils'


export function DashboardLayout({ active, campaigns = [], selectedCampaignId = '', onCampaignChange, children }: { active: string; campaigns?: OwnedCampaignSummary[]; selectedCampaignId?: string; onCampaignChange?: (campaignId: string) => void; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [confirmingSignOut, setConfirmingSignOut] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const accountMenuId = useId()
  const accountRef = useRef<HTMLDivElement>(null)
  const accountTriggerRef = useRef<HTMLButtonElement>(null)
  const { session, signOut } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const user = session?.user
  const accountName = user?.name || 'Akun'
  const campaignStatusLabels: Record<string, string> = { DRAFT: 'Draf', REVIEW: 'Perlu ditinjau', PUBLISHED: 'Terbit', FUNDING: 'Pre-order dibuka', EXTENDED: 'Diperpanjang', TARGET_REACHED: 'Target tercapai', IN_PRODUCTION: 'Dalam produksi', QUALITY_CHECK: 'Pemeriksaan kualitas', PACKING: 'Pengemasan', SHIPPING: 'Pengiriman', COMPLETED: 'Selesai', FAILED: 'Target tidak tercapai', CANCELLED: 'Dibatalkan' }
  const campaignOptions = campaigns.map((campaign) => ({ value: campaign.id, label: campaign.title, description: `${campaignStatusLabels[campaign.status] ?? campaign.status} · ${campaign._count.orders} pesanan` }))
  const selectedCampaignQuery = selectedCampaignId ? `&campaignId=${encodeURIComponent(selectedCampaignId)}` : ''

  useEffect(() => {
    if (!accountOpen) return
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !accountRef.current?.contains(event.target)) setAccountOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [accountOpen])

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      setConfirmingSignOut(false)
      toast({ message: 'Berhasil keluar.', variant: 'info' })
      navigate('/')
    } catch (error) {
      toast({ message: getApiErrorMessage(error, 'Tidak dapat keluar. Coba lagi.'), variant: 'error' })
    } finally {
      setSigningOut(false)
    }
  }

  const openSignOutConfirmation = () => {
    setAccountOpen(false)
    accountTriggerRef.current?.focus()
    setConfirmingSignOut(true)
  }

  return <>
    <div className="dashboard-shell min-h-screen bg-white">
      <aside
        id="dashboard-sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-line bg-white p-4 transition-[width,transform] duration-200 motion-reduce:transition-none lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
          sidebarCollapsed && 'lg:w-20',
        )}
      >
        <div className={cn('flex h-12 items-center justify-between', sidebarCollapsed && 'lg:justify-center')}>
          <div className={cn('shrink-0 overflow-hidden', sidebarCollapsed && 'lg:w-6')}><BrandMark /></div>
          <button type="button" className="grid h-10 w-10 place-items-center rounded-xl border border-transparent text-muted hover:border-line hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark lg:hidden" aria-label="Tutup navigasi" onClick={() => setOpen(false)}><X size={19} aria-hidden="true" /></button>
        </div>
        <button
          type="button"
          className="absolute -right-[18px] top-5 hidden h-9 w-9 place-items-center rounded-xl border border-line bg-white text-muted shadow-sm hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark lg:grid"
          aria-label={sidebarCollapsed ? 'Perluas navigasi' : 'Ciutkan navigasi'}
          aria-controls="dashboard-sidebar"
          aria-expanded={!sidebarCollapsed}
          title={sidebarCollapsed ? 'Perluas navigasi' : 'Ciutkan navigasi'}
          onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={17} aria-hidden="true" /> : <PanelLeftClose size={17} aria-hidden="true" />}
        </button>

        <nav className="mt-6 grid gap-1" aria-label="Navigasi dasbor">
          {DashboardNavigation.map((item) => {
            const Icon = item.icon
            return <Link
              key={item.id}
              to={`/dashboard?tab=${item.id}${selectedCampaignQuery}`}
              aria-current={active === item.id ? 'page' : undefined}
              aria-label={sidebarCollapsed ? item.label : undefined}
              title={sidebarCollapsed ? item.label : undefined}
              onClick={() => setOpen(false)}
              className={cn(
                'flex min-h-12 items-center gap-3 rounded-xl px-3.5 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark',
                active === item.id ? 'bg-primary/12 text-primary-dark' : 'text-muted hover:bg-cream hover:text-ink',
                sidebarCollapsed && 'lg:justify-center lg:px-0',
              )}
            ><Icon className="shrink-0" size={18} aria-hidden="true" /><span className={cn(sidebarCollapsed && 'lg:sr-only')}>{item.label}</span></Link>
          })}
        </nav>
      </aside>
      {open && <button type="button" aria-label="Tutup navigasi" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-ink/25 lg:hidden" />}
      <div className={cn('transition-[padding] duration-200 motion-reduce:transition-none', sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64')}>
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-3 border-b border-line bg-white px-5 lg:px-9">
          <button type="button" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-white text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark lg:hidden" aria-label="Buka navigasi" onClick={() => setOpen(true)}><Menu size={20} aria-hidden="true" /></button>
          {campaigns.length > 0 && <div className="min-w-0 flex-1 sm:max-w-sm lg:ml-0"><Select id="header-campaign" label="Kampanye" labelClassName="sr-only" value={selectedCampaignId} options={campaignOptions} onChange={(campaignId) => onCampaignChange?.(campaignId)} compact /></div>}
          <div
            ref={accountRef}
            className="relative ml-auto"
            onBlur={(event) => {
              if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setAccountOpen(false)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && accountOpen) {
                event.preventDefault()
                setAccountOpen(false)
                accountTriggerRef.current?.focus()
              }
            }}
          >
            <button
              ref={accountTriggerRef}
              type="button"
              className="flex min-h-11 items-center gap-2 rounded-xl border border-transparent px-1.5 py-1 text-left hover:border-line hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark sm:gap-3 sm:pr-3"
              aria-label={`Menu akun ${accountName}`}
              aria-expanded={accountOpen}
              aria-controls={accountMenuId}
              onClick={() => setAccountOpen((current) => !current)}
            >
              <Avatar image={user?.image} name={accountName} className="h-9 w-9 border border-line" />
              <span className="hidden min-w-0 sm:block"><span className="block max-w-36 truncate text-xs font-extrabold text-ink">{accountName}</span><span className="block text-[10px] text-muted">Akun pengrajin</span></span>
              <ChevronDown className={cn('hidden shrink-0 text-muted transition-transform motion-reduce:transition-none sm:block', accountOpen && 'rotate-180')} size={16} aria-hidden="true" />
            </button>
            {accountOpen && <div id={accountMenuId} role="group" aria-label="Menu akun" className="absolute right-0 top-[calc(100%+.5rem)] z-50 w-72 rounded-2xl border border-line bg-white p-2 shadow-[0_18px_48px_rgba(29,37,34,.18)]">
              <div className="border-b border-line px-3 pb-3 pt-2"><p className="truncate text-sm font-extrabold text-ink">{accountName}</p>{user?.email && <p className="mt-1 truncate text-xs text-muted">{user.email}</p>}</div>
              <div className="grid gap-1 pt-2">
                <Link to="/profile" onClick={() => setAccountOpen(false)} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold text-ink hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark"><UserRound size={17} aria-hidden="true" />Profil</Link>
                <button type="button" onClick={openSignOutConfirmation} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold text-error hover:bg-error/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"><LogOut size={17} aria-hidden="true" />Keluar</button>
              </div>
            </div>}
          </div>
        </header>
        <main id="main-content" className="min-h-[calc(100vh-72px)] bg-white px-5 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
    <ConfirmDialog open={confirmingSignOut} title="Keluar dari akun?" description="Anda perlu masuk lagi untuk mengakses ruang kerja Anda." confirmLabel="Keluar" pending={signingOut} onCancel={() => setConfirmingSignOut(false)} onConfirm={handleSignOut} />
  </>
}

