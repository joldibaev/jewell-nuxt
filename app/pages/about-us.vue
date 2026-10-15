<script setup lang="ts">
const { t, locale } = useI18n()
const { data, error, refresh } = await useFetch('/api/about', { query: { locale } })
const localePath = useLocalePath()
const socialImage = useSocialImage()
const origin = useRequestURL().origin
usePageSeo({
  title: () => t('common.about'),
  // Короткий текст (одна фраза) плохой сниппет: тогда берём общее описание страницы.
  description: () => (data.value?.text?.length ?? 0) >= 50 ? shortText(data.value!.text) : t('seo.aboutDescription'),
  image: () => socialImage(data.value?.image),
})
useJsonLd(() => [
  { '@type': 'AboutPage', name: t('common.about'), url: origin + localePath('/about-us'), inLanguage: locale.value, about: { '@type': 'Organization', name: 'JeWell' } },
  breadcrumbList(origin, [{ name: t('common.home'), url: localePath('/') }, { name: t('common.about'), url: localePath('/about-us') }]),
])
</script>

<template>
  <h1 class="section-title">{{ t('common.about') }}</h1>

  <StatusMessage v-if="error" kind="error">
    {{ t('about.loadError') }}
    <template #actions><button type="button" class="btn" @click="refresh()">{{ t('common.retry') }}</button></template>
  </StatusMessage>

  <template v-else-if="data">
    <section class="mb-14 grid items-center gap-8 md:grid-cols-2 md:gap-12">
      <div>
        <h2 v-if="data.heading" class="mb-4 text-3xl italic text-gold md:text-4xl">{{ data.heading }}</h2>
        <p v-if="data.text" class="whitespace-pre-line text-lg">{{ data.text }}</p>
      </div>
      <StrapiImage intrinsic v-if="data.image" :media="data.image" :alt="data.image.alternativeText || data.heading || t('common.about')" sizes="xs:100vw md:50vw xl:600px" priority img-class="w-full rounded-xl" />
    </section>

    <PageSection v-if="data.partners.length" :title="t('about.partners')">
      <ul class="space-y-10">
        <li v-for="(partner, i) in data.partners" :key="partner.name" class="grid items-center gap-8 md:grid-cols-2 md:gap-12">
          <div v-if="partner.image" :class="{ 'md:order-2': i % 2 === 1 }">
            <StrapiImage intrinsic :media="partner.image" :alt="partner.image.alternativeText || partner.name" sizes="xs:100vw md:50vw xl:600px" img-class="w-full rounded-xl" />
          </div>
          <div>
            <h3 class="mb-3 text-3xl italic text-gold">{{ partner.name }}</h3>
            <p v-if="partner.description" class="whitespace-pre-line text-lg">{{ partner.description }}</p>
            <a v-if="partner.linkUrl && partner.linkLabel" :href="partner.linkUrl" rel="noopener" class="mt-4 inline-block text-2xl italic text-gold-dark hover:underline">{{ partner.linkLabel }}</a>
          </div>
        </li>
      </ul>
    </PageSection>
  </template>
</template>
