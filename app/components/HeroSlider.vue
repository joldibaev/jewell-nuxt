<script setup lang="ts">
import type { Banner } from '#shared/types/catalog'
import { A11y, Autoplay, Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/vue'

defineProps<{ banners: Banner[] }>()
const modules = [Navigation, Pagination, Autoplay, A11y]
const { t } = useI18n()
</script>

<template>
  <Swiper
    class="hero-swiper overflow-hidden rounded-xl"
    :modules="modules"
    :loop="banners.length > 1"
    :autoplay="{ delay: 5000, pauseOnMouseEnter: true, disableOnInteraction: false }"
    navigation
    :pagination="{ clickable: true }"
    :a11y="{ prevSlideMessage: t('home.prevBanner'), nextSlideMessage: t('home.nextBanner') }"
    :aria-label="t('home.banners')"
  >
    <SwiperSlide v-for="(banner, i) in banners" :key="banner.url"
      :style="{
        '--banner-zoom': banner.frames.mobile.fit === 'contain' ? 1 : (banner.frames.mobile.zoom ?? 1),
        '--banner-desktop-zoom': banner.frames.desktop.fit === 'contain' ? 1 : (banner.frames.desktop.zoom ?? 1),
        '--banner-fit': banner.frames.mobile.fit,
        '--banner-position': banner.frames.mobile.fit === 'contain' ? '50% 50%' : `${banner.frames.mobile.x}% ${banner.frames.mobile.y}%`,
        '--banner-desktop-fit': banner.frames.desktop.fit,
        '--banner-desktop-position': banner.frames.desktop.fit === 'contain' ? '50% 50%' : `${banner.frames.desktop.x}% ${banner.frames.desktop.y}%`,
      }">
      <!-- Только первый баннер влияет на LCP: он грузится с высоким приоритетом, остальные лениво. -->
      <div class="relative aspect-16/9 overflow-hidden xl:aspect-21/9">
      <StrapiImage
        :media="banner"
        sizes="xs:100vw sm:100vw md:100vw lg:100vw xl:1184px"
        :alt="banner.alternativeText || t('home.bannerAlt', { n: i + 1 })"
        :priority="i === 0"
        img-class="absolute inset-0 size-full object-cover"
      />
      </div>
    </SwiperSlide>
  </Swiper>
</template>

<style scoped>
.hero-swiper :deep(img) {
  background: #f5f2ed;
  transform: scale(var(--banner-zoom, 1));
  transform-origin: var(--banner-position, 50% 50%);
  object-fit: var(--banner-fit, cover);
  object-position: var(--banner-position, 50% 50%);
}
@media (min-width: 1280px) {
  .hero-swiper :deep(img) {
    transform: scale(var(--banner-desktop-zoom, 1));
    transform-origin: var(--banner-desktop-position, 50% 50%);
    object-fit: var(--banner-desktop-fit, cover);
    object-position: var(--banner-desktop-position, 50% 50%);
  }
}
</style>
