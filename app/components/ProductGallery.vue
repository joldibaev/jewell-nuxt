<script setup lang="ts">
import type { Media, PreviewPosition } from '#shared/types/catalog'
import type { Swiper as SwiperInstance } from 'swiper/types'
import { A11y, FreeMode, Keyboard, Navigation, Thumbs } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/vue'

// Галерея товара: большое фото + миниатюры (один экземпляр Swiper на страницу).
// В галерее обычно 1–6 фото, поэтому Virtual не нужен: обычная ленивая загрузка кадров достаточно.
const props = defineProps<{ images: Media[]; name: string; position: PreviewPosition | null }>()

// shallowRef: экземпляр Swiper не должен становиться глубоко реактивным.
const thumbs = shallowRef<SwiperInstance | null>(null)
const lightbox = ref<{ open: (index: number) => void }>()
const active = ref(0)
const many = computed(() => props.images.length > 1)

const objectPosition = computed(() => previewPositionClass(props.position) ?? '')
</script>

<template>
  <div class="min-w-0">
    <div v-if="!images.length" class="grid aspect-3/4 place-items-center rounded-[10px] bg-neutral-200 text-muted">Фото скоро появится</div>

    <template v-else>
      <Swiper
        class="product-gallery rounded-[10px] bg-neutral-100"
        :modules="[Navigation, Thumbs, Keyboard, A11y]"
        :navigation="many"
        :keyboard="{ enabled: true }"
        :thumbs="{ swiper: thumbs && !thumbs.destroyed ? thumbs : null }"
        :a11y="{ prevSlideMessage: 'Предыдущее фото', nextSlideMessage: 'Следующее фото' }"
        :space-between="10"
        @slide-change="active = $event.activeIndex"
      >
        <SwiperSlide v-for="(image, i) in images" :key="image.url">
          <button type="button" class="block w-full cursor-zoom-in" :aria-label="`Увеличить фото ${i + 1} из ${images.length}`" @click="lightbox?.open(i)">
            <StrapiImage
              :media="image"
              :alt="`${name} — фото ${i + 1}`"
              sizes="xs:100vw sm:100vw md:100vw lg:416px"
              :priority="i === 0"
              :img-class="`aspect-3/4 w-full object-cover ${objectPosition}`"
            />
          </button>
        </SwiperSlide>
      </Swiper>

      <Swiper
        v-if="many"
        class="product-thumbs mt-3"
        :modules="[FreeMode, Thumbs, A11y]"
        :slides-per-view="4"
        :space-between="10"
        free-mode
        watch-slides-progress
        @swiper="thumbs = $event"
      >
        <SwiperSlide v-for="(image, i) in images" :key="image.url" class="!cursor-pointer">
          <StrapiImage
            :media="image"
            :alt="`Миниатюра ${i + 1}`"
            sizes="xs:25vw lg:200px"
            :img-class="`aspect-square w-full rounded-[10px] bg-neutral-200 object-cover transition-opacity ${i === active ? 'opacity-100 ring-2 ring-inset ring-gold' : 'opacity-70 hover:opacity-100'}`"
          />
        </SwiperSlide>
      </Swiper>

      <ImageLightbox ref="lightbox" :images="images" :alt="name" />
    </template>
  </div>
</template>
