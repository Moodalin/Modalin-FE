import type { CampaignStatus } from '@/types/campaign'

export const CampaignStatusLabel = {
  funding: 'Pre-order dibuka',
  target_reached: 'Target tercapai',
  in_production: 'Dalam produksi',
  completed: 'Selesai',
}

export const CampaignStatusBadgeClassName = {
  funding: 'bg-primary/10 text-primary-dark',
  target_reached: 'bg-primary/10 text-primary-dark',
  in_production: 'bg-primary/10 text-primary-dark',
  completed: 'bg-primary/10 text-primary-dark',
} satisfies Record<CampaignStatus, string>
