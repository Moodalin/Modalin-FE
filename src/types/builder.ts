export type BuilderNumber = number | ''

export type CostCategory = 'MATERIAL' | 'LABOUR' | 'PACKAGING' | 'TRANSPORT' | 'OTHER' | 'RESERVE'

export interface BuilderProductDraft {
  id: string
  name: string
  productType: string
  description: string
  priceIdr: BuilderNumber
  image: File | null
}

export interface BuilderCostDraft {
  id: string
  category: CostCategory | ''
  name: string
  plannedTotalIdr: BuilderNumber
}

export interface BuilderDraft {
  collectionName: string
  story: string
  motifStory: string
  productionWeeks: BuilderNumber
  minimumFundingTargetIdr: BuilderNumber
  minimumOrderQuantity: BuilderNumber
  products: BuilderProductDraft[]
  costs: BuilderCostDraft[]
  designImage: File | null
  confirmed: boolean
}

export interface CreateCampaignInput {
  title: string
  description: string
  motifStory: string
  productionDurationDays: number
  minimumFundingTargetIdr: number
  minimumOrderQuantity: number
  products: Array<{
    name: string
    productType: string
    description: string
    priceIdr: number
  }>
  costs: Array<{
    category: CostCategory
    name: string
    plannedTotalIdr: number
  }>
}

export interface CreateCampaignResult {
  id: string
  slug: string
}
