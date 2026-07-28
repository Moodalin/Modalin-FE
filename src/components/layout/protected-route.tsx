import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getProfile } from '@/api/profile/profile'
import type { ArtisanProfile } from '@/api/profile/profile'
import { useAuth } from '@/hooks/use-auth'
import { PageLoading } from '@/components/ui/page-loading'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  const location = useLocation()
  if (loading) return <PageLoading />
  if (!session) return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />
  return children
}

export function ArtisanRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  const location = useLocation()
  const [profile, setProfile] = useState<ArtisanProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (!session) {
      setProfile(null)
      setProfileLoading(false)
      setProfileError(false)
      return
    }
    let current = true
    setProfileLoading(true)
    setProfileError(false)
    getProfile()
      .then((result) => { if (current) setProfile(result) })
      .catch(() => { if (current) setProfileError(true) })
      .finally(() => { if (current) setProfileLoading(false) })
    return () => { current = false }
  }, [retry, session])

  const returnTo = location.pathname + location.search
  if (loading || (session && profileLoading)) return <PageLoading />
  if (!session) return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />
  if (profileError) return <main id="main-content" className="grid min-h-screen place-items-center bg-white px-5 text-center"><div><p role="alert" className="text-sm text-muted">Profil tidak dapat dimuat. Periksa koneksi Anda lalu coba lagi.</p><button type="button" className="mt-4 rounded-xl bg-primary-dark px-4 py-2 text-sm font-bold text-white" onClick={() => setRetry((current) => current + 1)}>Coba lagi</button></div></main>
  if ((profile?.role === 'ARTISAN' && profile.onboardingStatus === 'COMPLETED') || profile?.role === 'ADMIN') return children
  return <Navigate to={`/onboarding?returnTo=${encodeURIComponent(returnTo)}`} replace />
}
