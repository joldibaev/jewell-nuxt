import type { ProductCard } from '../../shared/types/catalog'

const DOCUMENT_ID = /^[a-z0-9]{8,40}$/i

// Избранное лежит в браузере; сервер только отдаёт карточки по списку documentId (?ids=a,b,c).
export default defineEventHandler(async (event): Promise<ProductCard[]> => {
  const raw = getQuery(event).ids
  const ids = typeof raw === 'string' && raw ? raw.split(',') : []
  if (ids.length > MAX_PRODUCT_IDS || !ids.every(id => DOCUMENT_ID.test(id))) {
    throw createError({ statusCode: 400, statusMessage: 'Некорректный список избранного' })
  }
  if (!ids.length) return []

  return publishedProductsByIds(event, ids)
})
