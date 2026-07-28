import { useEffect, useState } from 'react'
import { getApiErrorMessage } from '@/config/api-error'
import { getCampaign } from '@/api/campaigns/campaigns'
import { useToast } from '@/hooks/use-toast'
import type { Campaign } from '@/types/campaign'

export function useCampaign(campaignId = 'seed-modalin-eastern-sky-weave') {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [request, setRequest] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    setLoading(true)
    let active = true
    getCampaign(campaignId).then((data) => {
      if (!active) return
      setCampaign(data)
      setError(false)
    }).catch((caught) => {
      if (!active) return
      setError(true)
      toast({ message: getApiErrorMessage(caught, 'Kami tidak dapat memuat kampanye ini. Segarkan lalu coba lagi.'), variant: 'error' })
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [campaignId, request, toast])

  return { campaign, loading, error, retry: () => setRequest((current) => current + 1) }
}
