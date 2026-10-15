<script setup lang="ts">
useSeoMeta({ title: 'Избранное', robots: 'noindex' })

const favorites = useFavorites()
// Загружаем карточки один раз, когда список прочитан из браузера. Удаление на странице просто убирает карточку из показа.
const { data, error, execute: refresh } = useFetch('/api/favorites', {
  query: computed(() => ({ ids: favorites.ids.value.join(',') })),
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
  <h1 class="section-title">Избранное</h1>

  <StatusMessage v-if="loading" kind="loading" />
  <StatusMessage v-else-if="error" kind="error">
    Не удалось загрузить избранное.
    <template #actions><button type="button" class="btn" @click="refresh()">Повторить</button></template>
  </StatusMessage>
  <StatusMessage v-else-if="!favorites.ids.value.length" kind="empty">
    Здесь появятся украшения, которые вы отметите в каталоге.
    <template #actions><NuxtLink to="/catalogs" class="btn">Перейти в каталог</NuxtLink></template>
  </StatusMessage>
  <ProductGrid v-else :products="products" :columns="4" />
</template>
