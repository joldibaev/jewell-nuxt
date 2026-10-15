<script setup lang="ts">
// Чекбокс с подписью. Работает и как булев флаг, и как элемент массива (v-model="string[]" + value).
defineProps<{ value?: string }>()
const model = defineModel<boolean | string[]>()
</script>

<template>
  <label class="flex cursor-pointer items-center gap-2 py-1 text-ink hover:text-gold-dark">
    <input v-model="model" type="checkbox" :value="value" class="checkbox">
    <slot />
  </label>
</template>
