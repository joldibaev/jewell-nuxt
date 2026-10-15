<script setup lang="ts">
import type { CatalogSort } from '#shared/types/catalog'

// Верхняя панель каталога: кнопка фильтров (телефон), счётчик и сортировка.
defineProps<{ total?: number }>()
defineEmits<{ openFilters: [] }>()
const sort = defineModel<CatalogSort>('sort', { required: true })

const sorts: { value: CatalogSort; label: string }[] = [
  { value: 'newest', label: 'Сначала новые' },
  { value: 'price-asc', label: 'Сначала дешевле' },
  { value: 'price-desc', label: 'Сначала дороже' },
]
</script>

<template>
  <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
    <button type="button" class="inline-flex items-center gap-2 rounded-md border border-stone-300 px-4 py-2 text-ink lg:hidden" aria-haspopup="dialog" @click="$emit('openFilters')">
      <svg class="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M6 5.75C6 4.78 6.78 4 7.75 4c.95 0 1.72.75 1.75 1.69v.12C9.47 6.75 8.7 7.5 7.75 7.5 6.78 7.5 6 6.72 6 5.75ZM7.75 3c1.35 0 2.47.97 2.7 2.25h8.05a.5.5 0 0 1 0 1h-8.05A2.75 2.75 0 0 1 5.05 6.25H1.5a.5.5 0 0 1 0-1h3.55A2.75 2.75 0 0 1 7.75 3Zm2.75 11.25c0-.97.78-1.75 1.75-1.75s1.75.78 1.75 1.75-.78 1.75-1.75 1.75-1.75-.78-1.75-1.75Zm4.45.5A2.75 2.75 0 0 1 12.25 17a2.75 2.75 0 0 1-2.7-2.25H1.5a.5.5 0 0 1 0-1h8.05a2.75 2.75 0 0 1 5.4 0h3.55a.5.5 0 0 1 0 1h-3.55Z" clip-rule="evenodd" /></svg>
      Фильтры
    </button>

    <p class="order-last w-full text-muted sm:order-none sm:w-auto" role="status" aria-live="polite">
      <template v-if="total !== undefined">Найдено: {{ total }}</template>
    </p>

    <div class="flex items-center gap-2 text-muted">
      <span class="hidden sm:inline">Сортировка</span>
      <div class="w-48"><BaseSelect v-model="sort" label="Сортировка" :options="sorts" /></div>
    </div>
  </div>
</template>
