import type { H3Event } from 'h3'
import type { ProductCard, ProductDetail } from '../../../shared/types/catalog'
import type { RecommendationSource } from '../../utils/recommendations'
import type { StrapiQuery } from '../../utils/strapi'

type RawProduct = Omit<ProductDetail, 'related'> & { relatedProducts?: ProductCard[] }

const similarityPopulate = {
  categories: { fields: ['name'] },
  collection: { fields: ['name'] },
  materials: { fields: ['name'] },
  gems: { populate: { gem: { fields: ['name'] } } },
}

// Кандидаты для автоподбора: товары той же категории, коллекции или бренда. Баллы считает pickRecommendations.
async function fetchCandidates(event: H3Event, product: RecommendationSource): Promise<RecommendationSource[]> {
  const or: StrapiQuery[] = []
  const categories = (product.categories ?? []).flatMap(item => (item?.documentId ? [item.documentId] : []))
  if (categories.length) or.push({ categories: { documentId: { $in: categories } } })
  if (product.collection?.documentId) or.push({ collection: { documentId: { $eq: product.collection.documentId } } })
  if (product.brand?.documentId) or.push({ brand: { documentId: { $eq: product.brand.documentId } } })
  if (!or.length) return []
  try {
    const response = await strapiGet<RecommendationSource[]>(event, 'products', {
      status: 'published',
      filters: { documentId: { $ne: product.documentId }, $or: or },
      fields: productCardQuery.fields,
      populate: { ...(productCardQuery.populate as StrapiQuery), ...similarityPopulate },
      sort: ['createdAt:desc', 'id:desc'],
      pagination: { page: 1, pageSize: 100 },
    })
    return response.data ?? []
  } catch (error) {
    // Автоподбор необязателен: без него страница товара всё равно открывается с ручными рекомендациями.
    console.error('[products] recommendation candidates are unavailable', (error as { statusCode?: number }).statusCode)
    return []
  }
}

export default defineCachedEventHandler(async (event): Promise<ProductDetail> => {
  const slug = getRouterParam(event, 'slug') ?? ''
  if (!/^[a-zA-Z0-9-]{1,200}$/.test(slug)) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }

  const response = await strapiGet<RawProduct[]>(event, 'products', {
    status: 'published',
    filters: { slug: { $eq: slug } },
    fields: ['name', 'slug', 'description', 'code', 'priceUzs', 'inStock', 'weight', 'lengthMin', 'lengthMax', 'previewPosition'],
    populate: {
      gallery: { fields: ['url', 'alternativeText', 'width', 'height'] },
      brand: { fields: ['name'] },
      ...similarityPopulate,
      relatedProducts: productCardQuery,
    },
    pagination: { page: 1, pageSize: 1 },
  })
  const found = response.data[0]
  if (!found) throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  // Связи могут прийти пустыми или отсутствовать: интерфейс всегда получает массивы.
  const raw: RawProduct = {
    ...found,
    gallery: found.gallery ?? [],
    categories: found.categories ?? [],
    materials: found.materials ?? [],
    gems: found.gems ?? [],
    collection: found.collection ?? null,
    brand: found.brand ?? null,
  }

  const { relatedProducts: manual, ...product } = raw
  const candidates = await fetchCandidates(event, product)
  // Сначала товары из поля «Рекомендуемые товары» в заданном порядке, затем автоподбор по сходству до 8 штук.
  const related = pickRecommendations(product, manual ?? [], candidates)
  return {
    ...normalizeProduct(event, product),
    related: related.map(item => normalizeProduct(event, toProductCard(item))),
  } as ProductDetail
}, apiCache)
