<script setup lang="ts">
const form = reactive({ name: '', phone: '', message: '', website: '' })
const state = ref<'idle' | 'sending' | 'sent' | 'error'>('idle')
const errorText = ref('')

async function submit() {
  state.value = 'sending'
  try {
    await $fetch('/api/inquiries', { method: 'POST', body: form })
    Object.assign(form, { name: '', phone: '', message: '', website: '' })
    state.value = 'sent'
  } catch (e) {
    // Текст ошибки лежит в теле ответа: в строке статуса HTTP кириллицу передать нельзя, и statusMessage там пустой.
    // Нет тела ответа вообще — значит, до сервера не достучались (сеть), это отдельное состояние со своим текстом.
    const body = (e as { data?: { statusMessage?: string } }).data
    errorText.value = body?.statusMessage ?? 'Нет связи с сервером. Проверьте подключение и попробуйте снова.'
    state.value = 'error'
  }
}

const field = 'w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-ink placeholder:text-stone-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30'
</script>

<template>
  <section class="rounded-[10px] border border-gold p-4 md:p-6" aria-labelledby="consult-title">
    <div class="mb-6 text-center">
      <h2 id="consult-title" class="mb-1 text-2xl uppercase tracking-wide text-gold-dark md:text-3xl">Быстрая консультация</h2>
      <p class="text-muted">Заполните форму, и наш специалист свяжется с вами в ближайшее время</p>
    </div>

    <p v-if="state === 'sent'" role="status" class="py-6 text-center text-lg text-gold-dark">Спасибо! Мы скоро свяжемся с вами.</p>

    <form v-else class="grid gap-4 lg:grid-cols-2" @submit.prevent="submit">
      <label class="block">
        <span class="sr-only">Ваше имя</span>
        <input v-model="form.name" :class="field" name="name" autocomplete="name" placeholder="Ваше имя*" required maxlength="256">
      </label>
      <label class="block">
        <span class="sr-only">Номер вашего телефона</span>
        <input v-model="form.phone" :class="field" name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="Номер вашего телефона*" required maxlength="32" pattern="[+0-9()\s\-]{7,32}" title="Номер телефона, например +998 90 123 45 67">
      </label>
      <label class="block lg:col-span-2">
        <span class="mb-1 block text-muted">или напишите нам сообщение</span>
        <textarea v-model="form.message" :class="[field, 'field-sizing-content min-h-12']" name="message" placeholder="Ваше сообщение" maxlength="2000" />
      </label>
      <!-- Приманка для ботов: скрыта от людей и скринридеров. -->
      <input v-model="form.website" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" class="absolute -left-2499.75 size-px opacity-0">
      <div class="lg:col-span-2">
        <p v-if="state === 'error'" role="alert" class="mb-3 text-sm text-red-700">{{ errorText }}</p>
        <button type="submit" class="btn w-full disabled:opacity-60" :disabled="state === 'sending'">
          {{ state === 'sending' ? 'Отправляем…' : 'Отправить' }}
        </button>
      </div>
    </form>
  </section>
</template>
