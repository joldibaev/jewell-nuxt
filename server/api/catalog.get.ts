import type { CatalogResponse, ProductCard } from '../../shared/types/catalog'

export default defineCachedEventHandler(async (event): Promise<CatalogResponse> => {
  const filters = parseCatalogQuery(getQuery(event))
  const locale = requestLocale(event)
  const translatedMatches = await translatedSearchIds(event, locale, filters.search)
  const response = await strapiGet<ProductCard[]>(event, 'products', buildCatalogQuery(filters, translatedMatches))
  if (!response.meta.pagination) {
    throw createError({ statusCode: 502, statusMessage: 'Invalid catalog response' })
  }
  const products = response.data.map(product => normalizeProduct(event, product))
  await translateProducts(event, locale, products)
  return {
    products,
    pagination: response.meta.pagination,
  }
}, { ...apiCache, getKey: event => JSON.stringify([requestLocale(event), parseCatalogQuery(getQuery(event))]) })
