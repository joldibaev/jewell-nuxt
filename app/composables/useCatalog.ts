import type { CatalogFilters, CatalogResponse, ProductCard } from '#shared/types/catalog'
import { catalogQuery, filtersFromQuery } from '#shared/utils/catalog'

// Каталог с догрузкой: первая страница приходит с SSR, следующие добавляются кнопкой «Показать ещё».
// Фильтры и сортировка живут в URL, номер страницы — нет: ссылку можно отправить, а «Назад» не ломает список.
export async function useCatalog() {
  const route = useRoute()
  const router = useRouter()

  const filters = computed(() => filtersFromQuery(route.query))
  const query = computed(() => {
    const { page: _page, ...rest } = route.query
    return rest
  })

  // useState до первого await: после него в обычной функции теряется контекст Nuxt.
  const cache = useState<Record<string, { items: ProductCard[]; pagination: CatalogResponse['pagination'] }>>('catalog-cache', () => ({}))

  // Ждём оба запроса: первая страница товаров и варианты фильтров должны попасть в серверный HTML.
  const [options, first] = await Promise.all([
    useFetch('/api/catalog-options'),
    useFetch<CatalogResponse>('/api/catalog', { query }),
  ])

  // Догруженный список запоминается по набору фильтров: при возврате «Назад» с товара каталог восстанавливается
  // сразу целиком (и скролл встаёт на место), а не с первой страницы. Храним последние несколько наборов.
  const key = computed(() => JSON.stringify(query.value))
  const cached = cache.value[key.value]

  const initial = cached ?? (first.data.value ? { items: first.data.value.products, pagination: first.data.value.pagination } : undefined)
  const items = ref<ProductCard[]>(initial?.items ?? [])
  const pagination = ref(initial?.pagination)
  const loadingMore = ref(false)
  const loadMoreError = ref(false)

  function remember() {
    if (!pagination.value) return
    const next = { ...cache.value, [key.value]: { items: items.value, pagination: pagination.value } }
    const keys = Object.keys(next)
    for (const old of keys.slice(0, Math.max(0, keys.length - 5))) delete next[old]
    cache.value = next
  }

  // Смена фильтров приносит новую первую страницу и заменяет список.
  // Повторный запрос с теми же фильтрами (например, при возврате на страницу) не должен затирать догруженный список.
  let lastKey = key.value
  watch(first.data, (data) => {
    if (key.value === lastKey && items.value.length) return
    lastKey = key.value
    items.value = data?.products ?? []
    pagination.value = data?.pagination
    loadMoreError.value = false
    remember()
  })

  const hasMore = computed(() => !!pagination.value && pagination.value.page < pagination.value.pageCount)

  async function loadMore() {
    if (!pagination.value || loadingMore.value || !hasMore.value) return
    loadingMore.value = true
    loadMoreError.value = false
    try {
      const next = await $fetch<CatalogResponse>('/api/catalog', {
        query: { ...query.value, page: pagination.value.page + 1 },
      })
      const known = new Set(items.value.map(p => p.documentId))
      items.value = [...items.value, ...next.products.filter(p => !known.has(p.documentId))]
      pagination.value = next.pagination
      remember()
    } catch {
      loadMoreError.value = true
    } finally {
      loadingMore.value = false
    }
  }

  function applyFilters(next: CatalogFilters) {
    return router.push({ path: '/catalogs', query: catalogQuery({ ...next, page: 1 }) })
  }
  function resetFilters() {
    return router.push({ path: '/catalogs' })
  }

  return {
    filters, options, items, pagination, hasMore, loadMore, loadingMore, loadMoreError,
    status: first.status, error: first.error, refresh: first.refresh,
    applyFilters, resetFilters,
  }
}
