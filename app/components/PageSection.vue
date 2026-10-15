<script setup lang="ts">
// Секция страницы с заголовком: связь aria-labelledby и отступы в одном месте.
defineProps<{ title: string }>()
const id = useId()
</script>

<template>
  <section class="mb-14" :aria-labelledby="id">
    <h2 :id="id" class="section-title">{{ title }}</h2>
    <slot />
  </section>
</template>
