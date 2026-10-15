<script setup lang="ts">
// canonical без query-параметров: фильтры и сортировка каталога не плодят дубли в поиске.
const route = useRoute()
const origin = useRequestURL().origin
useHead({ link: [{ rel: 'canonical', href: () => origin + route.path }] })
</script>

<template>
  <NuxtRouteAnnouncer />
  <!-- Переход на страницу ждёт её данные (SSR-совместимо), поэтому показываем полосу прогресса, чтобы клик не казался «глухим». -->
  <NuxtLoadingIndicator color="#e3b771" :height="3" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
