// Мягкое ограничение частоты в памяти процесса: защита от случайных повторов и примитивного спама.
const recent = new Map<string, number[]>()
const WINDOW_MS = 10 * 60_000
const MAX_PER_WINDOW = 5

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event)
  const text = (key: string, max: number) => (typeof body?.[key] === 'string' ? (body[key] as string).trim().slice(0, max) : '')

  // Скрытое поле-приманка: люди его не заполняют. Отвечаем «успехом», чтобы не подсказывать боту.
  if (text('website', 100)) return { ok: true }

  const name = text('name', 256)
  const phone = text('phone', 32)
  const message = text('message', 2000)
  const digits = phone.replace(/\D/g, '')
  if (!name || digits.length < 7 || digits.length > 15) {
    throw createError({ statusCode: 400, statusMessage: 'Укажите имя и корректный номер телефона' })
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const now = Date.now()
  const hits = (recent.get(ip) || []).filter(t => now - t < WINDOW_MS)
  if (hits.length >= MAX_PER_WINDOW) {
    throw createError({ statusCode: 429, statusMessage: 'Слишком много заявок, попробуйте позже' })
  }
  recent.set(ip, [...hits, now])

  await strapiCreateInquiry(event, { name, phone, message: message || null })
  return { ok: true }
})
