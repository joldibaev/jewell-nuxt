import type { CatalogOption, CatalogOptions } from '../../shared/types/catalog'

export default defineEventHandler(async (event): Promise<CatalogOptions> => {
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
    return items
  }
  const [categories, collections, brands, gems, materials] = await Promise.all([
    options('categories', true), options('collections', true),
    options('brands'), options('gems'), options('materials'),
  ])
  return { categories, collections, brands, gems, materials }
})
