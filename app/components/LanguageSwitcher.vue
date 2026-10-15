<script setup lang="ts">
// Переключатель языка. Адрес задаёт язык, поэтому пункты — обычные ссылки на ту же страницу (их видят и поисковики).
// `dropdown` — компактное меню в шапке, `inline` — ряд кодов для боковой панели.
withDefaults(defineProps<{ variant?: 'dropdown' | 'inline' }>(), { variant: 'dropdown' })
const { locale, locales, t } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const route = useRoute()

const items = computed(() => locales.value.map(item => ({ code: item.code, name: item.name ?? item.code, to: switchLocalePath(item.code) })))

const menu = ref<HTMLDetailsElement>()
const close = () => { if (menu.value) menu.value.open = false }
function onOutside(event: Event) {
  if (menu.value?.open && !menu.value.contains(event.target as Node)) close()
}
function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && menu.value?.open) {
    close()
    menu.value.querySelector('summary')?.focus()
  }
}
onMounted(() => {
  document.addEventListener('pointerdown', onOutside)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onOutside)
  document.removeEventListener('keydown', onKey)
})
watch(() => route.fullPath, close)
</script>

<template>
  <ul v-if="variant === 'inline'" class="flex items-center gap-1" :aria-label="t('common.language')">
    <li v-for="item in items" :key="item.code">
      <NuxtLink
        :to="item.to"
        :hreflang="item.code"
        :lang="item.code"
        :aria-current="item.code === locale ? 'true' : undefined"
        :title="item.name"
        class="rounded-md px-2 py-1 text-lg uppercase transition-colors hover:text-gold-dark"
        :class="item.code === locale ? 'text-gold-dark' : 'text-nav'"
      >{{ item.code }}</NuxtLink>
    </li>
  </ul>

  <details v-else ref="menu" class="group relative">
    <summary
      class="flex cursor-pointer list-none items-center gap-1.5 rounded-md px-2 py-1 text-lg uppercase text-nav transition-colors hover:text-gold-dark group-open:text-gold-dark [&::-webkit-details-marker]:hidden"
      :aria-label="`${t('common.language')}: ${items.find(i => i.code === locale)?.name}`"
    >
      <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" /></svg>
      {{ locale }}
      <svg class="size-3 transition-transform group-open:rotate-180" viewBox="0 0 12 8" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m1 1.5 5 5 5-5" /></svg>
    </summary>
    <ul class="absolute right-0 top-full z-10 mt-2 min-w-40 overflow-hidden rounded-xl bg-white py-2 shadow-lg ring-1 ring-black/5">
      <li v-for="item in items" :key="item.code">
        <NuxtLink
          :to="item.to"
          :hreflang="item.code"
          :lang="item.code"
          :aria-current="item.code === locale ? 'true' : undefined"
          class="flex items-center justify-between gap-4 px-5 py-2 transition-colors hover:bg-stone-50 hover:text-gold-dark"
          :class="item.code === locale ? 'text-gold-dark' : 'text-nav'"
        >
          {{ item.name }}
          <svg v-if="item.code === locale" class="size-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 8.5 3.2 3.2L13 4.8" /></svg>
        </NuxtLink>
      </li>
    </ul>
  </details>
</template>
