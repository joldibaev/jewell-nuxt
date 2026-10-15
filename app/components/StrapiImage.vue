<script setup lang="ts">
import type { Media } from '#shared/types/catalog'

// Единая точка вывода картинок из Strapi: оригиналы большие (до 4608px), поэтому всегда идём через IPX —
// он отдаёт webp нужной ширины. `sizes` в синтаксисе Nuxt Image: «xs:100vw sm:50vw xl:400px».
// ВАЖНО: каждая запись `sizes` с явным брейкпоинтом (xs:/sm:/…). Голое «100vw» даёт кандидатов w_1/w_2, то есть картинку шириной 2px.
// width/height оригинала НЕ передаём: IPX воспринял бы их как целевой размер и отдал бы полноразмерную картинку.
// densities всегда x1: в srcset с `w`-дескрипторами браузер сам берёт файл под плотность экрана (iPhone 390px → 1184w),
// а «2x»-копии вдвое увеличивали число размеров, которые IPX кодирует и хранит на диске.
// Место под картинку резервирует контейнер (aspect-ratio), поэтому сдвигов вёрстки нет.
const props = withDefaults(defineProps<{
  media: Media
  sizes?: string
  /** Фиксированная ширина вместо `sizes` — для окон, где размер не зависит от вёрстки (лайтбокс). */
  width?: number
  alt?: string
  priority?: boolean
  /** Резервировать место по пропорциям файла из Strapi. Не нужно, когда размер задаёт контейнер или класс aspect-*. */
  intrinsic?: boolean
  imgClass?: string
}>(), { priority: false })

// alt берётся только из Strapi (поле «Альтернативный текст» у файла); пустой alt — осознанно декоративная картинка.
// Пропорции берём из метаданных Strapi: место под картинку резервируется до загрузки (иначе ленивая загрузка не срабатывает на нулевой высоте).
const aspectRatio = computed(() => props.intrinsic && props.media.width && props.media.height ? props.media.width / props.media.height : undefined)
const alt = computed(() => props.alt ?? props.media.alternativeText ?? '')
</script>

<template>
  <NuxtImg
    :src="media.url"
    format="webp"
    :sizes="sizes"
    :width="width"
    :densities="'x1'"
    :alt="alt"
    :loading="priority ? 'eager' : 'lazy'"
    :fetchpriority="priority ? 'high' : 'auto'"
    :preload="priority"
    decoding="async"
    :class="imgClass"
    :style="aspectRatio ? { aspectRatio } : undefined"
  />
</template>
