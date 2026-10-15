<script setup lang="ts">
// canonical без query-параметров: фильтры и сортировка каталога не плодят дубли в поиске.
// Русский текст рисуется кириллическими файлами Cormorant; без preload они ждут загрузки CSS и только потом стартуют.
import cyrillicNormal from '@fontsource-variable/cormorant-garamond/files/cormorant-garamond-cyrillic-wght-normal.woff2?url'
import cyrillicItalic from '@fontsource-variable/cormorant-garamond/files/cormorant-garamond-cyrillic-wght-italic.woff2?url'

const route = useRoute()
const origin = useRequestURL().origin
useHead({
  link: [
    { rel: 'canonical', href: () => origin + route.path },
    ...[cyrillicNormal, cyrillicItalic].map(href => ({ rel: 'preload', as: 'font' as const, type: 'font/woff2', href, crossorigin: 'anonymous' as const })),
  ],
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <!-- Переход на страницу ждёт её данные (SSR-совместимо), поэтому показываем полосу прогресса, чтобы клик не казался «глухим». -->
  <NuxtLoadingIndicator color="#e3b771" :height="3" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
