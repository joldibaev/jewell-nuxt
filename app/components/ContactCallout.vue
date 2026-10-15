<script setup lang="ts">
import type { SiteSettings } from '#shared/types/catalog'

defineProps<{ settings: SiteSettings | null | undefined }>()
const { t } = useI18n()
</script>

<template>
  <section v-if="settings?.telegramUrl || settings?.instagramUrl" class="rounded-[10px] border border-gold p-5 text-center text-muted">
    {{ t('callout.before') }}
    <a v-if="settings.telegramUrl" :href="settings.telegramUrl" class="text-gold-dark hover:underline" target="_blank" rel="noopener">Telegram</a>
    <template v-if="settings.telegramUrl && settings.instagramUrl"> {{ t('callout.or') }} </template>
    <a v-if="settings.instagramUrl" :href="settings.instagramUrl" class="text-gold-dark hover:underline" target="_blank" rel="noopener">Instagram</a>,
    {{ t('callout.after') }}
  </section>
</template>
