<script setup lang="ts">
import type { CatalogSort } from '#shared/types/catalog'

const { t } = useI18n()
const localePath = useLocalePath()
const origin = useRequestURL().origin
useSeoMeta({ title: () => t('common.catalog'), description: () => t('seo.catalogDescription') })
useHead(() => ({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t('common.home'), item: origin + localePath('/') },
        { '@type': 'ListItem', position: 2, name: t('common.catalog'), item: origin + localePath('/catalogs') },
      ],
    }),
  }],
}))

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
    <nav :aria-label="t('common.breadcrumbs')" class="mb-4 text-sm text-muted">
      <ol class="flex gap-2">
        <li><NuxtLinkLocale to="/" class="hover:text-gold-dark">{{ t('common.home') }}</NuxtLinkLocale></li>
        <li aria-hidden="true">/</li>
        <li aria-current="page">{{ t('common.catalog') }}</li>
      </ol>
    </nav>

    <h1 class="mb-6 text-4xl">{{ t('common.catalog') }}</h1>

    <div class="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)]">
      <aside class="hidden lg:block">
        <div class="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-3 [scrollbar-color:var(--color-stone-300)_transparent] [scrollbar-width:thin]">
          <p v-if="options.error.value" role="alert" class="mb-4 text-sm text-red-700">{{ t('catalog.optionsError') }}</p>
          <CatalogFilters :options="options.data.value" @apply="applyFilters" @reset="resetFilters()" />
        </div>
      </aside>

      <section :aria-label="t('catalog.products')">
        <CatalogToolbar v-model:sort="sort" :total="pagination?.total" @open-filters="filterDrawer?.open()" />

        <StatusMessage v-if="error && !items.length" kind="error">
          {{ error.statusCode === 400 ? t('catalog.badFilters') : t('catalog.loadError') }}
          <template #actions>
            <button type="button" class="btn" @click="refresh()">{{ t('common.retry') }}</button>
            <button v-if="error.statusCode === 400" type="button" class="btn" @click="resetFilters()">{{ t('catalog.resetFilters') }}</button>
          </template>
        </StatusMessage>
        <StatusMessage v-else-if="status === 'pending' && !items.length" kind="loading" />
        <StatusMessage v-else-if="!items.length" kind="empty">
          {{ t('catalog.empty') }}
          <template #actions><button type="button" class="btn" @click="resetFilters()">{{ t('catalog.resetFilters') }}</button></template>
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
    <SideDrawer ref="filterDrawer" :label="t('catalog.filters')" side="left" class="lg:hidden">
      <template #default="{ close }">
        <DrawerHeader :close-label="t('catalog.closeFilters')" @close="close"><h2 class="text-2xl">{{ t('catalog.filters') }}</h2></DrawerHeader>
        <div class="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <CatalogFilters :options="options.data.value" @apply="applyFilters" @reset="resetFilters()" />
        </div>
        <div class="shrink-0 border-t border-stone-100 p-4">
          <button type="button" class="btn w-full" @click="close">
            {{ pagination ? t('catalog.showProductsCount', { count: pagination.total }) : t('catalog.showProducts') }}
          </button>
        </div>
      </template>
    </SideDrawer>
  </div>
</template>
