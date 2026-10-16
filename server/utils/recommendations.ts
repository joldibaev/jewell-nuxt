import type { ProductCard } from '../../shared/types/catalog'

// Только чистые функции без Nuxt-API: модуль проверяется юнит-тестами напрямую (tests/recommendations.test.mjs).

type Ref = { documentId: string } | null | undefined

export interface RecommendationSource extends ProductCard {
  categories?: Ref[] | null
  collection?: Ref
  brand?: (ProductCard['brand'] & { documentId?: string }) | null
  materials?: Ref[] | null
  gems?: { gem?: Ref }[] | null
}

export const RECOMMENDATION_LIMIT = 8
// Сколько автоматических товаров одной категории подряд допустимо, чтобы к кольцу подобрались и серьги, и колье.
const PER_CATEGORY_LIMIT = 3

const WEIGHTS = {
  collection: 5,
  category: 4,
  brand: 3,
  material: 2,
  gem: 2,
  priceClose: 3, // цена отличается не больше чем на 30%
  priceNear: 1, // не больше чем на 60%
  inStock: 2,
}

function ids(refs: Ref[] | null | undefined): Set<string> {
  return new Set((refs ?? []).flatMap(ref => (ref?.documentId ? [ref.documentId] : [])))
}
function gemIds(product: RecommendationSource): Set<string> {
  return ids((product.gems ?? []).map(item => item.gem))
}
function overlap(a: Set<string>, b: Set<string>): number {
  let count = 0
  for (const id of a) if (b.has(id)) count++
  return count
}
function price(product: ProductCard): number | null {
  const value = Number(product.priceUzs)
  return Number.isFinite(value) && value > 0 ? value : null
}
// Относительная разница цен: 0 — одинаковые, 0.3 — на 30% от большей. Нет цены — бесконечность.
function priceGap(a: ProductCard, b: ProductCard): number {
  const pa = price(a)
  const pb = price(b)
  return pa === null || pb === null ? Infinity : Math.abs(pa - pb) / Math.max(pa, pb)
}

export function similarityScore(base: RecommendationSource, candidate: RecommendationSource): number {
  let score = 0
  const collection = base.collection?.documentId
  if (collection && candidate.collection?.documentId === collection) score += WEIGHTS.collection
  const brand = base.brand?.documentId
  if (brand && candidate.brand?.documentId === brand) score += WEIGHTS.brand
  score += WEIGHTS.category * overlap(ids(base.categories), ids(candidate.categories))
  score += WEIGHTS.material * overlap(ids(base.materials), ids(candidate.materials))
  score += WEIGHTS.gem * overlap(gemIds(base), gemIds(candidate))
  const gap = priceGap(base, candidate)
  if (gap <= 0.3) score += WEIGHTS.priceClose
  else if (gap <= 0.6) score += WEIGHTS.priceNear
  if (candidate.inStock) score += WEIGHTS.inStock
  return score
}

// Ручной выбор из Strapi идёт первым в заданном порядке, оставшиеся места заполняются самыми похожими товарами.
export function pickRecommendations(
  base: RecommendationSource,
  manual: ProductCard[],
  candidates: RecommendationSource[],
  limit = RECOMMENDATION_LIMIT,
): ProductCard[] {
  const used = new Set([base.documentId])
  const result: ProductCard[] = []
  for (const product of manual) {
    if (result.length >= limit) break
    if (used.has(product.documentId)) continue
    used.add(product.documentId)
    result.push(product)
  }

  const ranked = candidates
    .filter(product => !used.has(product.documentId))
    .map(product => ({ product, score: similarityScore(base, product), gap: priceGap(base, product) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.gap - b.gap)

  // Первый проход соблюдает лимит на категорию; если похожих товаров мало, второй добирает пропущенные.
  const perCategory = new Map<string, number>()
  const skipped: RecommendationSource[] = []
  for (const { product } of ranked) {
    if (result.length >= limit) break
    if (used.has(product.documentId)) continue
    const category = product.categories?.[0]?.documentId
    const count = category ? perCategory.get(category) ?? 0 : 0
    if (category && count >= PER_CATEGORY_LIMIT) {
      skipped.push(product)
      continue
    }
    if (category) perCategory.set(category, count + 1)
    used.add(product.documentId)
    result.push(product)
  }
  for (const product of skipped) {
    if (result.length >= limit) break
    used.add(product.documentId)
    result.push(product)
  }
  return result
}

// Чистый ProductCard без полей, нужных только для подсчёта сходства: они не должны уходить клиенту.
export function toProductCard(product: RecommendationSource): ProductCard {
  const { documentId, name, slug, priceUzs, inStock, previewPosition, gallery, galleryFrames, brand } = product
  return { documentId, name, slug, priceUzs, inStock, previewPosition, gallery, ...(galleryFrames == null ? {} : { galleryFrames }), brand: brand ? { name: brand.name } : brand }
}
