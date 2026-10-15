// Публичные страницы не используют query, а кеш страниц (routeRules в nuxt.config.ts) ключуется по полному URL.
// Без этого `/?x=1`, `/?x=2`… создавали бы бесконечно много записей в памяти процесса.
const STATIC_PAGES = new Set(['/', '/about-us', '/contacts'])
// Страницы других языков живут под префиксом: /en/about-us, /uz/products/…
const LOCALE_PREFIX = /^\/(?:en|uz)(?=\/|$)/

export default defineEventHandler((event) => {
  const [path, query] = event.path.split('?')
  if (query === undefined || !path) return
  const unprefixed = path.replace(LOCALE_PREFIX, '') || '/'
  if (!(STATIC_PAGES.has(unprefixed) || unprefixed.startsWith('/products/'))) return
  event.node.req.url = path
})
