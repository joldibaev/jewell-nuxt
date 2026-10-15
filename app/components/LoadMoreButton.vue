<script setup lang="ts">
// Кнопка догрузки списка с состояниями «загружаем» и «ошибка, повторить» и подписью о прогрессе.
defineProps<{ loading: boolean; failed: boolean; shown: number; total: number }>()
defineEmits<{ load: [] }>()
</script>

<template>
  <div class="mt-10 text-center">
    <p v-if="failed" role="alert" class="mb-3 text-sm text-red-700">Не удалось загрузить ещё товары.</p>
    <button type="button" class="btn min-w-56 disabled:opacity-60" :disabled="loading" @click="$emit('load')">
      {{ loading ? 'Загружаем…' : failed ? 'Повторить' : 'Показать ещё' }}
    </button>
    <p class="mt-3 text-sm text-muted">Показано {{ shown }} из {{ total }}</p>
  </div>
</template>
