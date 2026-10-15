<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const notFound = computed(() => props.error.statusCode === 404)
const { t } = useI18n()
const localePath = useLocalePath()
useSeoMeta({ title: () => notFound.value ? t('seo.notFound') : t('seo.error'), robots: 'noindex' })
</script>

<template>
  <NuxtLayout>
    <section class="py-16 text-center">
      <p class="mb-2 font-serif text-7xl italic text-gold">{{ error.statusCode }}</p>
      <h1 class="section-title">{{ notFound ? t('error.title404') : t('error.titleOther') }}</h1>
      <p class="mb-8 text-muted">
        {{ notFound ? t('error.text404') : t('error.textOther') }}
      </p>
      <div class="flex flex-wrap justify-center gap-3">
        <button type="button" class="btn" @click="clearError({ redirect: localePath('/catalogs') })">{{ t('error.toCatalog') }}</button>
        <button type="button" class="btn" @click="clearError({ redirect: localePath('/') })">{{ t('error.toHome') }}</button>
      </div>
    </section>
  </NuxtLayout>
</template>
