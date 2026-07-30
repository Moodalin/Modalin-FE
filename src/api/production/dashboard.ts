import { apiClient, type ApiSuccess } from '@/config/api-client'
import { ApiPaths } from '@/constants/api'
import type { DashboardResponse } from '@/types/campaign'

export async function getDashboard(campaignId?: string): Promise<DashboardResponse> {
  const response = await apiClient.get<ApiSuccess<DashboardResponse>>(campaignId ? ApiPaths.dashboardOverview(campaignId) : ApiPaths.dashboard)
  return response.data
}

export async function updateMilestone(milestoneId: string, input: { status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'; note?: string | null; isPublic?: boolean }) {
  return apiClient.patch<ApiSuccess<unknown>>(ApiPaths.milestone(milestoneId), input)
}

export async function updateExpense(costItemId: string, input: { actualTotalIdr: number; receiptUrl?: string | null; receiptName?: string | null; note?: string | null }) {
  return apiClient.patch<ApiSuccess<unknown>>(ApiPaths.expense(costItemId), input)
}
