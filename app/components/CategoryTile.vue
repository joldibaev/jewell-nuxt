<script setup lang="ts">
import type { CatalogOption } from '#shared/types/catalog'

defineProps<{ category: CatalogOption; linkClass?: string }>()
</script>

<template>
  <NuxtLinkLocale
    :to="{ path: '/catalogs', query: { categories: category.documentId } }"
    class="group relative block aspect-square overflow-hidden rounded-[10px]"
    :class="linkClass"
  >
    <StrapiImage
      v-if="category.image"
      :media="category.image"
            sizes="xs:100vw sm:45vw lg:30vw xl:400px"
      img-class="size-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
    />
    <span class="absolute inset-0 bg-linear-to-t from-black/45 to-transparent" aria-hidden="true" />
    <span class="absolute bottom-3 left-3 font-serif text-xl uppercase text-white sm:bottom-4 sm:left-4 sm:text-3xl">{{ category.name }}</span>
  </NuxtLinkLocale>
</template>
