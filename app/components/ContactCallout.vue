<script setup lang="ts">
import type { SiteSettings } from '#shared/types/catalog'

defineProps<{ settings: SiteSettings | null | undefined }>()
</script>

<template>
  <section v-if="settings?.telegramUrl || settings?.instagramUrl" class="rounded-[10px] border border-gold p-5 text-center text-muted">
    Если у вас остались вопросы, свяжитесь с нами в
    <a v-if="settings.telegramUrl" :href="settings.telegramUrl" class="text-gold-dark hover:underline" target="_blank" rel="noopener">Telegram</a>
    <template v-if="settings.telegramUrl && settings.instagramUrl"> или </template>
    <a v-if="settings.instagramUrl" :href="settings.instagramUrl" class="text-gold-dark hover:underline" target="_blank" rel="noopener">Instagram</a>,
    наш специалист проконсультирует вас.
  </section>
</template>
