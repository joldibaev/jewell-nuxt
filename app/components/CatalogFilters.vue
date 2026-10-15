<script setup lang="ts">
import type { CatalogFilters, CatalogOptions } from '#shared/types/catalog'
import { filtersFromQuery } from '#shared/utils/catalog'

const props = defineProps<{ options: CatalogOptions | null | undefined }>()
const emit = defineEmits<{ apply: [filters: CatalogFilters]; reset: [] }>()

const route = useRoute()
const groups = [
  ['categories', 'Тип изделия'],
  ['collections', 'Коллекции'],
  ['brands', 'Бренды'],
  ['gems', 'Камни'],
  ['materials', 'Материалы'],
] as const

// Форма отражает URL: ссылка на отфильтрованный каталог воспроизводится целиком, «Назад» тоже работает.
const form = reactive<CatalogFilters>(filtersFromQuery(route.query))
watch(() => route.query, () => Object.assign(form, filtersFromQuery(route.query)))

// Изменения применяются с небольшой задержкой, чтобы набор текста и серия кликов давали один запрос.
let timer: ReturnType<typeof setTimeout> | undefined
function scheduleApply() {
  clearTimeout(timer)
  timer = setTimeout(() => emit('apply', { ...form, search: form.search.trim() }), 300)
}
onBeforeUnmount(() => clearTimeout(timer))

const stockOnly = computed({
  get: () => form.stock === 'yes',
  set: (value: boolean) => { form.stock = value ? 'yes' : 'all' },
})
const hasFilters = computed(() => Object.keys(route.query).some(key => key !== 'sort'))
</script>

<template>
  <form aria-label="Фильтры каталога" class="space-y-6" @submit.prevent="scheduleApply" @input="scheduleApply" @change="scheduleApply">
    <label class="block">
      <span class="mb-1 block text-sm text-muted">Поиск</span>
      <input v-model="form.search" type="search" name="search" autocomplete="off" enterkeyhint="search" class="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-ink transition-colors hover:border-gold focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30">
    </label>

    <FilterGroup v-for="[key, label] in groups" :key="key" v-model="form[key]" :legend="label" :options="props.options?.[key] ?? []" />

    <fieldset>
      <legend class="mb-1 font-serif text-2xl italic text-gold">Наличие</legend>
      <CheckboxField v-model="stockOnly">Только в наличии</CheckboxField>
    </fieldset>

    <PriceRange v-model:min="form.minPrice" v-model:max="form.maxPrice" @change="scheduleApply" />

    <button v-if="hasFilters" type="button" class="w-full rounded-md border border-gold px-6 py-2.5 text-gold-dark transition-colors hover:bg-gold hover:text-white" @click="emit('reset')">
      Очистить фильтры
    </button>
  </form>
</template>
