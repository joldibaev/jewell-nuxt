import type { CatalogOption, HomeResponse, Media, ProductCard } from '../../shared/types/catalog'

interface HomeDocument {
  banners: (Media & { id: number })[]
  bannerFrames?: unknown
  categories: CatalogOption[]
  collections: CatalogOption[]
}
export default defineCachedEventHandler(async (event): Promise<HomeResponse> => {
  const locale = requestLocale(event)
  const [home, bestsellers, inStock] = await Promise.all([
    strapiGet<HomeDocument | null>(event, 'home-page', {
      populate: {
        banners: { fields: ['url', 'alternativeText', 'width', 'height'] },
        categories: { fields: ['name', 'slug'], populate: { image: { fields: ['url', 'alternativeText', 'width', 'height'] } } },
        collections: { fields: ['name', 'slug'], populate: { image: { fields: ['url', 'alternativeText', 'width', 'height'] } } },
      },
    }),
    // Выбор бестселлеров читаем в том же режиме, что показывает админка (draft): это единственные связи, которые редактор видит и меняет.
    // Сами карточки берём из опубликованных товаров по documentId.
    strapiGet<{ products: { documentId: string }[] } | null>(event, 'bestseller', {
      status: 'draft',
      populate: { products: { fields: ['documentId'] } },
    }),
    strapiGet<ProductCard[]>(event, 'products', {
      ...productCardQuery, status: 'published', filters: { inStock: { $eq: true } }, sort: ['createdAt:desc', 'id:desc'],
      pagination: { page: 1, pageSize: 4 },
    }),
  ])
  const categories = (home.data?.categories || []).map(item => normalizeOption(event, item))
  const collections = (home.data?.collections || []).map(item => normalizeOption(event, item))
  const inStockProducts = inStock.data.map(product => normalizeProduct(event, product))
  await Promise.all([
    translateNames(event, 'categories', locale, categories),
    translateNames(event, 'collections', locale, collections),
    translateProducts(event, locale, inStockProducts),
  ])
  return {
    banners: (home.data?.banners || []).map(media => ({ ...normalizeMedia(event, media), frames: normalizeBannerFrames(home.data?.bannerFrames, media.id) })),
    categories,
    collections,
    bestsellers: await publishedProductsByIds(event, (bestsellers.data?.products || []).map(product => product.documentId), locale),
    inStock: inStockProducts,
  }
}, apiCache)
