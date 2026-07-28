import { apiClient, type ApiSuccess } from '@/config/api-client'
import { ApiPaths } from '@/constants/api'

export type ArtisanProfile = {
  id: string
  role: 'ARTISAN' | 'CUSTOMER' | 'ADMIN'
  onboardingStatus: 'PENDING' | 'COMPLETED'
  phone: string | null
  user: {
    name: string
    email: string
    image: string | null
  }
  artisanGroup: {
    id: string
    name: string
    location: string
    description: string
    communityStory: string
    memberCount: number
    verificationStatus: 'UNVERIFIED' | 'VERIFIED' | 'REJECTED'
    avatarUrl: string | null
    phone: string | null
    email: string | null
  } | null
}

export type ArtisanOnboardingInput = {
  name: string
  location: string
  description: string
  communityStory: string
  memberCount: number
  phone?: string
  email?: string
}

export type UpdateProfileInput = {
  name: string
  phone?: string
  artisanGroup?: {
    name: string
    location: string
    description: string
    communityStory: string
    memberCount: number
    phone?: string
    email?: string
  }
}

export async function getProfile(): Promise<ArtisanProfile> {
  const response = await apiClient.get<ApiSuccess<ArtisanProfile>>(ApiPaths.profile)
  return response.data
}

export async function completeArtisanOnboarding(input: ArtisanOnboardingInput): Promise<ArtisanProfile> {
  const response = await apiClient.patch<ApiSuccess<ArtisanProfile>>(ApiPaths.artisanOnboarding, input)
  return response.data
}

export async function updateProfile(input: UpdateProfileInput): Promise<ArtisanProfile> {
  const response = await apiClient.patch<ApiSuccess<ArtisanProfile>>(ApiPaths.profile, input)
  return response.data
}

export async function uploadProfileImage(file: File): Promise<ArtisanProfile> {
  const form = new FormData()
  form.set('profileImage', file)
  const response = await apiClient.postForm<ApiSuccess<ArtisanProfile>>(ApiPaths.profileImage, form)
  return response.data
}

export async function uploadGroupBanner(file: File): Promise<ArtisanProfile> {
  const form = new FormData()
  form.set('groupBanner', file)
  const response = await apiClient.postForm<ApiSuccess<ArtisanProfile>>(ApiPaths.profileBanner, form)
  return response.data
}
