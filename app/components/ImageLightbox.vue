<script setup lang="ts">
import type { Media } from '#shared/types/catalog'

// Полноэкранный просмотр фото на нативном <dialog>: Esc, фокус-ловушка и инертная страница без доп. кода.
// Стрелки клавиатуры и кнопки листают фото; крупная картинка создаётся только для открытого окна.
const props = defineProps<{ images: Media[]; alt: string }>()
const dialog = ref<HTMLDialogElement>()
const index = ref(0)
const shown = ref(false)

const current = computed(() => props.images[index.value])
const many = computed(() => props.images.length > 1)

async function open(at = 0) {
  index.value = at
  shown.value = true
  await nextTick()
  dialog.value?.showModal()
}
function step(delta: number) {
  index.value = (index.value + delta + props.images.length) % props.images.length
}
function onKey(event: KeyboardEvent) {
  if (event.key === 'ArrowRight') step(1)
  else if (event.key === 'ArrowLeft') step(-1)
}
function onBackdrop(event: MouseEvent) {
  if (event.target === dialog.value) dialog.value?.close()
}

defineExpose({ open })
</script>

<template>
  <dialog
    ref="dialog"
    aria-label="Просмотр фотографий"
    class="fixed inset-0 m-0 size-full max-h-none max-w-none bg-black/90 p-0 backdrop:bg-transparent"
    @click="onBackdrop"
    @keydown="onKey"
    @close="shown = false"
  >
    <template v-if="shown && current">
      <StrapiImage
        :media="current"
        :alt="`${alt} — фото ${index + 1} из ${images.length}`"
        :width="1600"
        priority
        img-class="absolute inset-0 m-auto max-h-full max-w-full object-contain p-4 sm:p-10"
      />
      <button type="button" class="absolute right-3 top-3 grid size-12 place-items-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20" aria-label="Закрыть" @click="dialog?.close()">
        <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>
      <template v-if="many">
        <button type="button" class="absolute left-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20" aria-label="Предыдущее фото" @click="step(-1)">
          <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
        </button>
        <button type="button" class="absolute right-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20" aria-label="Следующее фото" @click="step(1)">
          <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
        </button>
        <p class="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80" aria-hidden="true">{{ index + 1 }} / {{ images.length }}</p>
      </template>
    </template>
  </dialog>
</template>
