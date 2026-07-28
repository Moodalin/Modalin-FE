import { ArrowRight, Check, Clock3, LockKeyhole } from 'lucide-react'
import type { Campaign } from '@/types/campaign'
import { formatRupiah } from '@/config/format'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CampaignStatusBadgeClassName, CampaignStatusLabel } from '@/constants/campaign-status'

export function CampaignProgress({ campaign }: { campaign: Campaign }) {
  const progress = campaign.targetAmount ? campaign.currentAmount / campaign.targetAmount * 100 : 0
  const targetReached = campaign.status !== 'funding'

  return <div className="surface-card-tinted rounded-2xl border border-primary-dark/20 p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-5">
      <div>
        <Badge className={CampaignStatusBadgeClassName[campaign.status]}>{targetReached ? <Check size={13} aria-hidden="true" /> : <Clock3 size={13} aria-hidden="true" />}{CampaignStatusLabel[campaign.status]}</Badge>
        <p className="mt-5 text-4xl font-extrabold tracking-[-.055em] text-ink">{formatRupiah(campaign.currentAmount)}</p>
        <p className="mt-1 text-sm text-muted">Target {formatRupiah(campaign.targetAmount)}</p>
      </div>
      <div className="border-l border-primary-dark/15 pl-5 text-right">
        <p className="text-3xl font-extrabold tracking-[-.04em] text-ink">{campaign.currentOrders}<span className="text-base font-bold text-muted">/{campaign.targetOrders}</span></p>
        <p className="mt-1 text-xs text-muted">pesanan</p>
      </div>
    </div>
    <Progress className="mt-6" value={progress} label="Target pre-order" />
    <div className="mt-3 flex items-center justify-between text-xs font-bold text-muted"><span>{Math.round(progress)}% terkumpul</span><span>{campaign.daysLeft} hari tersisa</span></div>
    <p className="mt-5 flex items-center gap-2 border-t border-primary-dark/15 pt-4 text-xs leading-5 text-muted"><LockKeyhole size={15} className="shrink-0 text-primary-dark" aria-hidden="true" />Dana digunakan untuk produksi saat target tercapai.</p>
  </div>
}

export function SectionHeading({ eyebrow, title, description, align = 'left', inverse = false }: { eyebrow?: string; title: string; description?: string; align?: 'left' | 'center'; inverse?: boolean }) {
  return <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>{eyebrow && <p className={`mb-3 text-[11px] font-extrabold uppercase tracking-[.16em] ${inverse ? 'text-amber' : 'text-primary-dark'}`}>{eyebrow}</p>}<h2 className={`font-display text-4xl leading-[.98] tracking-[-.045em] sm:text-5xl ${inverse ? 'text-white' : 'text-ink'}`}>{title}</h2>{description && <p className={`mt-5 text-base leading-7 ${inverse ? 'text-white/65' : 'text-muted'}`}>{description}</p>}</div>
}

export function StepArrow() { return <ArrowRight size={18} aria-hidden="true" className="text-primary-dark" /> }
