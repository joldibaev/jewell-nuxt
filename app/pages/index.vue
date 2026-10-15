<script setup lang="ts">
import { categoryTileClasses } from '~/utils/categoryGrid'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { data, status, error, refresh } = await useFetch('/api/home', { query: { locale } })
const { data: settings } = await useFetch('/api/site-settings', { query: { locale } })

const socialImage = useSocialImage()
usePageSeo({ title: () => t('seo.homeTitle'), description: () => t('seo.homeDescription'), image: () => socialImage(data.value?.banners[0]) })
// og:title главной — с названием бренда (в title оно добавляется шаблоном).
useSeoMeta({ ogTitle: () => t('seo.homeOgTitle'), twitterTitle: () => t('seo.homeOgTitle') })

// Организация и сайт: основа для карточки бренда в выдаче. Поиска по сайту через адресную строку нет, поэтому SearchAction не добавляем.
const absolute = useAbsoluteUrl()
useJsonLd(() => [
  {
    '@type': 'Organization',
    '@id': absolute('/#organization'),
    name: 'JeWell',
    url: absolute(localePath('/')),
    logo: absolute('/favicon/android-chrome-512x512.png'),
    telephone: settings.value?.phone || undefined,
    email: settings.value?.email || undefined,
    sameAs: [settings.value?.instagramUrl, settings.value?.telegramUrl, settings.value?.facebookUrl].filter(Boolean).length
      ? [settings.value?.instagramUrl, settings.value?.telegramUrl, settings.value?.facebookUrl].filter(Boolean)
      : undefined,
  },
  {
    '@type': 'WebSite',
    '@id': absolute('/#website'),
    name: 'JeWell',
    url: absolute(localePath('/')),
    inLanguage: locale.value,
    publisher: { '@id': absolute('/#organization') },
  },
])
</script>

<template>
  <StatusMessage v-if="status === 'pending'" kind="loading" />
  <StatusMessage v-else-if="error" kind="error">
    {{ t('home.loadError') }}
    <template #actions><button type="button" class="btn" @click="refresh()">{{ t('common.retry') }}</button></template>
  </StatusMessage>

  <template v-else-if="data">
    <h1 class="sr-only">{{ t('seo.homeOgTitle') }}</h1>

    <HeroSlider v-if="data.banners.length" :banners="data.banners" class="mb-12" />

    <PageSection v-if="data.categories.length" :title="t('home.categories')">
      <ul class="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-6">
        <li v-for="(category, i) in data.categories" :key="category.documentId" :class="categoryTileClasses(i, data.categories.length).item">
          <CategoryTile :category="category" :link-class="categoryTileClasses(i, data.categories.length).link" />
        </li>
      </ul>
    </PageSection>

    <PageSection v-if="data.collections.length" :title="t('home.collections')">
      <ul class="space-y-4 md:space-y-8">
        <li v-for="(collection, i) in data.collections" :key="collection.documentId">
          <CollectionRow :collection="collection" :reversed="i % 2 === 0" />
        </li>
      </ul>
    </PageSection>

    <ConsultationForm class="mb-14" />

    <PageSection v-if="data.bestsellers.length" :title="t('home.bestsellers')">
      <ProductGrid :products="data.bestsellers" :columns="4" />
    </PageSection>

    <PageSection v-if="data.inStock.length" :title="t('home.inStock')">
      <ProductGrid :products="data.inStock" :columns="4" />
      <div class="mt-8 text-center"><NuxtLinkLocale :to="{ path: '/catalogs', query: { stock: 'yes' } }" class="btn">{{ t('home.viewAll') }}</NuxtLinkLocale></div>
    </PageSection>

    <ContactCallout :settings="settings" />
  </template>
</template>
