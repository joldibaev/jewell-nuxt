<script setup lang="ts" generic="T extends string | number | undefined">
// Свой выпадающий список без библиотек: Popover API (top layer, закрытие по Esc и клику вне)
// + CSS Anchor Positioning для позиции. Там, где anchor ещё не поддержан, позиция считается из getBoundingClientRect.
const props = defineProps<{
  options: { value: T; label: string }[]
  label: string
}>()
const model = defineModel<T>()

const uid = useId()
const anchor = `--select-${uid.replace(/[^\w-]/g, '-')}`
const list = ref<HTMLElement>()
const trigger = ref<HTMLButtonElement>()
const open = ref(false)
const anchored = typeof CSS !== 'undefined' && CSS.supports('position-anchor', '--a')

const selected = computed(() => props.options.find(o => o.value === model.value) ?? props.options[0])
const optionEls = () => [...(list.value?.querySelectorAll<HTMLElement>('[role=option]') ?? [])]

function onToggle(event: Event) {
  open.value = (event as ToggleEvent).newState === 'open'
  if (!open.value) return
  if (!anchored && trigger.value && list.value) {
    const r = trigger.value.getBoundingClientRect()
    Object.assign(list.value.style, { top: `${r.bottom + 4}px`, left: `${r.left}px`, width: `${r.width}px` })
  }
  const els = optionEls()
  ;(els.find(el => el.getAttribute('aria-selected') === 'true') ?? els[0])?.focus()
}

function choose(value: T) {
  model.value = value
  list.value?.hidePopover()
  trigger.value?.focus()
}

function onTriggerKey(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    list.value?.showPopover()
  }
}

let typed = ''
let typedTimer: ReturnType<typeof setTimeout> | undefined
function onListKey(event: KeyboardEvent) {
  const els = optionEls()
  const index = els.indexOf(document.activeElement as HTMLElement)
  const move = (to: number) => { event.preventDefault(); els[(to + els.length) % els.length]?.focus() }
  if (event.key === 'ArrowDown') move(index + 1)
  else if (event.key === 'ArrowUp') move(index - 1)
  else if (event.key === 'Home') move(0)
  else if (event.key === 'End') move(els.length - 1)
  else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    if (index >= 0) choose(props.options[index]!.value)
  } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
    // Поиск по первым буквам, как у обычного select.
    typed += event.key.toLowerCase()
    clearTimeout(typedTimer)
    typedTimer = setTimeout(() => { typed = '' }, 600)
    const hit = els.findIndex(el => el.textContent?.trim().toLowerCase().startsWith(typed))
    if (hit >= 0) els[hit]!.focus()
  }
}
onBeforeUnmount(() => clearTimeout(typedTimer))
</script>

<template>
  <div class="relative">
    <button
      ref="trigger"
      type="button"
      role="combobox"
      class="flex w-full items-center justify-between gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2 text-left text-ink transition-colors hover:border-gold focus-visible:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30"
      :style="{ anchorName: anchor }"
      :popovertarget="`${uid}-list`"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-controls="`${uid}-list`"
      :aria-label="`${props.label}: ${selected?.label}`"
      @keydown="onTriggerKey"
    >
      <span class="truncate">{{ selected?.label }}</span>
      <svg class="size-3 shrink-0 text-nav transition-transform" :class="open ? 'rotate-180' : ''" viewBox="0 0 12 8" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m1 1.5 5 5 5-5" /></svg>
    </button>

    <ul
      :id="`${uid}-list`"
      ref="list"
      popover="auto"
      role="listbox"
      :aria-label="props.label"
      class="select-list"
      :style="{ positionAnchor: anchor }"
      @toggle="onToggle"
      @keydown="onListKey"
    >
      <li
        v-for="option in props.options"
        :key="String(option.value)"
        role="option"
        tabindex="-1"
        :aria-selected="option.value === model"
        class="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-ink outline-none hover:bg-stone-50 focus-visible:bg-stone-100"
        :class="option.value === model ? 'text-gold-dark' : ''"
        @click="choose(option.value)"
      >
        <span>{{ option.label }}</span>
        <svg v-if="option.value === model" class="size-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 8.5 3.2 3.2L13 4.8" /></svg>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.select-list {
  inset: auto;
  margin: 0;
  padding: 0.25rem;
  min-width: 10rem;
  max-height: min(20rem, calc(100dvh - 2rem));
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 0;
  border-radius: 0.75rem;
  background: #fff;
  box-shadow: 0 10px 30px rgb(0 0 0 / 0.12), 0 0 0 1px rgb(0 0 0 / 0.05);
  position: fixed;
}
@supports (position-anchor: --a) {
  .select-list {
    top: calc(anchor(bottom) + 4px);
    left: anchor(left);
    width: anchor-size(width);
    /* Если снизу не хватает места — список раскрывается вверх. */
    position-try-fallbacks: flip-block;
  }
}
/* Плавное появление без JS; allow-discrete нужен, чтобы анимировать display/overlay popover. */
.select-list { opacity: 0; transform: translateY(-4px); transition: opacity 0.15s, transform 0.15s, overlay 0.15s allow-discrete, display 0.15s allow-discrete; }
.select-list:popover-open { opacity: 1; transform: none; }
@starting-style { .select-list:popover-open { opacity: 0; transform: translateY(-4px); } }
@media (prefers-reduced-motion: reduce) { .select-list { transition: none; } }
</style>
