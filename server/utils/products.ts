import type { H3Event } from 'h3'
import type { ProductCard } from '../../shared/types/catalog'
import { DEFAULT_LOCALE, type Locale } from '../../shared/utils/locale'
import { translateProducts } from './locale'

export const MAX_PRODUCT_IDS = 100

// Карточки опубликованных товаров по списку documentId, в порядке списка.
// Снятые с публикации и удалённые товары просто выпадают: подстановок нет.
export async function publishedProductsByIds(event: H3Event, ids: string[], locale: Locale = DEFAULT_LOCALE): Promise<ProductCard[]> {
  const unique = [...new Set(ids)].slice(0, MAX_PRODUCT_IDS)
  if (!unique.length) return []
  const response = await strapiGet<ProductCard[]>(event, 'products', {
    ...productCardQuery,
    status: 'published',
    filters: { documentId: { $in: unique } },
    pagination: { page: 1, pageSize: MAX_PRODUCT_IDS },
  })
  const byId = new Map(response.data.map(product => [product.documentId, product]))
  const products = unique.flatMap(id => byId.get(id) ?? []).map(product => normalizeProduct(event, product))
  await translateProducts(event, locale, products)
  return products
}
