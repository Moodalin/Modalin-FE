import { apiClient, type ApiSuccess } from '@/config/api-client'
import { ApiPaths } from '@/constants/api'
import type { DashboardResponse } from '@/types/campaign'

export async function getDashboard(campaignId?: string): Promise<DashboardResponse> {
  const response = await apiClient.get<ApiSuccess<DashboardResponse>>(campaignId ? ApiPaths.dashboardOverview(campaignId) : ApiPaths.dashboard)
  return response.data
}

export async function updateMilestone(campaignId: string, milestoneId: string, input: { status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'; note?: string | null; isPublic?: boolean }) {
  return apiClient.post<ApiSuccess<unknown>>(ApiPaths.campaignMilestone(campaignId), { milestoneId, ...input })
}

export async function updateExpense(campaignId: string, costItemId: string, input: { actualTotalIdr: number; receiptUrl?: string | null; receiptName?: string | null; note?: string | null }) {
  return apiClient.post<ApiSuccess<unknown>>(ApiPaths.campaignExpense(campaignId), { costItemId, ...input })
}
