export interface Media {
  url: string
  alternativeText: string | null
  width?: number
  height?: number
}
export interface CatalogOption {
  documentId: string
  name: string
  slug?: string
  image?: Media | null
}
export type PreviewPosition = 'Сверху' | 'По центру' | 'Снизу'
export interface ProductCard {
  documentId: string
  name: string
  slug: string | null
  priceUzs: string | number
  inStock: boolean
  previewPosition: PreviewPosition | null
  gallery: Media[]
  brand?: { documentId?: string; name: string } | null
}
export interface Pagination {
  page: number
  pageSize: number
  pageCount: number
  total: number
}
export interface CatalogResponse {
  products: ProductCard[]
  pagination: Pagination
}
export interface CatalogOptions {
  categories: CatalogOption[]
  collections: CatalogOption[]
  brands: CatalogOption[]
  gems: CatalogOption[]
  materials: CatalogOption[]
}
export type CatalogSort = 'newest' | 'price-asc' | 'price-desc'
export interface CatalogFilters {
  categories: string[]
  collections: string[]
  brands: string[]
  gems: string[]
  materials: string[]
  search: string
  stock: 'all' | 'yes' | 'no'
  minPrice?: number
  maxPrice?: number
  sort: CatalogSort
  page: number
}
export interface SiteSettings {
  phone: string | null
  email: string | null
  address: string | null
  instagramUrl: string | null
  telegramUrl: string | null
  whatsappUrl: string | null
  facebookUrl: string | null
  mapEmbedUrl: string | null
  productNote: string | null
  workingHours: string | null
  legalDetails: string | null
  storePhotos: Media[]
}
export interface AboutPartner {
  name: string
  description: string | null
  image: Media | null
  linkLabel: string | null
  linkUrl: string | null
}
export interface AboutPage {
  heading: string | null
  text: string | null
  image: Media | null
  partners: AboutPartner[]
}
export interface HomeResponse {
  banners: Media[]
  categories: CatalogOption[]
  collections: CatalogOption[]
  bestsellers: ProductCard[]
  inStock: ProductCard[]
}

export interface GemCount {
  count: number
  gem: { documentId: string; name: string } | null
}
export interface ProductDetail extends ProductCard {
  description: string | null
  code: string | null
  weight: number | string | null
  lengthMin: number | null
  lengthMax: number | null
  categories: { documentId: string; name: string }[]
  collection: { documentId: string; name: string } | null
  materials: { documentId: string; name: string }[]
  gems: GemCount[]
  related: ProductCard[]
}
