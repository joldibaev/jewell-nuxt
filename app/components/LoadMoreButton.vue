<script setup lang="ts">
// Кнопка догрузки списка с состояниями «загружаем» и «ошибка, повторить» и подписью о прогрессе.
defineProps<{ loading: boolean; failed: boolean; shown: number; total: number }>()
defineEmits<{ load: [] }>()
const { t } = useI18n()
</script>

<template>
  <div class="mt-10 text-center">
    <p v-if="failed" role="alert" class="mb-3 text-sm text-red-700">{{ t('catalog.loadMoreError') }}</p>
    <button type="button" class="btn min-w-56 disabled:opacity-60" :disabled="loading" @click="$emit('load')">
      {{ loading ? t('catalog.loadingMore') : failed ? t('common.retry') : t('catalog.loadMore') }}
    </button>
    <p class="mt-3 text-sm text-muted">{{ t('catalog.shown', { shown, total }) }}</p>
  </div>
</template>
