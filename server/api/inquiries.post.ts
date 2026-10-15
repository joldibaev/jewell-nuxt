import { DEFAULT_LOCALE, isLocale, type Locale } from '../../shared/utils/locale'

// Мягкое ограничение частоты в памяти процесса: защита от случайных повторов и примитивного спама.
const recent = new Map<string, number[]>()
const WINDOW_MS = 10 * 60_000
const MAX_PER_WINDOW = 5

const MESSAGES: Record<Locale, { invalid: string; tooMany: string }> = {
  ru: { invalid: 'Укажите имя и корректный номер телефона', tooMany: 'Слишком много заявок, попробуйте позже' },
  en: { invalid: 'Enter your name and a valid phone number', tooMany: 'Too many requests, please try again later' },
  uz: { invalid: 'Ismingiz va to‘g‘ri telefon raqamini kiriting', tooMany: 'Juda ko‘p so‘rov, keyinroq urinib ko‘ring' },
}

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event)
  const text = (key: string, max: number) => (typeof body?.[key] === 'string' ? (body[key] as string).trim().slice(0, max) : '')

  // Скрытое поле-приманка: люди его не заполняют. Отвечаем «успехом», чтобы не подсказывать боту.
  if (text('website', 100)) return { ok: true }

  const requested = text('locale', 8)
  const messages = MESSAGES[isLocale(requested) ? requested : DEFAULT_LOCALE]
  const name = text('name', 256)
  const phone = text('phone', 32)
  const message = text('message', 2000)
  const digits = phone.replace(/\D/g, '')
  if (!name || digits.length < 7 || digits.length > 15) {
    throw createError({ statusCode: 400, statusMessage: messages.invalid })
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const now = Date.now()
  const hits = (recent.get(ip) || []).filter(t => now - t < WINDOW_MS)
  if (hits.length >= MAX_PER_WINDOW) {
    throw createError({ statusCode: 429, statusMessage: messages.tooMany })
  }
  recent.set(ip, [...hits, now])

  await strapiCreateInquiry(event, { name, phone, message: message || null })
  return { ok: true }
})
