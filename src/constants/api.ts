export const ApiPaths = {
  campaign: (identifier: string) => `/api/campaigns/${identifier}`,
  campaigns: '/api/campaigns',
  preorder: (identifier: string) => `/api/campaigns/${identifier}/preorders`,
  orderHistory: '/api/orders/me',
  dashboard: '/api/dashboard',
  milestone: (milestoneId: string) => `/api/production/milestones/${milestoneId}`,
  expense: (costItemId: string) => `/api/production/expenses/${costItemId}`,
  profile: '/api/profile',
  profileImage: '/api/profile/image',
  profileBanner: '/api/profile/banner',
  artisanOnboarding: '/api/profile/artisan-onboarding',
} as const
