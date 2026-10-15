import type { H3Event } from 'h3'
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

  const entries = [
    ...staticPaths.map(path => ({ loc: origin + path, lastmod: undefined as string | undefined })),
    ...products.filter(product => product.slug).map(product => ({ loc: `${origin}/products/${product.slug}`, lastmod: product.updatedAt })),
  ]
  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=3600')
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + entries.map(e => `  <url><loc>${escapeXml(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}</url>`).join('\n')
    + '\n</urlset>\n'
})
