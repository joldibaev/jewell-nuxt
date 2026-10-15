<script setup lang="ts">
import type { CatalogOption } from '#shared/types/catalog'

// Строка коллекции: картинка и текст рядом. `reversed` меняет их местами (чередование на главной).
defineProps<{ collection: CatalogOption; reversed?: boolean }>()
const { t } = useI18n()
</script>

<template>
  <div class="grid grid-cols-2 items-center gap-3 md:gap-12">
    <NuxtLinkLocale
      :to="{ path: '/catalogs', query: { collections: collection.documentId } }"
      class="block overflow-hidden rounded-[10px]"
      :class="reversed ? 'order-2' : ''"
    >
      <StrapiImage
        v-if="collection.image"
        :media="collection.image"
                sizes="xs:50vw md:45vw xl:560px"
        img-class="aspect-4/3 w-full object-cover sm:aspect-auto"
      />
    </NuxtLinkLocale>
    <div class="text-center" :class="reversed ? 'sm:text-right' : 'sm:text-left'">
      <p class="font-serif text-lg text-muted sm:text-3xl">{{ t('collection.label') }}</p>
      <p class="my-2 font-serif text-2xl italic text-gold sm:my-3 sm:text-5xl lg:text-6xl">"{{ collection.name }}"</p>
      <NuxtLinkLocale :to="{ path: '/catalogs', query: { collections: collection.documentId } }" class="btn mt-1 !px-4 !py-1.5 sm:mt-2 sm:!px-6 sm:!py-2.5">{{ t('collection.more') }}</NuxtLinkLocale>
    </div>
  </div>
</template>
