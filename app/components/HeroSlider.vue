<script setup lang="ts">
import type { Media } from '#shared/types/catalog'
import { A11y, Autoplay, Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/vue'

defineProps<{ banners: Media[] }>()
const modules = [Navigation, Pagination, Autoplay, A11y]
</script>

<template>
  <Swiper
    class="hero-swiper overflow-hidden rounded-xl"
    :modules="modules"
    :loop="banners.length > 1"
    :autoplay="{ delay: 5000, pauseOnMouseEnter: true, disableOnInteraction: false }"
    navigation
    :pagination="{ clickable: true }"
    :a11y="{ prevSlideMessage: 'Предыдущий баннер', nextSlideMessage: 'Следующий баннер' }"
    aria-label="Баннеры"
  >
    <SwiperSlide v-for="(banner, i) in banners" :key="banner.url">
      <!-- Только первый баннер влияет на LCP: он грузится с высоким приоритетом, остальные лениво. -->
      <StrapiImage
        :media="banner"
        sizes="xs:100vw sm:100vw md:100vw lg:100vw xl:1184px"
        :priority="i === 0"
        img-class="aspect-16/9 w-full object-cover xl:aspect-21/9"
      />
    </SwiperSlide>
  </Swiper>
</template>
