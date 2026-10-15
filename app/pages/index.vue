<script setup lang="ts">
import { categoryTileClasses } from '~/utils/categoryGrid'

useSeoMeta({
  title: 'Элегантные украшения',
  description: 'Коллекция элегантных ювелирных украшений для любого случая.',
  ogTitle: 'JeWell — элегантные украшения',
  ogDescription: 'Коллекция элегантных ювелирных украшений для любого случая.',
})
const { data, status, error, refresh } = await useFetch('/api/home')
const { data: settings } = await useFetch('/api/site-settings')
</script>

<template>
  <StatusMessage v-if="status === 'pending'" kind="loading" />
  <StatusMessage v-else-if="error" kind="error">
    Не удалось загрузить главную страницу.
    <template #actions><button type="button" class="btn" @click="refresh()">Повторить</button></template>
  </StatusMessage>

  <template v-else-if="data">
    <h1 class="sr-only">JeWell — элегантные украшения</h1>

    <HeroSlider v-if="data.banners.length" :banners="data.banners" class="mb-12" />

    <PageSection v-if="data.categories.length" title="Категории">
      <ul class="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-6">
        <li v-for="(category, i) in data.categories" :key="category.documentId" :class="categoryTileClasses(i, data.categories.length).item">
          <CategoryTile :category="category" :link-class="categoryTileClasses(i, data.categories.length).link" />
        </li>
      </ul>
    </PageSection>

    <PageSection v-if="data.collections.length" title="Коллекции">
      <ul class="space-y-4 md:space-y-8">
        <li v-for="(collection, i) in data.collections" :key="collection.documentId">
          <CollectionRow :collection="collection" :reversed="i % 2 === 0" />
        </li>
      </ul>
    </PageSection>

    <ConsultationForm class="mb-14" />

    <PageSection v-if="data.bestsellers.length" title="Наши бестселлеры">
      <ProductGrid :products="data.bestsellers" :columns="4" />
    </PageSection>

    <PageSection v-if="data.inStock.length" title="В наличии">
      <ProductGrid :products="data.inStock" :columns="4" />
      <div class="mt-8 text-center"><NuxtLink :to="{ path: '/catalogs', query: { stock: 'yes' } }" class="btn">Посмотреть все</NuxtLink></div>
    </PageSection>

    <ContactCallout :settings="settings" />
  </template>
</template>
