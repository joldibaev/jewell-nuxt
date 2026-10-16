import type { H3Event } from 'h3'
import type { ProductCard } from '../../shared/types/catalog'
import { orderLetterVariants } from './letter-order'
import { strapiGet, apiCache, type StrapiQuery } from './strapi'

// Лёгкий индекс без фотографий кешируется для всех страниц одного набора фильтров.
// Сортировка внутри страницы не годится: буква A может находиться на следующей странице Strapi.
const catalogOrder = defineCachedFunction(async (event: H3Event, query: StrapiQuery) => {
  const products: Pick<ProductCard, 'documentId' | 'name'>[] = []
  let page = 1
  let pageCount = 1
  do {
    const response = await strapiGet<Pick<ProductCard, 'documentId' | 'name'>[]>(event, 'products', {
      status: query.status, filters: query.filters, sort: query.sort,
      fields: ['name'], pagination: { page, pageSize: 100, withCount: true },
    })
    if (!response.meta.pagination) {
      throw createError({ statusCode: 502, statusMessage: 'Invalid catalog response' })
    }
    products.push(...response.data)
    pageCount = response.meta.pagination.pageCount
    page++
  } while (page <= pageCount)
  return orderLetterVariants(products).map(product => product.documentId)
}, {
  ...apiCache,
  name: 'catalog-letter-order',
  getKey: (_event: H3Event, query: StrapiQuery) => JSON.stringify([query.status, query.filters, query.sort]),
})

export async function letterOrderedCatalog(event: H3Event, query: StrapiQuery, page: number) {
  const ids = await catalogOrder(event, query)
  const pageSize = 20
  const selected = ids.slice((page - 1) * pageSize, page * pageSize)
  const pagination = { page, pageSize, pageCount: Math.ceil(ids.length / pageSize), total: ids.length }
  if (!selected.length) return { data: [] as ProductCard[], meta: { pagination } }
  const response = await strapiGet<ProductCard[]>(event, 'products', {
    ...query,
    filters: { $and: [query.filters as StrapiQuery, { documentId: { $in: selected } }] },
    pagination: { page: 1, pageSize },
  })
  const byId = new Map(response.data.map(product => [product.documentId, product]))
  return { data: selected.flatMap(id => byId.get(id) ?? []), meta: { pagination } }
}
