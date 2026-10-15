<script setup lang="ts">
const { t, locale } = useI18n()
const { data: s, error, refresh } = await useFetch('/api/site-settings', { query: { locale } })
const localePath = useLocalePath()
const socialImage = useSocialImage()
const origin = useRequestURL().origin
usePageSeo({
  title: () => t('common.contacts'),
  description: () => t('seo.contactsDescription'),
  image: () => socialImage(s.value?.storePhotos[0]),
})
// Магазин с адресом и телефоном: данные для карточки организации в выдаче и на картах.
useJsonLd(() => [
  {
    '@type': 'ContactPage',
    name: t('common.contacts'),
    url: origin + localePath('/contacts'),
    inLanguage: locale.value,
    mainEntity: {
      '@type': 'JewelryStore',
      '@id': origin + '/#organization',
      name: 'JeWell',
      url: origin + localePath('/'),
      image: socialImage(s.value?.storePhotos[0]),
      telephone: s.value?.phone || undefined,
      email: s.value?.email || undefined,
      address: s.value?.address ? { '@type': 'PostalAddress', streetAddress: s.value.address, addressCountry: 'UZ' } : undefined,
      sameAs: socials.value.length ? socials.value.map(item => item.url) : undefined,
    },
  },
  breadcrumbList(origin, [{ name: t('common.home'), url: localePath('/') }, { name: t('common.contacts'), url: localePath('/contacts') }]),
])
const telHref = computed(() => s.value?.phone ? 'tel:' + s.value.phone.replace(/[^\d+]/g, '') : undefined)
const link = 'text-gold-dark hover:underline'
const socials = computed(() => [
  { label: 'Instagram', url: s.value?.instagramUrl },
  { label: 'Telegram', url: s.value?.telegramUrl },
  { label: 'WhatsApp', url: s.value?.whatsappUrl },
  { label: 'Facebook', url: s.value?.facebookUrl },
].filter(item => item.url))
</script>

<template>
  <h1 class="section-title">{{ t('common.contacts') }}</h1>

  <StatusMessage v-if="error" kind="error">
    {{ t('contacts.loadError') }}
    <template #actions><button type="button" class="btn" @click="refresh()">{{ t('common.retry') }}</button></template>
  </StatusMessage>

  <template v-else-if="s">
    <section class="mb-14 grid gap-8 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.4fr]">
      <div class="space-y-5">
        <ContactBlock v-if="s.phone" :title="t('contacts.phone')"><a :href="telHref" :class="link">{{ s.phone }}</a></ContactBlock>
        <ContactBlock v-if="s.workingHours" :title="t('contacts.hours')">{{ s.workingHours }}</ContactBlock>
        <ContactBlock v-if="s.email" :title="t('contacts.email')"><a :href="`mailto:${s.email}`" :class="link">{{ s.email }}</a></ContactBlock>
      </div>
      <div class="space-y-5">
        <ContactBlock v-if="socials.length" :title="t('contacts.social')">
          <ul class="flex flex-wrap gap-x-4">
            <li v-for="item in socials" :key="item.label"><a :href="item.url!" target="_blank" rel="noopener" :class="link">{{ item.label }}</a></li>
          </ul>
        </ContactBlock>
        <ContactBlock v-if="s.legalDetails" :title="t('contacts.legal')">{{ s.legalDetails }}</ContactBlock>
        <ContactBlock v-if="s.address" :title="t('contacts.address')">{{ s.address }}</ContactBlock>
      </div>
      <MapEmbed v-if="s.mapEmbedUrl" :src="s.mapEmbedUrl" class="h-72 md:col-span-2 xl:col-span-1" />
    </section>

    <ConsultationForm class="mb-14" />

    <PageSection v-if="s.storePhotos.length" :title="t('contacts.store')">
      <ul class="grid grid-cols-2 gap-4">
        <li v-for="(photo, i) in s.storePhotos" :key="photo.url" :class="{ 'col-span-2': i === 0 }">
          <StrapiImage intrinsic :media="photo" :alt="photo.alternativeText || t('contacts.storePhotoAlt', { n: i + 1 })" :sizes="i === 0 ? 'xs:100vw xl:1200px' : 'xs:50vw xl:600px'" img-class="w-full rounded-xl" />
        </li>
      </ul>
    </PageSection>
  </template>
</template>
