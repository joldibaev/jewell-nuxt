<script setup lang="ts">
// Кнопка избранного. `card` — плоская полоса внизу карточки, `solid` — обычная кнопка на странице товара.
const props = withDefaults(defineProps<{ productId: string; variant?: 'card' | 'solid' }>(), { variant: 'card' })
const favorites = useFavorites()
const active = computed(() => favorites.has(props.productId))

const classes = computed(() => {
  if (props.variant === 'solid') {
    return active.value
      ? 'rounded-md border border-gold bg-white px-6 py-3 text-lg text-gold-dark hover:bg-stone-50'
      : 'rounded-md bg-gold px-6 py-3 text-lg text-white hover:bg-gold-dark'
  }
  return active.value
    ? 'py-4 text-lg md:text-xl bg-gold text-white'
    : 'py-4 text-lg md:text-xl text-gold hover:bg-gold hover:text-white group-hover:bg-gold group-hover:text-white'
})
</script>

<template>
  <button type="button" class="w-full transition-colors" :class="classes" :aria-pressed="active" @click="favorites.toggle(productId)">
    {{ active ? 'Удалить из избранных' : 'В Избранное' }}
  </button>
</template>
