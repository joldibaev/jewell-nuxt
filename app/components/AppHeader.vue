<script setup lang="ts">
const { data: options } = await useFetch('/api/catalog-options')
const { data: settings } = await useFetch('/api/site-settings')
const route = useRoute()
const drawer = ref<{ open: () => void; close: () => void; isOpen: boolean }>()

watch(() => route.fullPath, () => drawer.value?.close())

const linkClass = 'border-b border-transparent text-lg text-nav transition-colors hover:text-gold-dark'
const drawerLink = 'block rounded-lg px-3 py-3 text-xl text-nav transition-colors hover:bg-stone-50 hover:text-gold-dark'
</script>

<template>
  <header class="sticky top-0 z-50 bg-white/95 shadow-sm">
    <div class="container flex h-16 items-center justify-between lg:h-20">
      <NuxtLink to="/" aria-label="JeWell — на главную">
        <img src="/img/logo.webp" alt="JeWell" width="104" height="40" class="h-10 w-auto">
      </NuxtLink>

      <nav class="hidden items-center gap-8 lg:flex" aria-label="Основная навигация">
        <NuxtLink to="/" :class="linkClass" exact-active-class="!border-gold">Главная</NuxtLink>

        <div class="group relative">
          <NuxtLink to="/catalogs" :class="[linkClass, 'inline-flex items-center gap-1']" active-class="!border-gold">
            Каталог
            <svg class="size-3 transition-transform group-focus-within:rotate-180 group-hover:rotate-180" viewBox="0 0 12 8" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m1 1.5 5 5 5-5" /></svg>
          </NuxtLink>
          <div v-if="options?.categories.length" class="invisible absolute left-1/2 top-full min-w-52 -translate-x-1/2 pt-3 opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
            <ul class="overflow-hidden rounded-xl bg-white py-2 shadow-lg ring-1 ring-black/5">
              <li v-for="category in options.categories" :key="category.documentId">
                <NuxtLink :to="{ path: '/catalogs', query: { categories: category.documentId } }" class="block px-5 py-2 text-nav hover:bg-stone-50 hover:text-gold-dark">{{ category.name }}</NuxtLink>
              </li>
              <li><NuxtLink to="/catalogs" class="block border-t border-stone-100 px-5 py-2 text-gold-dark hover:bg-stone-50">Весь каталог</NuxtLink></li>
            </ul>
          </div>
        </div>

        <NuxtLink to="/about-us" :class="linkClass" active-class="!border-gold">О нас</NuxtLink>
        <NuxtLink to="/contacts" :class="linkClass" active-class="!border-gold">Контакты</NuxtLink>
        <FavoritesLink />
      </nav>

      <div class="-mr-2 flex items-center lg:hidden">
        <FavoritesLink />
        <button type="button" class="grid size-11 place-items-center rounded-lg text-nav" aria-haspopup="dialog" :aria-expanded="drawer?.isOpen ?? false" aria-label="Открыть меню" @click="drawer?.open()">
        <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M3 7h18M3 12h18M3 17h18" /></svg>
        </button>
      </div>
    </div>
  </header>

  <SideDrawer ref="drawer" label="Меню" class="lg:hidden">
    <template #default="{ close }">
        <DrawerHeader close-label="Закрыть меню" @close="close">
          <img src="/img/logo.webp" alt="JeWell" width="104" height="40" class="h-9 w-auto">
        </DrawerHeader>

        <nav class="flex-1 overflow-y-auto overscroll-contain px-3 py-4" aria-label="Мобильная навигация">
          <ul class="space-y-1">
            <li><NuxtLink to="/" :class="drawerLink" exact-active-class="!text-gold-dark">Главная</NuxtLink></li>
            <li>
              <details class="group" :open="route.path === '/catalogs'">
                <summary :class="[drawerLink, 'flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden']">
                  Каталог
                  <svg class="size-4 transition-transform group-open:rotate-180" viewBox="0 0 12 8" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m1 1.5 5 5 5-5" /></svg>
                </summary>
                <ul class="mb-2 ml-3 border-l border-stone-200 pl-3">
                  <li v-for="category in options?.categories ?? []" :key="category.documentId">
                    <NuxtLink :to="{ path: '/catalogs', query: { categories: category.documentId } }" class="block rounded-lg px-3 py-2.5 text-lg text-nav hover:text-gold-dark">{{ category.name }}</NuxtLink>
                  </li>
                  <li><NuxtLink to="/catalogs" class="block rounded-lg px-3 py-2.5 text-lg text-gold-dark">Весь каталог</NuxtLink></li>
                </ul>
              </details>
            </li>
            <li><NuxtLink to="/about-us" :class="drawerLink" active-class="!text-gold-dark">О нас</NuxtLink></li>
            <li><NuxtLink to="/contacts" :class="drawerLink" active-class="!text-gold-dark">Контакты</NuxtLink></li>
          </ul>
        </nav>

        <div v-if="settings?.phone || settings?.instagramUrl || settings?.telegramUrl" class="shrink-0 space-y-2 border-t border-stone-100 px-6 py-5 text-muted">
          <a v-if="settings.phone" :href="'tel:' + settings.phone.replace(/[^\d+]/g, '')" class="block text-lg text-gold-dark">{{ settings.phone }}</a>
          <div class="flex gap-5">
            <a v-if="settings.instagramUrl" :href="settings.instagramUrl" target="_blank" rel="noopener" class="hover:text-gold-dark">Instagram</a>
            <a v-if="settings.telegramUrl" :href="settings.telegramUrl" target="_blank" rel="noopener" class="hover:text-gold-dark">Telegram</a>
          </div>
        </div>
    </template>
  </SideDrawer>
</template>
