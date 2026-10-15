<script setup lang="ts">
// Состояния «загрузка / ошибка / пусто» выглядят одинаково на всех страницах.
defineProps<{ kind: 'loading' | 'error' | 'empty' }>()
</script>

<template>
  <p v-if="kind === 'loading'" role="status" class="py-16 text-center text-muted"><slot>Загрузка…</slot></p>
  <div v-else class="py-16 text-center" :role="kind === 'error' ? 'alert' : undefined">
    <p class="mb-4 text-muted" :class="kind === 'empty' ? 'text-lg' : ''"><slot /></p>
    <div class="flex flex-wrap justify-center gap-3"><slot name="actions" /></div>
  </div>
</template>
