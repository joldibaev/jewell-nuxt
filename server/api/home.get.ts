import type { CatalogOption, HomeResponse, Media, ProductCard } from '../../shared/types/catalog'

interface HomeDocument {
  banners: Media[]
  categories: CatalogOption[]
  collections: CatalogOption[]
}
export default defineEventHandler(async (event): Promise<HomeResponse> => {
  const [home, bestsellers, inStock] = await Promise.all([
    strapiGet<HomeDocument | null>(event, 'home-page', {
      populate: {
        banners: { fields: ['url', 'alternativeText', 'width', 'height'] },
        categories: { fields: ['name', 'slug'], populate: { image: { fields: ['url', 'alternativeText', 'width', 'height'] } } },
        collections: { fields: ['name', 'slug'], populate: { image: { fields: ['url', 'alternativeText', 'width', 'height'] } } },
      },
    }),
    // Выбор бестселлеров читаем в том же режиме, что показывает админка (draft): это единственные связи, которые редактор видит и меняет.
    // Сами карточки берём из опубликованных товаров по documentId.
    strapiGet<{ products: { documentId: string }[] } | null>(event, 'bestseller', {
      status: 'draft',
      populate: { products: { fields: ['documentId'] } },
    }),
    strapiGet<ProductCard[]>(event, 'products', {
      ...productCardQuery, status: 'published', filters: { inStock: { $eq: true } }, sort: ['createdAt:desc', 'id:desc'],
      pagination: { page: 1, pageSize: 4 },
    }),
  ])
  return {
    banners: (home.data?.banners || []).map(media => normalizeMedia(event, media)),
    categories: (home.data?.categories || []).map(item => normalizeOption(event, item)),
    collections: (home.data?.collections || []).map(item => normalizeOption(event, item)),
    bestsellers: await publishedProductsByIds(event, (bestsellers.data?.products || []).map(product => product.documentId)),
    inStock: inStock.data.map(product => normalizeProduct(event, product)),
  }
})
