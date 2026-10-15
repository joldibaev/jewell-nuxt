<script setup lang="ts">
useSeoMeta({ title: 'Контакты' })
const { data: s, error, refresh } = await useFetch('/api/site-settings')
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
  <h1 class="section-title">Контакты</h1>

  <StatusMessage v-if="error" kind="error">
    Не удалось загрузить контакты.
    <template #actions><button type="button" class="btn" @click="refresh()">Повторить</button></template>
  </StatusMessage>

  <template v-else-if="s">
    <section class="mb-14 grid gap-8 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.4fr]">
      <div class="space-y-5">
        <ContactBlock v-if="s.phone" title="Телефон"><a :href="telHref" :class="link">{{ s.phone }}</a></ContactBlock>
        <ContactBlock v-if="s.workingHours" title="Приём заявок">{{ s.workingHours }}</ContactBlock>
        <ContactBlock v-if="s.email" title="Электронная почта"><a :href="`mailto:${s.email}`" :class="link">{{ s.email }}</a></ContactBlock>
      </div>
      <div class="space-y-5">
        <ContactBlock v-if="socials.length" title="Мы в социальных сетях">
          <ul class="flex flex-wrap gap-x-4">
            <li v-for="item in socials" :key="item.label"><a :href="item.url!" target="_blank" rel="noopener" :class="link">{{ item.label }}</a></li>
          </ul>
        </ContactBlock>
        <ContactBlock v-if="s.legalDetails" title="Реквизиты компании">{{ s.legalDetails }}</ContactBlock>
        <ContactBlock v-if="s.address" title="Адрес">{{ s.address }}</ContactBlock>
      </div>
      <iframe
        v-if="s.mapEmbedUrl"
        title="Карта проезда"
        :src="s.mapEmbedUrl"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        class="h-72 w-full rounded-xl border border-stone-200 md:col-span-2 xl:col-span-1"
      />
    </section>

    <ConsultationForm class="mb-14" />

    <PageSection v-if="s.storePhotos.length" title="Наш магазин">
      <ul class="grid grid-cols-2 gap-4">
        <li v-for="(photo, i) in s.storePhotos" :key="photo.url" :class="{ 'col-span-2': i === 0 }">
          <StrapiImage intrinsic :media="photo" :sizes="i === 0 ? 'xs:100vw xl:1200px' : 'xs:50vw xl:600px'" img-class="w-full rounded-xl" />
        </li>
      </ul>
    </PageSection>
  </template>
</template>
