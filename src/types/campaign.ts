export type CampaignStatus = 'funding' | 'target_reached' | 'in_production' | 'completed'
export type CampaignLifecycleStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'FUNDING' | 'TARGET_REACHED' | 'IN_PRODUCTION' | 'QUALITY_CHECK' | 'PACKING' | 'SHIPPING' | 'COMPLETED' | 'FAILED' | 'EXTENDED' | 'CANCELLED'

export interface OwnedCampaignSummary {
  id: string
  slug: string
  title: string
  heroImageUrl: string | null
  status: CampaignLifecycleStatus
  campaignDeadline: string
  currentFundingAmountIdr: number
  minimumFundingTargetIdr: number
  currentOrderQuantity: number
  minimumOrderQuantity: number
  publishedAt: string | null
  updatedAt: string
  canDelete: boolean
  progress: { fundingPercentage: number; orderPercentage: number }
  _count: { orders: number }
}

export interface ManagedCampaignProduct {
  id: string
  name: string
  productType: string
  description: string
  priceIdr: number
  imageUrl: string | null
}

export interface ManagedCampaignCostItem {
  id: string
  category: 'MATERIAL' | 'LABOUR' | 'PACKAGING' | 'TRANSPORT' | 'OTHER' | 'RESERVE'
  name: string
  plannedTotalIdr: number
}

export interface ManagedCampaign {
  id: string
  slug: string
  title: string
  description: string
  motifStory: string
  heroImageUrl: string | null
  status: CampaignLifecycleStatus
  publishedAt: string | null
  campaignDeadline: string
  productionDurationDays: number
  minimumFundingTargetIdr: number
  minimumOrderQuantity: number
  products: ManagedCampaignProduct[]
  costItems: ManagedCampaignCostItem[]
  _count: { orders: number }
}

export interface ProductVariant {
  id: string
  label: string
  additionalPrice: number
}

export interface Product {
  id: string
  name: string
  type: string
  description: string
  price: number
  variants: ProductVariant[]
  imageUrl: string
  imageAlt: string
}

export interface FundItem {
  id: string
  label: string
  amount: number
  actualAmount: number
  color: string
}

export interface Milestone {
  id: string
  title: string
  detail: string
  date: string
  status: 'done' | 'active' | 'upcoming' | 'blocked'
}

export interface Campaign {
  id: string
  slug: string
  title: string
  eyebrow: string
  description: string
  motifStory: string
  artisanGroup: string
  location: string
  artisanCount: number
  status: CampaignStatus
  targetAmount: number
  currentAmount: number
  targetOrders: number
  currentOrders: number
  daysLeft: number
  deadline: string
  deliveryEstimate: string
  imageUrl: string
  imageAlt: string
  products: Product[]
  fundAllocation: FundItem[]
  milestones: Milestone[]
}

export interface PreorderItemInput {
  productId: string
  variantId?: string
  quantity: number
  notes?: string
}

export interface PreorderInput {
  items: PreorderItemInput[]
  customerName: string
  email: string
  phone: string
  address: string
}

export interface PreorderResult {
  id: string
  redirectUrl: string | null
  paymentRequiresReview: boolean
}

export interface OrderPaymentResult {
  id: string
  redirectUrl: string
}
export type OrderStatus = 'CONDITIONAL' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
export type OrderPaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUND_PENDING' | 'REFUNDED'
export type OrderShippingStatus = 'PENDING' | 'PACKED' | 'SHIPPED' | 'DELIVERED'

export interface OrderHistoryItem {
  id: string
  createdAt: string
  totalIdr: number
  status: OrderStatus
  paymentStatus: OrderPaymentStatus
  shippingStatus: OrderShippingStatus
  trackingNumber: string | null
  canContinuePayment: boolean
  paymentRequiresReview: boolean
  campaign: {
    id: string
    slug: string
    title: string
  }
  items: Array<{
    id: string
    productName: string
    variantLabel: string | null
    quantity: number
    unitPriceIdr: number
  }>
}

export interface DashboardOrderItem {
  id: string
  quantity: number
  unitPriceIdr: number
  productId: string
  variantId: string | null
}

export interface DashboardOrder {
  id: string
  customerName: string
  customerEmail: string
  status: string
  paymentStatus: string
  totalIdr: number
  createdAt: string
  items: DashboardOrderItem[]
}

export interface DashboardMilestone {
  id: string
  milestoneType: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'
  note: string | null
  sequence: number
  isPublic: boolean
}

export interface DashboardAssignment {
  id: string
  assignedQuantity: number
  completedQuantity: number
  dueDate: string
  status: string
  artisan: { name: string; specialization: string }
  product: { name: string }
}

export interface DashboardCostItem {
  id: string
  name: string
  category: string
  plannedTotalIdr: number
  actualTotalIdr: number
  receiptName: string | null
  note: string | null
}

export interface DashboardData {
  campaign: {
    id: string
    slug: string
    title: string
    description: string
    heroImageUrl: string | null
    status: string
    campaignDeadline: string
    productionDurationDays: number
    estimatedDeliveryDate: string
    groupName: string
    location: string
    productCount: number
    currentFundingAmountIdr: number
    minimumFundingTargetIdr: number
    currentOrderQuantity: number
    minimumOrderQuantity: number
  }
  metrics: {
    orderCount: number
    fundingPercentage: number
    plannedCostIdr: number
    actualCostIdr: number
    varianceIdr: number
    overBudget: boolean
    remainingBalanceIdr: number
    estimatedProfitIdr: number
  }
  orders: DashboardOrder[]
  milestones: DashboardMilestone[]
  assignments: DashboardAssignment[]
  costItems: DashboardCostItem[]
}

export type DashboardResponse =
  | { hasCampaign: false }
  | ({ hasCampaign: true } & DashboardData)
