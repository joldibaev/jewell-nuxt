import type { H3Event } from 'h3'
import { DEFAULT_LOCALE, LOCALES, type Locale } from '../../shared/utils/locale'
interface SitemapProduct { slug: string | null; updatedAt: string }

const PAGE_SIZE = 100
const staticPaths = ['/', '/catalogs', '/about-us', '/contacts']
const escapeXml = (value: string) => value.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '\'': '&apos;', '"': '&quot;' })[c]!)

// Список товаров из Strapi кешируется в памяти на час; адрес сайта берётся из самого запроса (за прокси это X-Forwarded-*).
let cache: { at: number; products: SitemapProduct[] } | undefined
const TTL = 60 * 60 * 1000

async function loadProducts(event: H3Event): Promise<SitemapProduct[]> {
  if (cache && Date.now() - cache.at < TTL) return cache.products
  const products: SitemapProduct[] = []
  for (let page = 1; ; page++) {
    const response = await strapiGet<SitemapProduct[]>(event, 'products', {
      status: 'published',
      fields: ['slug', 'updatedAt'],
      sort: ['id:asc'],
      pagination: { page, pageSize: PAGE_SIZE },
    })
    products.push(...response.data)
    if (page >= (response.meta.pagination?.pageCount ?? 0)) break
  }
  cache = { at: Date.now(), products }
  return products
}

export default defineEventHandler(async (event) => {
  const origin = siteOrigin(event)
  const products = await loadProducts(event)

  // Каждая страница есть на всех языках; alternate-ссылки подсказывают поисковикам, что это версии одной страницы.
  const paths = [
    ...staticPaths.map(path => ({ path, lastmod: undefined as string | undefined })),
    ...products.filter(product => product.slug).map(product => ({ path: `/products/${product.slug}`, lastmod: product.updatedAt })),
  ]
  const localized = (locale: Locale, path: string) => origin + (locale === DEFAULT_LOCALE ? '' : '/' + locale) + (path === '/' && locale !== DEFAULT_LOCALE ? '' : path)
  const entries = paths.flatMap(({ path, lastmod }) => LOCALES.map(locale => ({
    loc: localized(locale, path),
    lastmod,
    alternates: [...LOCALES.map(alt => ({ hreflang: alt as string, href: localized(alt, path) })), { hreflang: 'x-default', href: localized(DEFAULT_LOCALE, path) }],
  })))
  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=3600')
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
    + entries.map(e => `  <url><loc>${escapeXml(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}`
      + e.alternates.map(a => `<xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${escapeXml(a.href)}"/>`).join('') + '</url>').join('\n')
    + '\n</urlset>\n'
})
