<script setup lang="ts">
import type { Media, PreviewPosition } from '#shared/types/catalog'

// Полоса фото в карточке: листается свайпом (scroll-snap) и стрелками. Стрелки и точки видны всегда — как у галереи на странице товара.
// Первое фото рендерится сразу, остальные монтируются только при первом взаимодействии: в каталоге сотни карточек,
// и грузить для каждой всю галерею заранее нельзя.
const props = defineProps<{ images: Media[]; position: PreviewPosition | null; to?: string; sizes: string }>()

const NuxtLink = resolveComponent('NuxtLink')
const { t } = useI18n()
const scroller = useTemplateRef<HTMLElement>('scroller')
const activated = ref(false)
const current = ref(0)
const slides = computed(() => activated.value ? props.images : props.images.slice(0, 1))
const positionClass = computed(() => previewPositionClass(props.position))
const arrow = 'absolute top-1/2 z-20 grid size-9 -translate-y-1/2 place-items-center text-white drop-shadow-[0_1px_3px_rgb(0_0_0/0.45)] transition-opacity disabled:opacity-35'
const canScroll = computed(() => props.images.length > 1)

function activate() {
  if (canScroll.value) activated.value = true
}
function goTo(index: number) {
  const el = scroller.value
  if (el) el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' })
}
async function step(delta: number) {
  activate()
  await nextTick()
  goTo(Math.min(Math.max(current.value + delta, 0), props.images.length - 1))
}
function onScroll() {
  const el = scroller.value
  if (el) current.value = Math.round(el.scrollLeft / el.clientWidth)
}
</script>

<template>
  <div class="relative mb-4 aspect-4/3 overflow-hidden rounded-[10px] bg-neutral-300" @pointerenter="activate" @touchstart.passive="activate" @focusin="activate">
    <component :is="to ? NuxtLink : 'div'" :to="to" :tabindex="to ? -1 : undefined" :aria-hidden="to ? true : undefined" class="relative z-10 block size-full">
      <div ref="scroller" class="flex size-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" @scroll.passive="onScroll">
        <div v-for="(image, i) in slides" :key="image.url" class="size-full shrink-0 snap-center overflow-hidden">
          <StrapiImage :media="image" :sizes="sizes" :priority="false" :img-class="`size-full object-cover ${positionClass ?? ''}`" :alt="i === 0 ? undefined : ''"
            :style="image.cardFrame ? {
              objectFit: image.cardFrame.fit,
              objectPosition: image.cardFrame.fit === 'contain' ? '50% 50%' : `${image.cardFrame.x}% ${image.cardFrame.y}%`,
              transform: image.cardFrame.fit === 'contain' ? undefined : `scale(${image.cardFrame.zoom ?? 1})`,
              transformOrigin: `${image.cardFrame.x}% ${image.cardFrame.y}%`,
              background: '#f5f2ed',
            } : undefined" />
        </div>
      </div>
    </component>
    <template v-if="canScroll">
      <button type="button" :aria-label="t('product.prevPhoto')" :disabled="current === 0" :class="[arrow, 'left-0']" @click.prevent.stop="step(-1)"><svg class="size-5 rotate-180" viewBox="0 0 8 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m1.5 1 5 5-5 5" /></svg></button>
      <button type="button" :aria-label="t('product.nextPhoto')" :disabled="current === images.length - 1" :class="[arrow, 'right-0']" @click.prevent.stop="step(1)"><svg class="size-5" viewBox="0 0 8 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m1.5 1 5 5-5 5" /></svg></button>
    </template>
    <ol v-if="canScroll" class="pointer-events-none absolute inset-x-0 bottom-2 z-20 flex justify-center gap-1.5" aria-hidden="true">
      <li v-for="(image, i) in images" :key="image.url" class="size-1.5 rounded-full bg-white/70 shadow-sm transition-colors" :class="{ 'bg-gold!': i === current }" />
    </ol>
  </div>
</template>
