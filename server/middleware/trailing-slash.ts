// /about-us/ и /about-us — один и тот же адрес для поисковиков, поэтому дубль со слэшем в конце редиректим на основной адрес.
// Главная ('/') остаётся как есть; технические пути (/api, /_nuxt, /_ipx) не трогаем.
export default defineEventHandler((event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return
  const [path, query] = event.path.split('?')
  if (!path || path.length < 2 || !path.endsWith('/') || path.startsWith('/api/') || path.startsWith('/_')) return
  return sendRedirect(event, path.replace(/\/+$/, '') + (query ? '?' + query : ''), 301)
})
