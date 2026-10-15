import type { CatalogResponse, ProductCard } from '../../shared/types/catalog'

export default defineCachedEventHandler(async (event): Promise<CatalogResponse> => {
  const filters = parseCatalogQuery(getQuery(event))
  const response = await strapiGet<ProductCard[]>(event, 'products', buildCatalogQuery(filters))
  if (!response.meta.pagination) {
    throw createError({ statusCode: 502, statusMessage: 'Invalid catalog response' })
  }
  return {
    products: response.data.map(product => normalizeProduct(event, product)),
    pagination: response.meta.pagination,
  }
}, { ...apiCache, getKey: event => JSON.stringify(parseCatalogQuery(getQuery(event))) })
