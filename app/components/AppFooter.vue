<script setup lang="ts">
// Все реквизиты берутся из «Настроек сайта» в Strapi; пустые поля просто не выводятся.
const { t, locale } = useI18n()
const { data: settings } = await useFetch('/api/site-settings', { query: { locale } })
const telHref = computed(() => settings.value?.phone ? 'tel:' + settings.value.phone.replace(/[^\d+]/g, '') : undefined)
</script>

<template>
  <footer class="container border-t border-stone-200 bg-white py-12">
    <div class="grid gap-10 text-center md:grid-cols-2 xl:grid-cols-[auto_1fr_1fr_1.2fr] xl:text-left">
      <img src="/img/logo-vertical.webp" alt="JeWell" width="127" height="160" loading="lazy" class="mx-auto h-40 w-auto xl:mx-0">

      <div>
        <h2 class="mb-3 text-2xl italic">{{ t('footer.gallery') }}</h2>
        <ul class="space-y-1 text-muted">
          <li><NuxtLinkLocale to="/" class="hover:text-gold-dark">{{ t('common.home') }}</NuxtLinkLocale></li>
          <li><NuxtLinkLocale to="/catalogs" class="hover:text-gold-dark">{{ t('common.catalog') }}</NuxtLinkLocale></li>
          <li><NuxtLinkLocale to="/about-us" class="hover:text-gold-dark">{{ t('common.about') }}</NuxtLinkLocale></li>
          <li><NuxtLinkLocale to="/contacts" class="hover:text-gold-dark">{{ t('common.contacts') }}</NuxtLinkLocale></li>
        </ul>
      </div>

      <div v-if="settings">
        <h2 class="mb-3 text-2xl italic">{{ t('footer.contacts') }}</h2>
        <address class="space-y-1 text-muted not-italic">
          <p v-if="settings.phone">{{ t('footer.phone') }}: <a :href="telHref" class="text-gold-dark hover:underline">{{ settings.phone }}</a></p>
          <p v-if="settings.email"><a :href="`mailto:${settings.email}`" class="text-gold-dark hover:underline">{{ settings.email }}</a></p>
          <p v-if="settings.address">{{ settings.address }}</p>
          <p v-if="settings.instagramUrl"><a :href="settings.instagramUrl" target="_blank" rel="noopener" class="text-gold-dark hover:underline">{{ t('footer.instagram') }}</a></p>
          <p v-if="settings.telegramUrl"><a :href="settings.telegramUrl" target="_blank" rel="noopener" class="text-gold-dark hover:underline">{{ t('footer.telegram') }}</a></p>
        </address>
      </div>

      <MapEmbed v-if="settings?.mapEmbedUrl" :src="settings.mapEmbedUrl" class="h-44 md:col-span-2 xl:col-span-1" />
    </div>
  </footer>
</template>
