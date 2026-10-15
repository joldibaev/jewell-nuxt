<script setup lang="ts">
const { t, locale } = useI18n()
useSeoMeta({ title: () => t('common.favorites'), robots: 'noindex' })

const favorites = useFavorites()
// Загружаем карточки один раз, когда список прочитан из браузера. Удаление на странице просто убирает карточку из показа.
const { data, error, execute: refresh } = useFetch('/api/favorites', {
  query: computed(() => ({ ids: favorites.ids.value.join(','), locale: locale.value })),
  server: false,
  immediate: false,
  watch: false,
})
watch(favorites.ready, (ready) => {
  if (ready && favorites.ids.value.length) refresh()
}, { immediate: true })

// Порядок как в избранном: последние добавленные сверху.
const products = computed(() => {
  const byId = new Map((data.value ?? []).map(product => [product.documentId, product]))
  return [...favorites.ids.value].reverse().flatMap(id => byId.get(id) ?? [])
})
const loading = computed(() => !favorites.ready.value || (favorites.ids.value.length > 0 && !data.value && !error.value))
</script>

<template>
  <h1 class="section-title">{{ t('common.favorites') }}</h1>

  <StatusMessage v-if="loading" kind="loading" />
  <StatusMessage v-else-if="error" kind="error">
    {{ t('favorites.loadError') }}
    <template #actions><button type="button" class="btn" @click="refresh()">{{ t('common.retry') }}</button></template>
  </StatusMessage>
  <StatusMessage v-else-if="!favorites.ids.value.length" kind="empty">
    {{ t('favorites.empty') }}
    <template #actions><NuxtLinkLocale to="/catalogs" class="btn">{{ t('favorites.toCatalog') }}</NuxtLinkLocale></template>
  </StatusMessage>
  <ProductGrid v-else :products="products" :columns="4" />
</template>
