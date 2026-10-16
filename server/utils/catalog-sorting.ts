export type CatalogSortMode = 'По алфавиту' | 'Вручную'

export interface CatalogSortableProduct {
  documentId: string
  name: string
  catalogSortPosition?: number | null
  catalogSortGroup?: { documentId: string; sortOrder: number; sortMode: CatalogSortMode } | null
}

// Явные группы идут первыми по заданному порядку; товары без группы сохраняют штатный порядок Strapi.
export function sortCatalogProducts<T extends CatalogSortableProduct>(products: T[]): T[] {
  const groups = new Map<string, { order: number; mode: CatalogSortMode; products: T[] }>()
  const ungrouped: T[] = []
  for (const product of products) {
    const group = product.catalogSortGroup
    if (!group) {
      ungrouped.push(product)
      continue
    }
    const entry = groups.get(group.documentId) ?? { order: group.sortOrder, mode: group.sortMode, products: [] }
    entry.products.push(product)
    groups.set(group.documentId, entry)
  }
  const orderedGroups = [...groups.values()].sort((a, b) => a.order - b.order)
  for (const group of orderedGroups) {
    if (group.mode === 'По алфавиту') {
      group.products.sort((a, b) => a.name.localeCompare(b.name, 'ru', { sensitivity: 'base', numeric: true }) || a.documentId.localeCompare(b.documentId))
    } else {
      group.products.sort((a, b) => (a.catalogSortPosition ?? 0) - (b.catalogSortPosition ?? 0) || a.documentId.localeCompare(b.documentId))
    }
  }
  return [...orderedGroups.flatMap(group => group.products), ...ungrouped]
}
