import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ArtisanRoute, ProtectedRoute } from '@/components/layout/protected-route'
import { PageLoading } from '@/components/ui/page-loading'
import { AuthProvider } from '@/hooks/auth-provider'
import { ToastProvider } from '@/components/ui/toast'
import { useRouteFocus } from '@/hooks/use-route-focus'

const LandingPage = lazy(() => import('@/pages/landing'))
const ForCreatorPage = lazy(() => import('@/pages/for-creator'))
const FaqPage = lazy(() => import('@/pages/faq'))
const LoginPage = lazy(() => import('@/pages/auth/login'))
const RegisterPage = lazy(() => import('@/pages/auth/register'))
const OnboardingPage = lazy(() => import('@/pages/onboarding'))
const CampaignPublicPage = lazy(() => import('@/pages/campaign-public'))
const CampaignCollectionPage = lazy(() => import('@/pages/campaign-collection'))
const CampaignBuilderPage = lazy(() => import('@/pages/campaign-builder'))
const CheckoutPage = lazy(() => import('@/pages/checkout'))
const DashboardPage = lazy(() => import('@/pages/dashboard'))
const ProfilePage = lazy(() => import('@/pages/profile'))
const OrdersPage = lazy(() => import('@/pages/orders'))
const NotFoundPage = lazy(() => import('@/pages/not-found'))

function RouteFocus() {
  useRouteFocus()
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <RouteFocus />
          <a href="#main-content" className="skip-link">Lewati ke konten utama</a>
          <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/for-creator" element={<ForCreatorPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
            <Route path="/campaigns" element={<CampaignCollectionPage />} />
            <Route path="/campaigns/:campaignId" element={<CampaignPublicPage />} />
            <Route path="/campaigns/new" element={<ArtisanRoute><CampaignBuilderPage /></ArtisanRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ArtisanRoute><DashboardPage /></ArtisanRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </Suspense>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
