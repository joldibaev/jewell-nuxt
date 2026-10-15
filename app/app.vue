<script setup lang="ts">
// canonical без query-параметров: фильтры и сортировка каталога не плодят дубли в поиске.
const route = useRoute()
const origin = useRequestURL().origin
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
// Язык документа и ссылки на версии страницы на других языках (hreflang) для поисковиков.
// Адреса версий без query, как и canonical: фильтры каталога не должны попадать в hreflang.
const withoutQuery = (path: string) => path.split('?')[0]
const alternates = computed(() => locales.value.map(item => ({
  code: item.code,
  language: item.language ?? item.code,
  href: origin + withoutQuery(switchLocalePath(item.code)),
})))
const canonical = computed(() => origin + route.path)
useHead(() => ({
  htmlAttrs: { lang: locale.value },
  link: [
    { rel: 'canonical', href: canonical.value },
    ...alternates.value.map(item => ({ rel: 'alternate' as const, hreflang: item.code, href: item.href })),
    // Для тех, чей язык не совпал ни с одной версией, — основная версия.
    { rel: 'alternate' as const, hreflang: 'x-default', href: alternates.value.find(item => item.code === DEFAULT_LOCALE)?.href ?? canonical.value },
  ],
}))
useSeoMeta({
  ogUrl: canonical,
  ogLocale: () => alternates.value.find(item => item.code === locale.value)?.language.replace('-', '_'),
  ogLocaleAlternate: () => alternates.value.filter(item => item.code !== locale.value).map(item => item.language.replace('-', '_')),
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
