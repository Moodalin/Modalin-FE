import { apiClient, type ApiSuccess } from '@/config/api-client'
import { ApiPaths } from '@/constants/api'
import type { OrderHistoryItem, OrderPaymentResult, PreorderInput, PreorderResult } from '@/types/campaign'

export async function createPreorder(campaignId: string, input: PreorderInput): Promise<ApiSuccess<PreorderResult>> {
  return apiClient.post<ApiSuccess<PreorderResult>>(ApiPaths.preorder(campaignId), {
    customerName: input.customerName,
    customerEmail: input.email,
    customerPhone: input.phone || null,
    shippingAddress: input.address,
    items: input.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId || null,
      quantity: item.quantity,
      customizationNotes: item.notes || null,
    })),
  })
}

export async function getOrderHistory(signal?: AbortSignal): Promise<OrderHistoryItem[]> {
  const response = await apiClient.get<ApiSuccess<OrderHistoryItem[]>>(ApiPaths.orderHistory, { signal })
  return response.data
}

export async function continueOrderPayment(orderId: string): Promise<OrderPaymentResult> {
  const response = await apiClient.post<ApiSuccess<OrderPaymentResult>>(ApiPaths.orderPayment(orderId))
  return response.data
}
