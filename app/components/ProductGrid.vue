<script setup lang="ts">
import type { ProductCard } from '#shared/types/catalog'

// Один и тот же список карточек на главной (4 в ряд) и в каталоге (3 в ряд рядом с фильтрами).
defineProps<{ products: ProductCard[]; columns?: 3 | 4; busy?: boolean }>()
</script>

<template>
  <ul
    class="grid grid-cols-2 gap-3 transition-opacity md:gap-6"
    :class="[columns === 3 ? 'xl:grid-cols-3' : 'xl:grid-cols-4', busy ? 'opacity-50' : '']"
    :aria-busy="busy"
  >
    <!-- content-visibility: браузер не рисует и не раскладывает карточки за пределами экрана. -->
    <li v-for="product in products" :key="product.documentId" class="[contain-intrinsic-size:auto_26rem] [content-visibility:auto]">
      <ProductCard :product="product" />
    </li>
  </ul>
</template>
