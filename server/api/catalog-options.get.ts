import type { CatalogOption, CatalogOptions } from '../../shared/types/catalog'

export default defineCachedEventHandler(async (event): Promise<CatalogOptions> => {
  const locale = requestLocale(event)
  async function options(path: string, withImage = false): Promise<CatalogOption[]> {
    const items: CatalogOption[] = []
    let page = 1
    let pageCount = 1
    do {
      const response = await strapiGet<CatalogOption[]>(event, path, {
        fields: withImage ? ['name', 'slug'] : ['name'],
        ...(withImage ? { populate: { image: { fields: ['url', 'alternativeText', 'width', 'height'] } } } : {}),
        sort: ['name:asc', 'id:asc'],
        pagination: { page, pageSize: 100, withCount: true },
      })
      items.push(...response.data.map(item => normalizeOption(event, item)))
      pageCount = response.meta.pagination?.pageCount || 1
      page++
    } while (page <= pageCount)
    if (locale !== DEFAULT_LOCALE) {
      await translateNames(event, path, locale, items)
      items.sort((a, b) => a.name.localeCompare(b.name, locale))
    }
    return items
  }
  const [categories, collections, brands, gems, materials] = await Promise.all([
    options('categories', true), options('collections', true),
    options('brands'), options('gems'), options('materials'),
  ])
  return { categories, collections, brands, gems, materials }
}, apiCache)
