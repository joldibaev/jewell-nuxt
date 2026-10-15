<script setup lang="ts">
import type { ProductCard } from '#shared/types/catalog'
import { formatPrice } from '#shared/utils/catalog'

defineProps<{ product: ProductCard }>()
const { t, locale } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <article class="group relative flex h-full flex-col overflow-hidden rounded-[10px] border-2 border-neutral-300/50 bg-white transition-colors hover:border-gold">
    <span v-if="product.inStock" class="pointer-events-none absolute right-2 top-2 z-30 rounded-[7px] bg-gold px-2 py-0.5 text-base font-light text-white md:text-xl">{{ t('product.inStockBadge') }}</span>
    <div class="flex flex-1 flex-col p-4">
      <CardImageStrip
        v-if="product.gallery.length"
        :images="product.gallery"
        :position="product.previewPosition"
        :to="product.slug ? localePath(`/products/${product.slug}`) : undefined"
        sizes="xs:44vw sm:40vw lg:22vw xl:264px"
      />
      <div v-else class="mb-4 aspect-4/3 rounded-[10px] bg-neutral-300" />
      <div class="flex flex-1 flex-col items-center justify-between gap-2 text-center">
        <p v-if="product.brand">{{ product.brand.name }}</p>
        <h3 class="my-2 flex min-h-12 items-center justify-center font-serif text-xl italic text-gold md:my-4 md:text-2xl"><NuxtLinkLocale v-if="product.slug" :to="`/products/${product.slug}`" class="after:absolute after:inset-0 after:content-['']">{{ product.name }}</NuxtLinkLocale>
          <template v-else>{{ product.name }}</template>
        </h3>
        <p class="text-lg text-muted md:text-xl">{{ formatPrice(product.priceUzs, locale) }} {{ t('common.currency') }}</p>
      </div>
    </div>
    <!-- Вся карточка кликабельна (растянутая ссылка у названия); кнопка избранного поднята над ней. -->
    <FavoriteButton :product-id="product.documentId" class="relative z-10" />
  </article>
</template>
