<script setup lang="ts">
import type { CatalogSort } from '#shared/types/catalog'

useSeoMeta({ title: 'Каталог', description: 'Каталог ювелирных украшений JeWell: фильтры по типу, коллекции, камням, бренду и цене.' })
useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Главная', item: '/' },
        { '@type': 'ListItem', position: 2, name: 'Каталог', item: '/catalogs' },
      ],
    }),
  }],
})

const {
  filters, options, items, pagination, hasMore, loadMore, loadingMore, loadMoreError,
  status, error, refresh, applyFilters, resetFilters,
} = await useCatalog()

const filterDrawer = ref<{ open: () => void }>()
const sort = computed({
  get: () => filters.value.sort,
  set: (value: CatalogSort) => { applyFilters({ ...filters.value, sort: value }) },
})
const refreshing = computed(() => status.value === 'pending' && items.value.length > 0)
</script>

<template>
  <div>
    <nav aria-label="Хлебные крошки" class="mb-4 text-sm text-muted">
      <ol class="flex gap-2">
        <li><NuxtLink to="/" class="hover:text-gold-dark">Главная</NuxtLink></li>
        <li aria-hidden="true">/</li>
        <li aria-current="page">Каталог</li>
      </ol>
    </nav>

    <h1 class="mb-6 text-4xl">Каталог</h1>

    <div class="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)]">
      <aside class="hidden lg:block">
        <div class="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-3 [scrollbar-color:var(--color-stone-300)_transparent] [scrollbar-width:thin]">
          <p v-if="options.error.value" role="alert" class="mb-4 text-sm text-red-700">Не удалось загрузить варианты фильтров.</p>
          <CatalogFilters :options="options.data.value" @apply="applyFilters" @reset="resetFilters()" />
        </div>
      </aside>

      <section aria-label="Товары">
        <CatalogToolbar v-model:sort="sort" :total="pagination?.total" @open-filters="filterDrawer?.open()" />

        <StatusMessage v-if="error && !items.length" kind="error">
          {{ error.statusCode === 400 ? 'Проверьте параметры фильтров в адресе страницы.' : 'Не удалось загрузить каталог.' }}
          <template #actions>
            <button type="button" class="btn" @click="refresh()">Повторить</button>
            <button v-if="error.statusCode === 400" type="button" class="btn" @click="resetFilters()">Сбросить фильтры</button>
          </template>
        </StatusMessage>
        <StatusMessage v-else-if="status === 'pending' && !items.length" kind="loading" />
        <StatusMessage v-else-if="!items.length" kind="empty">
          По вашему запросу ничего не найдено.
          <template #actions><button type="button" class="btn" @click="resetFilters()">Сбросить фильтры</button></template>
        </StatusMessage>

        <template v-else>
          <ProductGrid :products="items" :columns="3" :busy="refreshing" />
          <LoadMoreButton
            v-if="hasMore && pagination"
            :loading="loadingMore"
            :failed="loadMoreError"
            :shown="items.length"
            :total="pagination.total"
            @load="loadMore()"
          />
        </template>
      </section>
    </div>

    <!-- Фильтры на телефоне: та же форма в боковой панели; содержимое создаётся при первом открытии. -->
    <SideDrawer ref="filterDrawer" label="Фильтры" side="left" class="lg:hidden">
      <template #default="{ close }">
        <DrawerHeader close-label="Закрыть фильтры" @close="close"><h2 class="text-2xl">Фильтры</h2></DrawerHeader>
        <div class="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <CatalogFilters :options="options.data.value" @apply="applyFilters" @reset="resetFilters()" />
        </div>
        <div class="shrink-0 border-t border-stone-100 p-4">
          <button type="button" class="btn w-full" @click="close">
            {{ pagination ? `Показать товары (${pagination.total})` : 'Показать товары' }}
          </button>
        </div>
      </template>
    </SideDrawer>
  </div>
</template>
