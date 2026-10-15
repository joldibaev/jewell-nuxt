import type { CatalogOption, HomeResponse, Media, ProductCard } from '../../shared/types/catalog'

interface HomeDocument {
  banners: Media[]
  categories: CatalogOption[]
  collections: CatalogOption[]
}
export default defineEventHandler(async (event): Promise<HomeResponse> => {
  const [home, bestsellers, inStock] = await Promise.all([
    strapiGet<HomeDocument | null>(event, 'home-page', {
      populate: {
        banners: { fields: ['url', 'alternativeText', 'width', 'height'] },
        categories: { fields: ['name', 'slug'], populate: { image: { fields: ['url', 'alternativeText', 'width', 'height'] } } },
        collections: { fields: ['name', 'slug'], populate: { image: { fields: ['url', 'alternativeText', 'width', 'height'] } } },
      },
    }),
    strapiGet<{ products: ProductCard[] } | null>(event, 'bestseller', {
      populate: { products: productCardQuery },
    }),
    strapiGet<ProductCard[]>(event, 'products', {
      ...productCardQuery, status: 'published', filters: { inStock: { $eq: true } }, sort: ['createdAt:desc', 'id:desc'],
      pagination: { page: 1, pageSize: 4 },
    }),
  ])
  return {
    banners: (home.data?.banners || []).map(media => normalizeMedia(event, media)),
    categories: (home.data?.categories || []).map(item => normalizeOption(event, item)),
    collections: (home.data?.collections || []).map(item => normalizeOption(event, item)),
    bestsellers: (bestsellers.data?.products || []).map(product => normalizeProduct(event, product)),
    inStock: inStock.data.map(product => normalizeProduct(event, product)),
  }
})
