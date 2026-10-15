<script setup lang="ts">
// Боковая панель на нативном <dialog>: фокус-ловушка, Esc и инертная страница из коробки.
// Анимация — CSS, без таймеров. overflow-clip, а не hidden: hidden — прокручиваемый контейнер, и фокус на кнопке внутри ещё не заехавшей
// панели прокручивал <dialog> вбок (панель мигала слева и «прыгала» вправо). У clip прокрутки нет. Закрывается Esc, кликом по фону или методом close().
const props = withDefaults(defineProps<{ label: string; side?: 'left' | 'right' }>(), { side: 'right' })
const emit = defineEmits<{ close: [] }>()

const dialog = ref<HTMLDialogElement>()
const isOpen = ref(false)

// Содержимое создаётся при первом открытии: закрытая панель не добавляет в страницу ни DOM, ни работы при гидратации.
const rendered = ref(false)

async function open() {
  rendered.value = true
  await nextTick()
  dialog.value?.showModal()
  isOpen.value = true
}
function close() {
  dialog.value?.close()
}
function onClose() {
  isOpen.value = false
  emit('close')
}
// Клик по самому <dialog> — это клик по затемнённому фону вне панели.
function onBackdrop(event: MouseEvent) {
  if (event.target === dialog.value) close()
}

defineExpose({ open, close, isOpen })
</script>

<template>
  <dialog
    ref="dialog"
    :aria-label="props.label"
    :data-side="props.side"
    class="drawer fixed inset-0 m-0 size-full max-h-none max-w-none overflow-clip bg-transparent p-0 backdrop:bg-transparent"
    @click="onBackdrop"
    @close="onClose"
  >
    <div class="drawer-scrim absolute inset-0 bg-black/40" />
    <div class="drawer-panel absolute inset-y-0 flex w-[min(88vw,22rem)] flex-col bg-white shadow-2xl" :class="props.side === 'right' ? 'right-0' : 'left-0'">
      <slot v-if="rendered" :close="close" />
    </div>
  </dialog>
</template>

<style scoped>
.drawer { visibility: hidden; transition: visibility 0.3s allow-discrete; }
.drawer[open] { visibility: visible; }
/* Открытие — @keyframes, а не @starting-style: он работает во всех мобильных браузерах и не даёт панели «прыгать». */
.drawer[open] .drawer-panel { animation: drawer-in-right 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
.drawer[open][data-side='left'] .drawer-panel { animation-name: drawer-in-left; }
.drawer[open] .drawer-scrim { animation: drawer-fade 0.3s ease both; }
@keyframes drawer-in-right { from { transform: translateX(100%); } to { transform: none; } }
@keyframes drawer-in-left { from { transform: translateX(-100%); } to { transform: none; } }
@keyframes drawer-fade { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .drawer, .drawer[open] .drawer-panel, .drawer[open] .drawer-scrim { animation: none; transition: none; }
}
</style>
