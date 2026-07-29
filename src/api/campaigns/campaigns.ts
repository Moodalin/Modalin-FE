import { ApiPaths } from '@/constants/api'
import { apiClient, type ApiSuccess } from '@/config/api-client'
import { TextileSources } from '@/constants/textile-sources'
import type { Campaign, FundItem, ManagedCampaign, Milestone, OwnedCampaignSummary, Product, ProductVariant } from '@/types/campaign'
import type { CreateCampaignInput, CreateCampaignResult } from '@/types/builder'

interface ApiVariant {
  id: string
  variantValue: string
  additionalPriceIdr: number
}

interface ApiProduct {
  id: string
  name: string
  productType: string
  description: string
  priceIdr: number
  imageUrl: string | null
  variants: ApiVariant[]
}

interface ApiCostItem {
  id: string
  name: string
  category: string
  plannedTotalIdr: number
  actualTotalIdr: number
}

interface ApiMilestone {
  id: string
  milestoneType: string
  status: string
  note: string | null
  sequence: number
}

interface ApiCampaign {
  id: string
  slug: string
  title: string
  description: string
  motifStory: string
  heroImageUrl: string | null
  status: string
  campaignDeadline: string
  productionDurationDays: number
  estimatedDeliveryDate: string
  minimumFundingTargetIdr: number
  minimumOrderQuantity: number
  currentFundingAmountIdr: number
  currentOrderQuantity: number
  group: {
    name: string
    location: string
    memberCount: number
  }
  products: ApiProduct[]
  costItems?: ApiCostItem[]
  milestones?: ApiMilestone[]
}

const colors = ['#0C8970', '#00B28F', '#FCBA42', '#74C7B5', '#A7B8B1']

const productFallbackSources = [TextileSources.eastSumbaHinggi, TextileSources.lembataIkat, TextileSources.floresWeaver]

const ProductTypeLabel: Record<string, string> = {
  SCARF: 'Selendang',
  BAG: 'Tas',
}

const MilestoneTypeLabel: Record<string, string> = {
  MATERIAL_PREPARATION: 'Persiapan bahan',
  WEAVING: 'Penenunan',
  QUALITY_CHECK: 'Pemeriksaan kualitas',
  PACKING: 'Pengemasan',
  SHIPPING: 'Pengiriman',
}


function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value))
}

function mapStatus(status: string): Campaign['status'] {
  if (status === 'TARGET_REACHED') return 'target_reached'
  if (['IN_PRODUCTION', 'QUALITY_CHECK', 'PACKING', 'SHIPPING'].includes(status)) return 'in_production'
  if (status === 'COMPLETED') return 'completed'
  return 'funding'
}

function mapProduct(product: ApiProduct, index: number): Product {
  const localSource = productFallbackSources[index % productFallbackSources.length]
  return {
    id: product.id,
    name: product.name,
    type: ProductTypeLabel[product.productType.toUpperCase()] ?? 'Produk tekstil',
    description: product.description,
    price: product.priceIdr,
    variants: product.variants.map((variant): ProductVariant => ({ id: variant.id, label: variant.variantValue, additionalPrice: variant.additionalPriceIdr })),
    imageUrl: product.imageUrl ?? localSource.imageUrl,
    imageAlt: product.imageUrl ? `Produk tekstil ${product.name}` : localSource.imageAlt,
  }
}

function mapFundItem(item: ApiCostItem, index: number): FundItem {
  return { id: item.id, label: item.name, amount: item.plannedTotalIdr, actualAmount: item.actualTotalIdr, color: colors[index % colors.length] }
}

function mapMilestone(item: ApiMilestone): Milestone {
  return {
    id: item.id,
    title: MilestoneTypeLabel[item.milestoneType.toUpperCase()] ?? 'Tahap produksi',
    detail: item.note ?? 'Status produksi dibagikan oleh tim pengrajin.',
    date: `Tahap ${item.sequence}`,
    status: item.status === 'COMPLETED' ? 'done' : item.status === 'IN_PROGRESS' ? 'active' : item.status === 'BLOCKED' ? 'blocked' : 'upcoming',
  }
}

