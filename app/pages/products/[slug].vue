<script setup lang="ts">
import { formatPrice } from '#shared/utils/catalog'

const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const { data: product, error } = await useFetch(() => `/api/products/${route.params.slug}`, { query: { locale } })
const { data: settings } = await useFetch('/api/site-settings', { query: { locale } })

if (error.value || !product.value) {
  throw createError({
    statusCode: error.value?.statusCode === 404 || !product.value ? 404 : 502,
    statusMessage: t('product.notFound'),
    fatal: true,
  })
}

const origin = useRequestURL().origin
const socialImage = useSocialImage()
const first = computed(() => product.value?.gallery[0])
const ogImage = computed(() => first.value ? socialImage(first.value) : undefined)
const paragraphs = computed(() => (product.value?.description ?? '').split(/\n+/).map(s => s.trim()).filter(Boolean))
const noteLines = computed(() => (settings.value?.productNote ?? '').split(/\n+/).map(s => s.trim()).filter(Boolean))
// Описание из Strapi бывает пустым: тогда даём поисковикам осмысленный текст из названия и цены, а не пустой тег.
const summary = computed(() => shortText(paragraphs.value.join(' '))
  ?? t('seo.productDescription', { name: product.value!.name, price: formatPrice(product.value!.priceUzs, locale.value), currency: t('common.currency') }))
const productPath = computed(() => localePath(`/products/${route.params.slug}`))

usePageSeo({ title: () => product.value!.name, description: () => summary.value, image: () => ogImage.value, type: 'product' })
useHead(() => ({
  meta: [
    { property: 'product:price:amount', content: String(product.value!.priceUzs) },
    { property: 'product:price:currency', content: 'UZS' },
  ],
}))
useJsonLd(() => [
  {
    '@type': 'Product',
    name: product.value!.name,
    url: origin + productPath.value,
    image: product.value!.gallery.slice(0, 5).map(socialImage),
    description: summary.value,
    sku: product.value!.code || undefined,
    brand: { '@type': 'Brand', name: product.value!.brand?.name ?? 'JeWell' },
    offers: {
      '@type': 'Offer',
      url: origin + productPath.value,
      priceCurrency: 'UZS',
      price: String(product.value!.priceUzs),
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.value!.inStock ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
      seller: { '@type': 'Organization', name: 'JeWell' },
    },
  },
  breadcrumbList(origin, [
    { name: t('common.home'), url: localePath('/') },
    { name: t('common.catalog'), url: localePath('/catalogs') },
    { name: product.value!.name, url: productPath.value },
  ]),
])
</script>

<template>
  <article v-if="product">
    <nav :aria-label="t('common.breadcrumbs')" class="mb-6 text-sm text-muted">
      <ol class="flex flex-wrap gap-2">
        <li><NuxtLinkLocale to="/" class="hover:text-gold-dark">{{ t('common.home') }}</NuxtLinkLocale></li>
        <li aria-hidden="true">/</li>
        <li><NuxtLinkLocale to="/catalogs" class="hover:text-gold-dark">{{ t('common.catalog') }}</NuxtLinkLocale></li>
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

        <p class="mb-1 text-3xl text-gold">{{ formatPrice(product.priceUzs, locale) }} {{ t('common.currency') }}</p>
        <p v-if="product.inStock" class="mb-6 text-gold-dark">{{ t('product.inStock') }}</p>

        <ul v-if="noteLines.length" class="mb-6 space-y-1 text-ink">
          <li v-for="(line, i) in noteLines" :key="i">{{ line }}</li>
        </ul>

        <FavoriteButton :product-id="product.documentId" variant="solid" class="lg:max-w-sm" />
      </div>
    </div>

    <PageSection v-if="product.related.length" :title="t('product.like')">
      <ProductGrid :products="product.related" :columns="4" />
    </PageSection>
  </article>
</template>
