<script setup lang="ts">
import type { ProductDetail } from '#shared/types/catalog'

// Характеристики товара: показываем только те, что заполнены в Strapi.
const props = defineProps<{ product: ProductDetail }>()

const rows = computed(() => {
  const p = props.product
  const list: { label: string; value: string }[] = []
  if (p.collection) list.push({ label: 'Коллекция', value: p.collection.name })
  if (p.materials.length) list.push({ label: 'Материал', value: p.materials.map(m => m.name).join(', ') })
  if (p.weight) list.push({ label: 'Вес', value: `${p.weight} г` })
  if (p.lengthMin || p.lengthMax) {
    list.push({ label: 'Длина', value: p.lengthMin && p.lengthMax && p.lengthMin !== p.lengthMax ? `${p.lengthMin}–${p.lengthMax} см` : `${p.lengthMax || p.lengthMin} см` })
  }
  for (const item of p.gems) if (item.gem) list.push({ label: item.gem.name, value: `${item.count} шт.` })
  if (p.code) list.push({ label: 'Артикул', value: p.code })
  return list
})
</script>

<template>
  <dl v-if="rows.length" class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5">
    <template v-for="row in rows" :key="row.label">
      <dt class="text-muted">{{ row.label }}</dt>
      <dd class="text-ink">{{ row.value }}</dd>
    </template>
  </dl>
</template>
