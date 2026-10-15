<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const notFound = computed(() => props.error.statusCode === 404)
useSeoMeta({ title: () => notFound.value ? 'Страница не найдена' : 'Ошибка', robots: 'noindex' })
</script>

<template>
  <NuxtLayout>
    <section class="py-16 text-center">
      <p class="mb-2 font-serif text-7xl italic text-gold">{{ error.statusCode }}</p>
      <h1 class="section-title">{{ notFound ? 'Страница не найдена' : 'Что-то пошло не так' }}</h1>
      <p class="mb-8 text-muted">
        {{ notFound ? 'Возможно, украшение снято с продажи или ссылка устарела.' : 'Попробуйте обновить страницу чуть позже.' }}
      </p>
      <div class="flex flex-wrap justify-center gap-3">
        <button type="button" class="btn" @click="clearError({ redirect: '/catalogs' })">В каталог</button>
        <button type="button" class="btn" @click="clearError({ redirect: '/' })">На главную</button>
      </div>
    </section>
  </NuxtLayout>
</template>
