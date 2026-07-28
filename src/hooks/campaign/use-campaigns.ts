import { useCallback, useEffect, useState } from 'react'
import { getCampaignPage } from '@/api/campaigns/campaigns'
import { getApiErrorMessage } from '@/config/api-error'
import { useToast } from '@/hooks/use-toast'
import type { Campaign } from '@/types/campaign'

export function useCampaigns({ notifyOnError = true }: { notifyOnError?: boolean } = {}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [requestVersion, setRequestVersion] = useState(0)
  const retry = useCallback(() => setRequestVersion((version) => version + 1), [])
  const { toast } = useToast()

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(false)
    getCampaignPage({ limit: 10, signal: controller.signal }).then((page) => {
      if (controller.signal.aborted) return
      setCampaigns(page.items)
      setError(false)
    }).catch((caught) => {
      if (controller.signal.aborted) return
      setError(true)
      if (notifyOnError) toast({ message: getApiErrorMessage(caught, 'Kami tidak dapat memuat koleksi. Segarkan lalu coba lagi.'), variant: 'error' })
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [notifyOnError, requestVersion, toast])

  return { campaigns, loading, error, retry }
}
