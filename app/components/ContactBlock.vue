<script setup lang="ts">
// Блок «заголовок + значение» на странице контактов.
defineProps<{ title: string }>()
</script>

<template>
  <div>
    <h3 class="mb-1 text-xl italic text-gold">{{ title }}</h3>
    <div class="whitespace-pre-line text-muted"><slot /></div>
  </div>
</template>
