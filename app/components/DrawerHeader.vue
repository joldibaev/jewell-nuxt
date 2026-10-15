<script setup lang="ts">
// Шапка боковой панели: заголовок или логотип слева, кнопка закрытия справа.
defineProps<{ closeLabel: string }>()
defineEmits<{ close: [] }>()
</script>

<template>
  <div class="flex h-16 shrink-0 items-center justify-between border-b border-stone-100 px-4">
    <slot />
    <button type="button" class="-mr-2 grid size-11 place-items-center rounded-lg text-nav" :aria-label="closeLabel" @click="$emit('close')">
      <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
    </button>
  </div>
</template>
