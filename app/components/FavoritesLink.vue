<script setup lang="ts">
const favorites = useFavorites()
// Счётчик показываем только когда список прочитан из браузера, иначе разметка сервера и клиента разойдутся.
const count = computed(() => favorites.ready.value ? favorites.ids.value.length : 0)
</script>

<template>
  <NuxtLink
    to="/favorites"
    class="relative grid size-11 place-items-center rounded-lg text-nav transition-colors hover:text-gold-dark"
    :aria-label="count ? `Избранное, товаров: ${count}` : 'Избранное'"
    active-class="!text-gold-dark"
  >
    <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.7a4.3 4.3 0 0 1 7.5 2.6c0 5.6-7.5 10.2-7.5 10.2Z" /></svg>
    <span v-if="count" class="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-gold px-1 text-xs text-white">{{ count }}</span>
  </NuxtLink>
</template>
