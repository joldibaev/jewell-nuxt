<script setup lang="ts">
import type { ProductDetail } from '#shared/types/catalog'

// Характеристики товара: показываем только те, что заполнены в Strapi.
const props = defineProps<{ product: ProductDetail }>()
const { t } = useI18n()

const rows = computed(() => {
  const p = props.product
  const list: { label: string; value: string }[] = []
  if (p.collection) list.push({ label: t('product.collection'), value: p.collection.name })
  if (p.materials.length) list.push({ label: t('product.material'), value: p.materials.map(m => m.name).join(', ') })
  if (p.weight) list.push({ label: t('product.weight'), value: `${p.weight} ${t('common.grams')}` })
  if (p.lengthMin || p.lengthMax) {
    list.push({ label: t('product.length'), value: p.lengthMin && p.lengthMax && p.lengthMin !== p.lengthMax ? `${p.lengthMin}–${p.lengthMax} ${t('common.cm')}` : `${p.lengthMax || p.lengthMin} ${t('common.cm')}` })
  }
  for (const item of p.gems) if (item.gem) list.push({ label: item.gem.name, value: `${item.count} ${t('common.pieces')}` })
  if (p.code) list.push({ label: t('product.code'), value: p.code })
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
