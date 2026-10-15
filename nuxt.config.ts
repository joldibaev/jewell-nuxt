import tailwindcss from '@tailwindcss/vite'

// IPX скачивает оригиналы только с разрешённых доменов. Домен Strapi берём из того же окружения, что и рантайм.
// Он нужен на этапе сборки, поэтому в Docker/Coolify NUXT_STRAPI_URL должна быть доступна во время build.
const strapiUrl = process.env.NUXT_STRAPI_URL

// varies: кеш Nitro рендерит страницу «обезличенным» запросом без заголовков, и canonical/og:url/JSON-LD получали бы http://localhost.
// Перечисленные заголовки передаются в рендер (и входят в ключ кеша), поэтому абсолютные адреса строятся от настоящего хоста сайта.
const pageCache = { maxAge: 60, staleMaxAge: 60 * 60, swr: true, varies: ['host', 'x-forwarded-host', 'x-forwarded-proto'] }

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/image', '@nuxtjs/i18n'],
  // Русский — язык по умолчанию без префикса в адресе (/catalogs), остальные с префиксом (/en/catalogs, /uz/catalogs).
  // Язык по браузеру не определяем: адрес однозначно задаёт язык, и страницы можно кешировать по URL.
  // SEO-теги (lang, hreflang, canonical) расставляет app/app.vue.
  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: 'ru',
    detectBrowserLanguage: false,
    locales: [
      { code: 'ru', language: 'ru-RU', name: 'Русский', file: 'ru.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'uz', language: 'uz-UZ', name: 'O‘zbekcha', file: 'uz.json' },
    ],
  },
  css: ['~/assets/css/main.css'],
  image: {
    // Без NUXT_STRAPI_URL домен не разрешён и картинки не загрузятся: это видимая ошибка, а не подмена адреса.
    domains: strapiUrl ? [new URL(strapiUrl).host] : [],
    // Только webp: IPX не кеширует результат на сервере, а кодирование avif из оригиналов в 4608px занимает секунды на каждый размер.
    // Если перед сайтом будет CDN (кеширует /_ipx/**), можно вернуть ['avif', 'webp'].
    format: ['webp'],
    quality: 75,
    // Кеш на год: имя файла в Strapi содержит хеш, при замене картинки URL меняется.
    // Для оригиналов с http-домена IPX берёт max-age из ответа Strapi (или 300 с), поэтому его заголовок игнорируем.
    // Серверный кеш готовых webp — server/middleware/ipx-cache.ts.
    ipx: { maxAge: 60 * 60 * 24 * 365, http: { maxAge: 60 * 60 * 24 * 365, ignoreCacheControl: true } },
  },
  vite: {
    plugins: [tailwindcss()],
    // Swiper подхватывается Vite «на лету» и перезагружает страницу в dev; предсобираем его заранее.
    optimizeDeps: { include: ['swiper/modules', 'swiper/vue'] },
  },
  // viewTransition отключён: в связке с асинхронными страницами после «Назад» оставался DOM предыдущей страницы.
  experimental: { viewTransition: false },
  nitro: {
    // Статику (_nuxt, public) отдаём уже сжатой gzip/brotli, а не полагаемся на прокси.
    compressPublicAssets: true,
  },
  routeRules: {
    // HTML публичных страниц считается раз в минуту, дальше отдаётся из кеша (устаревший ответ обновляется в фоне).
    // Каталог не включён: его ключ зависит от фильтров, а данные и так кешируются в /api/catalog.
    // Query у этих страниц убирает server/middleware/strip-query.ts, иначе каждый ?utm=… получил бы свою запись.
    ...Object.fromEntries(['', '/en', '/uz'].flatMap(prefix => [
      [prefix || '/', { cache: pageCache }],
      [`${prefix}/about-us`, { cache: pageCache }],
      [`${prefix}/contacts`, { cache: pageCache }],
      [`${prefix}/products/**`, { cache: pageCache }],
    ])),
    // Файлы из public без хеша в имени: месяц кеша, при замене картинки меняйте имя файла.
    '/img/**': { headers: { 'cache-control': 'public, max-age=2592000' } },
    '/favicon/**': { headers: { 'cache-control': 'public, max-age=2592000' } },
    '/fonts/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
  },
  runtimeConfig: {
    // Значения задаются только окружением (NUXT_STRAPI_URL, NUXT_STRAPI_TOKEN): подставных адресов по умолчанию нет.
    strapiUrl: '',
    strapiToken: '',
    // Отдельный токен только с правом create на заявки; читающий токен писать не должен.
    strapiInquiryToken: '',
  },
  app: {
    head: {
      titleTemplate: '%s — JeWell',
      meta: [{ name: 'theme-color', content: '#ffffff' }],
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon/favicon-16x16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicon/apple-touch-icon.png' },
        { rel: 'manifest', href: '/favicon/site.webmanifest' },
        { rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/Azbuka04.woff2', crossorigin: 'anonymous' },
        { rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/cormorant-normal-400.woff2', crossorigin: 'anonymous' },
        { rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/cormorant-italic-400.woff2', crossorigin: 'anonymous' },
      ],
    },
  },
})
