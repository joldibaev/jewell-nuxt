import type { H3Event } from 'h3'
import type { CatalogFilters } from '../../shared/types/catalog'
import { emptyCatalogFilters } from '../../shared/utils/catalog'
import { DEFAULT_LOCALE, type Locale } from '../../shared/utils/locale'
import { strapiGet, type StrapiQuery } from './strapi'

export function parseCatalogQuery(query: Record<string, unknown>): CatalogFilters {
  const result = emptyCatalogFilters()
  const allowed = new Set([...Object.keys(result), 'minPrice', 'maxPrice', 'locale'])
  const invalid = (message: string): never => {
    throw createError({ statusCode: 400, statusMessage: message })
  }
  for (const key of Object.keys(query)) {
    if (!allowed.has(key)) invalid('Unknown catalog parameter')
  }
  const scalar = (key: string): string | undefined => {
    const value = query[key]
    if (value === undefined) return undefined
    if (typeof value !== 'string') return invalid('Expected a single value for ' + key)
    return value
  }
  for (const field of ['categories', 'collections', 'brands', 'gems', 'materials'] as const) {
    const value = query[field]
    if (value === undefined) continue
    const values = Array.isArray(value) ? value : [value]
    if (values.length > 50 || values.some(id => typeof id !== 'string' || !/^[a-zA-Z0-9]{1,64}$/.test(id))) {
      invalid('Invalid catalog identifiers')
    }
    result[field] = [...new Set(values as string[])]
  }
  const search = scalar('search')?.trim() || ''
  if (search.length > 200) invalid('Search is too long')
  result.search = search
  const stock = scalar('stock') || 'all'
  if (!['all', 'yes', 'no'].includes(stock)) invalid('Invalid stock filter')
  result.stock = stock as CatalogFilters['stock']
  const sort = scalar('sort') || 'newest'
  if (!['newest', 'price-asc', 'price-desc'].includes(sort)) invalid('Invalid catalog sort')
  result.sort = sort as CatalogFilters['sort']
  for (const field of ['minPrice', 'maxPrice', 'page'] as const) {
    const value = scalar(field)
    if (value === undefined) continue
    if (!/^\d+$/.test(value)) invalid('Invalid numeric catalog parameter')
    const number = Number(value)
    if (!Number.isSafeInteger(number) || (field === 'page' && (number < 1 || number > 10000))) {
      invalid('Catalog number is out of range')
    }
    result[field] = number
  }
  if (result.minPrice !== undefined && result.maxPrice !== undefined && result.minPrice > result.maxPrice) {
    invalid('Minimum price exceeds maximum price')
  }
  return result
}

// Поиск на en/uz: название и описание в каталоге русские, поэтому дополнительно ищем по переводам
// и добавляем найденные товары к условию поиска.
export async function translatedSearchIds(event: H3Event, locale: Locale, search: string): Promise<string[]> {
  if (locale === DEFAULT_LOCALE || !search) return []
  try {
    const response = await strapiGet<{ documentId: string }[]>(event, 'products', {
      locale, status: 'published', fields: ['name'],
      filters: { $or: [{ name: { $containsi: search } }, { description: { $containsi: search } }] },
      pagination: { page: 1, pageSize: 100 },
    })
    return response.data.map(item => item.documentId)
  } catch (error) {
    console.error('[i18n] translated search is unavailable', (error as { statusCode?: number }).statusCode)
    return []
  }
}

export function buildCatalogQuery(input: CatalogFilters, translatedMatches: string[] = []): StrapiQuery {
  const filters: StrapiQuery = {}
  for (const [key, relation] of [['categories', 'categories'], ['collections', 'collection'], ['brands', 'brand'], ['materials', 'materials']] as const) {
    if (input[key].length) filters[relation] = { documentId: { $in: input[key] } }
  }
  if (input.gems.length) filters.gems = { gem: { documentId: { $in: input.gems } } }
  if (input.stock !== 'all') filters.inStock = { $eq: input.stock === 'yes' }
  if (input.minPrice !== undefined || input.maxPrice !== undefined) {
    filters.priceUzs = { $gte: input.minPrice, $lte: input.maxPrice }
  }
  if (input.search) filters.$or = [
    { name: { $containsi: input.search } },
    { description: { $containsi: input.search } },
    ...(translatedMatches.length ? [{ documentId: { $in: translatedMatches } }] : []),
  ]
  const sort = input.sort === 'price-asc'
    ? ['priceUzs:asc', 'id:asc']
    : input.sort === 'price-desc'
      ? ['priceUzs:desc', 'id:desc']
      : ['createdAt:desc', 'id:desc']
  return {
    ...productCardQuery, status: 'published', filters, sort,
    pagination: { page: input.page, pageSize: 20, withCount: true },
  }
}
