<script setup lang="ts">
import { formatPrice } from '#shared/utils/catalog'

const route = useRoute()
const { data: product, error } = await useFetch(() => `/api/products/${route.params.slug}`)
const { data: settings } = await useFetch('/api/site-settings')

if (error.value || !product.value) {
  throw createError({
    statusCode: error.value?.statusCode === 404 || !product.value ? 404 : 502,
    statusMessage: 'Товар не найден',
    fatal: true,
  })
}

const origin = useRequestURL().origin
const img = useImage()
const first = computed(() => product.value?.gallery[0])
// Для соцсетей отдаём лёгкую нарезку, а не оригинал на несколько мегабайт.
const ogImage = computed(() => first.value ? origin + img(first.value.url, { width: 1200, format: 'jpeg' }) : undefined)
const paragraphs = computed(() => (product.value?.description ?? '').split(/\n+/).map(s => s.trim()).filter(Boolean))
const noteLines = computed(() => (settings.value?.productNote ?? '').split(/\n+/).map(s => s.trim()).filter(Boolean))
const summary = computed(() => paragraphs.value.join(' ').slice(0, 160))

useSeoMeta({
  title: () => product.value!.name,
  description: summary,
  ogTitle: () => product.value!.name,
  ogDescription: summary,
  ogImage,
  ogType: 'website',
  twitterCard: 'summary_large_image',
})
useHead(() => ({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.value!.name,
        image: ogImage.value ? [ogImage.value] : undefined,
        description: summary.value || undefined,
        sku: product.value!.code || undefined,
        brand: product.value!.brand ? { '@type': 'Brand', name: product.value!.brand.name } : undefined,
        offers: {
          '@type': 'Offer',
          url: origin + route.path,
          priceCurrency: 'UZS',
          price: String(product.value!.priceUzs),
          availability: product.value!.inStock ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
        },
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Главная', item: origin + '/' },
          { '@type': 'ListItem', position: 2, name: 'Каталог', item: origin + '/catalogs' },
          { '@type': 'ListItem', position: 3, name: product.value!.name, item: origin + route.path },
        ],
      }),
    },
  ],
}))
</script>

<template>
  <article v-if="product">
    <nav aria-label="Хлебные крошки" class="mb-6 text-sm text-muted">
      <ol class="flex flex-wrap gap-2">
        <li><NuxtLink to="/" class="hover:text-gold-dark">Главная</NuxtLink></li>
        <li aria-hidden="true">/</li>
        <li><NuxtLink to="/catalogs" class="hover:text-gold-dark">Каталог</NuxtLink></li>
        <li aria-hidden="true">/</li>
        <li aria-current="page">{{ product.name }}</li>
      </ol>
    </nav>

    <div class="mb-14 grid gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-12">
      <ProductGallery :images="product.gallery" :name="product.name" :position="product.previewPosition" />

      <div>
        <h1 class="mb-4 text-3xl italic text-gold md:text-4xl">{{ product.name }}</h1>
        <p v-if="product.brand" class="mb-4 text-muted">{{ product.brand.name }}</p>

        <div v-if="paragraphs.length" class="mb-6 space-y-2 text-ink">
          <p v-for="(line, i) in paragraphs" :key="i">{{ line }}</p>
        </div>

        <ProductSpecs :product="product" class="mb-6" />

        <p class="mb-1 text-3xl text-gold">{{ formatPrice(product.priceUzs) }} сум</p>
        <p v-if="product.inStock" class="mb-6 text-gold-dark">В наличии</p>

        <ul v-if="noteLines.length" class="mb-6 space-y-1 text-ink">
          <li v-for="(line, i) in noteLines" :key="i">{{ line }}</li>
        </ul>

        <FavoriteButton :product-id="product.documentId" variant="solid" class="lg:max-w-sm" />
      </div>
    </div>

    <PageSection v-if="product.related.length" title="Возможно, вам понравится">
      <ProductGrid :products="product.related" :columns="4" />
    </PageSection>
  </article>
</template>
