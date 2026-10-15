<script setup lang="ts">
// Карта Яндекса грузит ~1 МБ скриптов, поэтому до клика на её месте лёгкая заглушка: страницы не тянут чужой код ради карты, которую смотрят единицы.
defineProps<{ src: string }>()
const loaded = ref(false)
</script>

<template>
  <iframe
    v-if="loaded"
    title="Карта проезда"
    :src="src"
    referrerpolicy="no-referrer-when-downgrade"
    class="w-full rounded-xl border border-stone-200"
  />
  <button
    v-else
    type="button"
    class="group grid w-full place-items-center gap-2 rounded-xl border border-stone-200 bg-stone-100 text-muted transition-colors hover:border-gold hover:bg-stone-50"
    @click="loaded = true"
  >
    <span class="grid justify-items-center gap-2">
      <svg class="size-9 text-gold transition-transform group-hover:-translate-y-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></svg>
      <span class="text-lg">Показать карту</span>
    </span>
  </button>
</template>
