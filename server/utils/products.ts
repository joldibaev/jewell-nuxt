import type { H3Event } from 'h3'
import type { ProductCard } from '../../shared/types/catalog'

export const MAX_PRODUCT_IDS = 100

// Карточки опубликованных товаров по списку documentId, в порядке списка.
// Снятые с публикации и удалённые товары просто выпадают: подстановок нет.
export async function publishedProductsByIds(event: H3Event, ids: string[]): Promise<ProductCard[]> {
  const unique = [...new Set(ids)].slice(0, MAX_PRODUCT_IDS)
  if (!unique.length) return []
  const response = await strapiGet<ProductCard[]>(event, 'products', {
    ...productCardQuery,
    status: 'published',
    filters: { documentId: { $in: unique } },
    pagination: { page: 1, pageSize: MAX_PRODUCT_IDS },
  })
  const byId = new Map(response.data.map(product => [product.documentId, product]))
  return unique.flatMap(id => byId.get(id) ?? []).map(product => normalizeProduct(event, product))
}
