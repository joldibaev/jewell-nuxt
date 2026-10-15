<script setup lang="ts">
import type { Locale } from '#shared/utils/locale'

// Выбор языка списком. Адрес задаёт язык, поэтому выбор — это переход на ту же страницу с другим префиксом.
const { locale, locales, t } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const options = computed(() => locales.value.map(item => ({ value: item.code as Locale, label: item.name ?? item.code })))
const selected = computed<Locale>({
  get: () => locale.value,
  set: (code) => {
    if (code !== locale.value) navigateTo(switchLocalePath(code))
  },
})
</script>

<template>
  <div class="w-36">
    <BaseSelect v-model="selected" :label="t('common.language')" :options="options" />
  </div>
</template>
