import { createHash } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// IPX сам ничего не кеширует: каждый запрос заново скачивает оригинал из Strapi и кодирует webp.
// Этот слой сохраняет готовые ответы /_ipx на диск и отдаёт их без sharp и без обращения к Strapi.
// Имя файла Strapi содержит хеш, поэтому при замене картинки меняется URL и устаревших записей не бывает.
// Чтобы кеш переживал деплой, смонтируйте volume в IPX_CACHE_DIR (по умолчанию каталог во временной папке).
const CACHE_DIR = process.env.IPX_CACHE_DIR || join(tmpdir(), 'jewell-ipx-cache')
const MAX_BYTES = 8 * 1024 * 1024
const CACHE_CONTROL = 'public, max-age=31536000, immutable'
const ready = mkdir(CACHE_DIR, { recursive: true }).catch(() => undefined)

function fileFor(key: string) {
  return join(CACHE_DIR, key.slice(0, 2), key)
}

export default defineEventHandler(async (event) => {
  const url = event.path
  if (!url.startsWith('/_ipx/') || (event.method !== 'GET' && event.method !== 'HEAD')) return

  const key = createHash('sha1').update(url).digest('hex')
  const etag = `"${key}"`
  const file = fileFor(key)

  // Запись: «content-type\n» + тело. Ошибка чтения — это просто промах кеша.
  const cached = await readFile(file).catch(() => null)
  if (cached) {
    const split = cached.indexOf(10)
    if (split > 0) {
      setResponseHeaders(event, { 'content-type': cached.subarray(0, split).toString(), 'cache-control': CACHE_CONTROL, etag, 'x-ipx-cache': 'HIT' })
      if (getRequestHeader(event, 'if-none-match') === etag) return sendNoContent(event, 304)
      return event.method === 'HEAD' ? '' : cached.subarray(split + 1)
    }
  }

  // Промах: пропускаем запрос в IPX и копируем его ответ, пока он уходит клиенту.
  const res = event.node.res
  const chunks: Buffer[] = []
  let size = 0
  let overflow = false
  const write = res.write.bind(res)
  const end = res.end.bind(res)
  const collect = (chunk: unknown) => {
    if (!chunk || typeof chunk === 'function' || overflow) return
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string)
    size += buf.length
    if (size > MAX_BYTES) overflow = true
    else chunks.push(buf)
  }
  res.setHeader('x-ipx-cache', 'MISS')
  res.write = ((chunk: unknown, ...args: unknown[]) => { collect(chunk); return (write as (...a: unknown[]) => boolean)(chunk, ...args) }) as typeof res.write
  res.end = ((chunk?: unknown, ...args: unknown[]) => {
    collect(chunk)
    const type = String(res.getHeader('content-type') || '')
    if (res.statusCode === 200 && !overflow && chunks.length && type.startsWith('image/')) {
      const target = fileFor(key)
      const tmp = `${target}.${process.pid}.${Date.now()}.tmp`
      ready
        .then(() => mkdir(join(CACHE_DIR, key.slice(0, 2)), { recursive: true }))
        .then(() => writeFile(tmp, Buffer.concat([Buffer.from(`${type}\n`), ...chunks])))
        .then(() => rename(tmp, target))
        .catch(error => console.error('[ipx-cache] write failed', (error as Error).message))
    }
    return (end as (...a: unknown[]) => typeof res)(chunk, ...args)
  }) as typeof res.end
})
