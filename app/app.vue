<script setup lang="ts">
// canonical без query-параметров: фильтры и сортировка каталога не плодят дубли в поиске.
const route = useRoute()
const origin = useRequestURL().origin
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
// Язык документа и ссылки на версии страницы на других языках (hreflang) для поисковиков.
useHead(() => ({
  htmlAttrs: { lang: locale.value },
  link: [
    { rel: 'canonical', href: origin + route.path },
    ...locales.value.map(item => ({ rel: 'alternate' as const, hreflang: item.code, href: origin + switchLocalePath(item.code) })),
  ],
}))
</script>

<template>
  <NuxtRouteAnnouncer />
  <!-- Переход на страницу ждёт её данные (SSR-совместимо), поэтому показываем полосу прогресса, чтобы клик не казался «глухим». -->
  <NuxtLoadingIndicator color="#e3b771" :height="3" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
