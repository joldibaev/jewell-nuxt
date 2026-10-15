// Публичные страницы не используют query, а кеш страниц (routeRules в nuxt.config.ts) ключуется по полному URL.
// Без этого `/?x=1`, `/?x=2`… создавали бы бесконечно много записей в памяти процесса.
const STATIC_PAGES = new Set(['/', '/about-us', '/contacts'])

export default defineEventHandler((event) => {
  const [path, query] = event.path.split('?')
  if (query === undefined || !path || !(STATIC_PAGES.has(path) || path.startsWith('/products/'))) return
  event.node.req.url = path
})