export function mapCampaign(data: ApiCampaign): Campaign {
  const deadline = new Date(data.campaignDeadline)
  const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / 86_400_000))
  const heroSource = TextileSources.eastSumbaHinggi
  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    eyebrow: `Koleksi terbatas · ${data.group.location}`,
    description: data.description,
    motifStory: data.motifStory,
    artisanGroup: data.group.name,
    location: data.group.location,
    artisanCount: data.group.memberCount,
    status: mapStatus(data.status),
    targetAmount: data.minimumFundingTargetIdr,
    currentAmount: data.currentFundingAmountIdr,
    targetOrders: data.minimumOrderQuantity,
    currentOrders: data.currentOrderQuantity,
    daysLeft,
    deadline: formatDate(data.campaignDeadline),
    deliveryEstimate: formatDate(data.estimatedDeliveryDate),
    imageUrl: data.heroImageUrl ?? heroSource.imageUrl,
    imageAlt: data.heroImageUrl ? `Tekstil kampanye ${data.title}` : heroSource.imageAlt,
    products: data.products.map(mapProduct),
    fundAllocation: (data.costItems ?? []).map(mapFundItem),
    milestones: (data.milestones ?? []).map(mapMilestone),
  }
}

export type CampaignPageSort = 'progress' | 'deadline' | 'target'

export interface CampaignPage {
  items: Campaign[]
  nextCursor: string | null
  facets: {
    locations: string[]
  }
}

export interface GetCampaignPageOptions {
  limit: number
  cursor?: string | null
  signal?: AbortSignal
  query?: string
  status?: Campaign['status']
  location?: string
  sort?: CampaignPageSort
}

export async function getCampaign(identifier: string): Promise<Campaign> {
  const response = await apiClient.get<ApiSuccess<ApiCampaign>>(ApiPaths.campaign(identifier))
  return mapCampaign(response.data)
}

export async function getCampaignPage({ limit, cursor, signal, query, status, location, sort }: GetCampaignPageOptions): Promise<CampaignPage> {
  const searchParams = new URLSearchParams()
  searchParams.set('limit', String(limit))
  if (cursor) searchParams.set('cursor', cursor)
  if (query) searchParams.set('query', query)
  if (status) searchParams.set('status', status)
  if (location) searchParams.set('location', location)
  if (sort) searchParams.set('sort', sort)
  const response = await apiClient.get<ApiSuccess<{ items: ApiCampaign[]; nextCursor: string | null; facets: { locations: string[] } }>>(`${ApiPaths.campaigns}?${searchParams.toString()}`, { signal })
  return {
    items: response.data.items.map(mapCampaign),
    nextCursor: response.data.nextCursor ?? null,
    facets: { locations: response.data.facets.locations },
  }
}

export async function createCampaign(input: CreateCampaignInput, files: { designImage: File | null; productImages: File[] }) {
  const form = new FormData()
  form.set('campaign', JSON.stringify(input))
  if (files.designImage) form.set('designImage', files.designImage)
  files.productImages.forEach((image) => form.append('productImages', image))
  return apiClient.postForm<ApiSuccess<CreateCampaignResult>>(ApiPaths.campaigns, form)
}

export async function getOwnedCampaigns(): Promise<OwnedCampaignSummary[]> {
  const response = await apiClient.get<ApiSuccess<OwnedCampaignSummary[]>>(ApiPaths.ownedCampaigns)
  return response.data
}

export async function getManagedCampaign(identifier: string): Promise<ManagedCampaign> {
  const response = await apiClient.get<ApiSuccess<ManagedCampaign>>(ApiPaths.campaignManage(identifier))
  return response.data
}

export type UpdateCampaignInput = {
  title: string
  description: string
  motifStory: string
  productionDurationDays?: number
  minimumFundingTargetIdr?: number
  minimumOrderQuantity?: number
  products?: Array<{ id: string; name: string; productType: string; description: string; priceIdr: number }>
  costItems?: Array<{ id: string; category: 'MATERIAL' | 'LABOUR' | 'PACKAGING' | 'TRANSPORT' | 'OTHER' | 'RESERVE'; name: string; plannedTotalIdr: number }>
}

export async function updateCampaign(identifier: string, input: UpdateCampaignInput) {
  return apiClient.patch<ApiSuccess<ManagedCampaign>>(ApiPaths.campaign(identifier), input)
}

export async function updateCampaignProductImage(identifier: string, productId: string, image: File) {
  const form = new FormData()
  form.set('productImages', image)
  return apiClient.postForm<ApiSuccess<ManagedCampaign>>(ApiPaths.campaignProductImage(identifier, productId), form)
}

export async function updateCampaignImage(identifier: string, image: File) {
  const form = new FormData()
  form.set('designImage', image)
  return apiClient.postForm<ApiSuccess<ManagedCampaign>>(ApiPaths.campaignImage(identifier), form)
}

export async function publishCampaign(identifier: string) {
  return apiClient.post<ApiSuccess<ManagedCampaign>>(ApiPaths.campaignPublish(identifier))
}

export async function deleteCampaign(identifier: string) {
  return apiClient.delete<ApiSuccess<{ id: string }>>(ApiPaths.campaign(identifier))
}
