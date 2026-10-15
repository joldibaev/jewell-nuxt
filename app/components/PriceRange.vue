<script setup lang="ts">
// Диапазон цены двумя выпадающими списками. Шаги в млн сум; значение из URL, которого нет в списке, добавляется отдельным пунктом.
const min = defineModel<number | undefined>('min')
const max = defineModel<number | undefined>('max')
defineEmits<{ change: [] }>()

const steps = [1, 2, 3, 5, 7, 10, 15, 20, 30, 50].map(m => m * 1_000_000)
const { t, locale } = useI18n()
const million = computed(() => new Intl.NumberFormat(NUMBER_LOCALES[locale.value]))

function options(current: number | undefined, empty: string) {
  const values = current !== undefined && !steps.includes(current) ? [...steps, current].sort((a, b) => a - b) : steps
  return [
    { value: undefined as number | undefined, label: empty },
    ...values.map(value => ({ value: value as number | undefined, label: `${million.value.format(value / 1_000_000)} ${t('common.million')}` })),
  ]
}
</script>

<template>
  <fieldset>
    <legend class="mb-1 font-serif text-2xl italic text-gold">{{ t('catalog.price') }}</legend>
    <div class="grid grid-cols-2 gap-2">
      <BaseSelect v-model="min" :label="t('catalog.priceFrom')" :options="options(min, t('common.from'))" @update:model-value="$emit('change')" />
      <BaseSelect v-model="max" :label="t('catalog.priceTo')" :options="options(max, t('common.to'))" @update:model-value="$emit('change')" />
    </div>
  </fieldset>
</template>
