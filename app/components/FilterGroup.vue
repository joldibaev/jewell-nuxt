<script setup lang="ts">
import type { CatalogOption } from '#shared/types/catalog'

// Группа фильтра: заголовок и список чекбоксов. Пустая группа не показывается.
defineProps<{ legend: string; options: CatalogOption[] }>()
const selected = defineModel<string[]>({ required: true })
</script>

<template>
  <fieldset v-if="options.length">
    <legend class="mb-1 font-serif text-2xl italic text-gold">{{ legend }}</legend>
    <CheckboxField v-for="option in options" :key="option.documentId" v-model="selected" :value="option.documentId">
      {{ option.name }}
    </CheckboxField>
  </fieldset>
</template>
