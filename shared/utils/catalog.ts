import type { CatalogFilters, Media } from '../types/catalog'

export function emptyCatalogFilters(): CatalogFilters {
  return {
    categories: [], collections: [], brands: [], gems: [], materials: [],
    search: '', stock: 'all', sort: 'newest', page: 1,
  }
}

// Omit defaults to keep shareable URLs short; repeated keys represent multi-selects.
export function catalogQuery(filters: CatalogFilters): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {}
  for (const field of ['categories', 'collections', 'brands', 'gems', 'materials'] as const) {
    if (filters[field].length) query[field] = [...new Set(filters[field])].sort()
  }
  if (filters.search.trim()) query.search = filters.search.trim()
  if (filters.stock !== 'all') query.stock = filters.stock
  if (filters.minPrice !== undefined) query.minPrice = String(filters.minPrice)
  if (filters.maxPrice !== undefined) query.maxPrice = String(filters.maxPrice)
  if (filters.sort !== 'newest') query.sort = filters.sort
  if (filters.page > 1) query.page = String(filters.page)
  return query
}

export function formatPrice(value: string | number): string {
  return new Intl.NumberFormat('ru-RU').format(Number(value))
}

// Мягкий разбор URL для интерфейса: неизвестное или битое значение превращается в значение по умолчанию.
// Строгую проверку выполняет сервер (parseCatalogQuery), здесь важна только устойчивость формы.
export function filtersFromQuery(query: Record<string, unknown>): CatalogFilters {
  const result = emptyCatalogFilters()
  const list = (value: unknown) => (Array.isArray(value) ? value : value ? [value] : []).map(String)
  for (const key of ['categories', 'collections', 'brands', 'gems', 'materials'] as const) result[key] = list(query[key])
  result.search = typeof query.search === 'string' ? query.search : ''
  result.stock = query.stock === 'yes' || query.stock === 'no' ? query.stock : 'all'
  result.sort = query.sort === 'price-asc' || query.sort === 'price-desc' ? query.sort : 'newest'
  const num = (value: unknown) => (typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : undefined)
  result.minPrice = num(query.minPrice)
  result.maxPrice = num(query.maxPrice)
  return result
}
