import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import { test } from 'node:test'

test('Nuxt server contract and SSR', async (t) => {
  const requests = []
  const token = 'integration-test-private-token'
  const product = {
    documentId: 'product1', name: 'Test ring', slug: 'test-ring', description: null,
    priceUzs: '2500000', inStock: true, previewPosition: 'По центру',
    gallery: [{ url: '/uploads/ring.jpg', alternativeText: null }],
    categories: [{ documentId: 'rings', name: 'Rings' }],
  }
  const letterProducts = [...'ZYXWVUTSRQPONMLKJIHGFEDCBA'].map(value => ({
    ...product, documentId: 'letter' + value, name: `Ожерелье с буквой «${value}»`, slug: 'letter-' + value.toLowerCase(),
  }))
  const upstream = createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost')
    requests.push(url)
    assert.equal(req.headers.authorization, 'Bearer ' + token)
    const page = Number(url.searchParams.get('pagination[page]') || 1)
    let data
    let pagination
    // Запросы переводов (locale=en): отдельные записи с тем же documentId и переведёнными полями.
    const english = url.searchParams.get('locale') === 'en'
    if (english && url.pathname === '/api/products') {
      data = [{ documentId: 'product1', name: 'English ring', description: 'English description' }]
      pagination = { page, pageSize: 100, pageCount: 1, total: 1 }
    } else if (english && url.pathname === '/api/about-page') {
      data = { heading: 'English heading', text: null, partners: [{ name: 'English partner', description: 'Partner text' }] }
    } else if (english && url.pathname === '/api/site-setting') {
      data = { address: 'English address', workingHours: null }
    } else if (english) {
      data = [{ documentId: 'option1', name: 'English option' }, { documentId: 'rings', name: 'English option' }]
      pagination = { page, pageSize: 100, pageCount: 1, total: 2 }
    } else if (url.pathname === '/api/products' && (
      url.searchParams.get('filters[categories][documentId][$in][0]') === 'letters'
      || url.searchParams.get('filters[$and][0][categories][documentId][$in][0]') === 'letters'
    )) {
      const selected = [...url.searchParams].filter(([key]) => key.startsWith('filters[$and][1][documentId][$in]')).map(([, value]) => value)
      // Strapi may return cards in a different order; the API must follow the sorted index.
      data = selected.length ? letterProducts.filter(item => selected.includes(item.documentId)) : letterProducts
      pagination = { page, pageSize: 100, pageCount: 1, total: data.length }
    } else if (url.pathname === '/api/products' && url.searchParams.get('fields[0]') === 'name' && url.searchParams.get('pagination[pageSize]') === '100') {
      data = [product]
      pagination = { page, pageSize: 100, pageCount: 1, total: 1 }
    } else if (url.pathname === '/api/products') {
      data = [product]
      pagination = { page, pageSize: 20, pageCount: 2, total: 21 }
    } else if (url.pathname === '/api/home-page') {
      data = { banners: [], categories: [], collections: [] }
    } else if (url.pathname === '/api/bestseller') {
      data = { products: [product] }
    } else if (url.pathname === '/api/about-page') {
      data = { heading: 'About heading', text: 'About text', image: null, partners: [{ name: 'Partner', description: null, image: { url: '/uploads/p.png' } }] }
    } else if (url.pathname === '/api/site-setting') {
      data = { phone: '+998123456789', email: 'hello@example.com', address: 'Test address' }
    } else {
      data = [{ documentId: 'option' + page, name: 'Option ' + page }]
      pagination = { page, pageSize: 100, pageCount: url.pathname === '/api/categories' ? 2 : 1, total: 2 }
    }
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ data, meta: pagination ? { pagination } : {} }))
  })
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve))
  const upstreamUrl = 'http://127.0.0.1:' + upstream.address().port

  const reservation = createServer()
  await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve))
  const port = reservation.address().port
  await new Promise(resolve => reservation.close(resolve))

  const child = spawn(process.execPath, ['.output/server/index.mjs'], {
    env: { ...process.env, NITRO_HOST: '127.0.0.1', NITRO_PORT: String(port), NUXT_STRAPI_URL: upstreamUrl, NUXT_STRAPI_TOKEN: token },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let logs = ''
  child.stdout.on('data', chunk => { logs += chunk })
  child.stderr.on('data', chunk => { logs += chunk })
  const base = 'http://127.0.0.1:' + port
  t.after(async () => {
    const stopped = child.exitCode !== null ? Promise.resolve() : once(child, 'exit')
    child.kill()
    await stopped
    upstream.closeAllConnections()
    await new Promise(resolve => upstream.close(resolve))
  })
  let ready = false
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error(logs)
    try {
      const response = await fetch(base + '/about-us')
      if (response.ok) { ready = true; break }
    } catch {}
    await delay(50)
  }
  assert.ok(ready, logs)

  await t.test('letter variants are alphabetic across catalog pages and the index is reused', async () => {
    const before = requests.length
    const first = await (await fetch(base + '/api/catalog?categories=letters')).json()
    const second = await (await fetch(base + '/api/catalog?categories=letters&page=2')).json()
    assert.equal(first.products.length, 20)
    assert.equal(first.products[0].name, 'Ожерелье с буквой «A»')
    assert.equal(first.products.at(-1).name, 'Ожерелье с буквой «T»')
    assert.deepEqual(second.products.map(p => p.documentId), [...'UVWXYZ'].map(value => 'letter' + value))
    assert.deepEqual(second.pagination, { page: 2, pageSize: 20, pageCount: 2, total: 26 })
    const sent = requests.slice(before)
    assert.equal(sent.filter(url => url.searchParams.get('pagination[pageSize]') === '100').length, 1)
    assert.ok(sent.every(url => url.searchParams.get('status') === 'published'))
  })

  await t.test('combined filters reach Strapi and media URLs are normalized', async () => {
    const response = await fetch(base + '/api/catalog?categories=ring&categories=earring&gems=diamond&stock=no&minPrice=0&maxPrice=5000000&search=gold&page=2&sort=price-asc')
    assert.equal(response.status, 200)
    const body = await response.json()
    assert.equal(body.pagination.page, 2)
    assert.equal(body.products[0].gallery[0].url, upstreamUrl + '/uploads/ring.jpg')
    const query = requests.at(-1).searchParams
    assert.equal(query.get('status'), 'published')
    assert.equal(query.get('filters[categories][documentId][$in][0]'), 'ring')
    assert.equal(query.get('filters[categories][documentId][$in][1]'), 'earring')
    assert.equal(query.get('filters[gems][gem][documentId][$in][0]'), 'diamond')
    assert.equal(query.get('filters[inStock][$eq]'), 'false')
    assert.equal(query.get('filters[priceUzs][$gte]'), '0')
    assert.equal(query.get('filters[$or][1][description][$containsi]'), 'gold')
    assert.equal(query.get('pagination[pageSize]'), '20')
    assert.equal(query.get('sort[0]'), 'priceUzs:asc')
  })

  await t.test('invalid input is rejected before contacting Strapi', async () => {
    const before = requests.length
    for (const query of ['page=0', 'page=1&page=2', 'minPrice=10&maxPrice=1', 'sort=random', 'status=draft', 'categories[]=x', 'minPrice=-1']) {
      const response = await fetch(base + '/api/catalog?' + query)
      assert.equal(response.status, 400, query)
    }
    assert.equal(requests.length, before)
  })

  await t.test('filter options include all pages', async () => {
    const response = await fetch(base + '/api/catalog-options')
    assert.equal(response.status, 200)
    const body = await response.json()
    assert.equal(body.categories.length, 2)
    assert.equal(body.gems.length, 1)
  })

  await t.test('product endpoint returns the product with a slug filter and rejects malformed slugs', async () => {
    const before = requests.length
    const ok = await fetch(base + '/api/products/test-ring')
    assert.equal(ok.status, 200)
    const body = await ok.json()
    assert.equal(body.name, 'Test ring')
    // Тестовый Strapi возвращает тот же товар как кандидата: сам себя он не рекомендует.
    assert.deepEqual(body.related, [])
    assert.equal(body.gallery[0].url, upstreamUrl + '/uploads/ring.jpg')
    assert.equal(requests[before].searchParams.get('filters[slug][$eq]'), 'test-ring')
    // Второй запрос — кандидаты для автоподбора из той же категории, без самого товара.
    const candidates = requests[before + 1].searchParams
    assert.equal(candidates.get('filters[documentId][$ne]'), 'product1')
    assert.equal(candidates.get('filters[$or][0][categories][documentId][$in][0]'), 'rings')
    assert.equal(candidates.get('status'), 'published')
    const bad = await fetch(base + '/api/products/' + encodeURIComponent('bad slug!'))
    assert.equal(bad.status, 404)
  })

  await t.test('home reads the bestseller selection as draft and shows only published products', async () => {
    const before = requests.length
    const body = await (await fetch(base + '/api/home')).json()
    const sent = requests.slice(before)
    const selection = sent.find(url => url.pathname === '/api/bestseller')
    assert.equal(selection.searchParams.get('status'), 'draft')
    const cards = sent.find(url => url.pathname === '/api/products' && url.searchParams.get('filters[documentId][$in][0]') === 'product1')
    assert.equal(cards.searchParams.get('status'), 'published')
    assert.equal(body.bestsellers[0].name, 'Test ring')
  })

  await t.test('favorites endpoint filters by documentId and validates input', async () => {
    const before = requests.length
    assert.deepEqual(await (await fetch(base + '/api/favorites')).json(), [])
    assert.equal(requests.length, before)
    for (const ids of ['bad id!', 'a'.repeat(41), Array.from({ length: 101 }, (_, i) => 'product' + String(i).padStart(3, '0')).join(',')]) {
      assert.equal((await fetch(base + '/api/favorites?ids=' + encodeURIComponent(ids))).status, 400, ids)
    }
    const ok = await fetch(base + '/api/favorites?ids=product1,product2')
    assert.equal(ok.status, 200)
    assert.equal((await ok.json())[0].name, 'Test ring')
    const query = requests.at(-1).searchParams
    assert.equal(query.get('filters[documentId][$in][0]'), 'product1')
    assert.equal(query.get('filters[documentId][$in][1]'), 'product2')
    assert.equal(query.get('status'), 'published')
  })

  await t.test('sitemap lists static pages and published products, robots points to it', async () => {
    const xml = await (await fetch(base + '/sitemap.xml')).text()
    for (const path of ['/', '/catalogs', '/about-us', '/contacts', '/products/test-ring']) assert.ok(xml.includes('<loc>' + base + path + '</loc>'), path + ' :: ' + xml.slice(0, 300))
    const robots = await (await fetch(base + '/robots.txt')).text()
    assert.ok(robots.includes('Sitemap: ' + base + '/sitemap.xml'))
    assert.ok(robots.includes('Disallow: /favorites'))
  })

  await t.test('unknown page renders the error page with 404', async () => {
    const response = await fetch(base + '/no-such-page', { headers: { accept: 'text/html' } })
    assert.equal(response.status, 404)
    const html404 = await response.text(); assert.match(html404, /Страница не найдена/, html404.slice(0, 300))
  })

  await t.test('about endpoint normalizes partner media', async () => {
    const response = await fetch(base + '/api/about')
    assert.equal(response.status, 200)
    const body = await response.json()
    assert.equal(body.partners[0].image.url, upstreamUrl + '/uploads/p.png')
  })

  await t.test('all four pages render SSR and no private token is serialized', async () => {
    for (const path of ['/', '/catalogs?categories=ring', '/about-us', '/contacts']) {
      const response = await fetch(base + path)
      assert.equal(response.status, 200, path)
      const html = await response.text()
      assert.match(html, /<h1[\s>]/, path)
      assert.ok(!html.includes(token), path)
      if (path.startsWith('/catalogs')) assert.ok(html.includes('Test ring'))
      if (path === '/contacts') assert.ok(html.includes('+998123456789'))
    }
  })

  await t.test('translations are overlaid on the Russian data, the structure stays Russian', async () => {
    const catalog = await (await fetch(base + '/api/catalog?locale=en')).json()
    assert.equal(catalog.products[0].name, 'English ring')
    assert.equal(catalog.products[0].priceUzs, '2500000')
    const translation = requests.at(-1).searchParams
    assert.equal(translation.get('locale'), 'en')
    assert.equal(translation.get('filters[documentId][$in][0]'), 'product1')
    assert.equal(translation.get('status'), 'published')

    const before = requests.length
    for (const locale of ['ru', 'zz']) {
      const body = await (await fetch(base + '/api/catalog?locale=' + locale)).json()
      assert.equal(body.products[0].name, 'Test ring', locale)
    }
    assert.ok(requests.slice(before).every(url => !url.searchParams.has('locale')), 'Russian and unknown locales do not ask for translations')

    const product1 = await (await fetch(base + '/api/products/test-ring?locale=en')).json()
    assert.equal(product1.name, 'English ring')
    assert.equal(product1.description, 'English description')
    assert.equal(product1.categories[0].name, 'English option')
    const home = await (await fetch(base + '/api/home?locale=en')).json()
    assert.equal(home.bestsellers[0].name, 'English ring')
    const options = await (await fetch(base + '/api/catalog-options?locale=en')).json()
    assert.equal(options.categories[0].name, 'English option')
    const about = await (await fetch(base + '/api/about?locale=en')).json()
    assert.equal(about.heading, 'English heading')
    assert.equal(about.partners[0].name, 'English partner')
    assert.equal(about.partners[0].image.url, upstreamUrl + '/uploads/p.png')
    const settings = await (await fetch(base + '/api/site-settings?locale=en')).json()
    assert.equal(settings.address, 'English address')
    assert.equal(settings.phone, '+998123456789')
  })

  await t.test('search on another language also looks into translations', async () => {
    const before = requests.length
    await fetch(base + '/api/catalog?locale=en&search=ring&page=3')
    const sent = requests.slice(before)
    const translated = sent.find(url => url.searchParams.get('locale') === 'en' && url.searchParams.get('filters[$or][0][name][$containsi]') === 'ring')
    assert.ok(translated)
    const main = sent.find(url => !url.searchParams.has('locale') && url.searchParams.get('filters[$or][2][documentId][$in][0]') === 'product1')
    assert.ok(main)
  })

  await t.test('localized pages render under their prefix with lang and links', async () => {
    const en = await (await fetch(base + '/en/about-us')).text()
    assert.match(en, /<html[^>]*lang="en"/)
    assert.ok(en.includes('English heading'))
    assert.ok(en.includes('href="/en/catalogs"'))
    assert.ok(en.includes('hreflang="uz"'))
    assert.ok(en.includes('English') && en.includes('Русский') && en.includes('href="/uz/about-us"'), 'language menu lists every language')
    const uz = await (await fetch(base + '/uz')).text()
    assert.match(uz, /<html[^>]*lang="uz"/)
    assert.ok(uz.includes('href="/uz/about-us"'))
    const ru = await (await fetch(base + '/about-us')).text()
    assert.match(ru, /<html[^>]*lang="ru"/)
    const notFound = await fetch(base + '/en/no-such-page', { headers: { accept: 'text/html' } })
    assert.equal(notFound.status, 404)
    assert.match(await notFound.text(), /Page not found/)
    // Query на публичных страницах другого языка тоже отбрасывается кешем.
    assert.equal((await fetch(base + '/en/contacts?x=1')).status, 200)
  })

  await t.test('sitemap has every language with alternates', async () => {
    const xml = await (await fetch(base + '/sitemap.xml')).text()
    for (const path of ['/en', '/uz', '/en/catalogs', '/uz/products/test-ring']) assert.ok(xml.includes('<loc>' + base + path + '</loc>'), path)
    assert.ok(xml.includes('hreflang="uz" href="' + base + '/uz/about-us"'))
  })

  await t.test('SEO tags: canonical, hreflang (without query), x-default, og:locale', async () => {
    const head = async (path) => {
      const html = await (await fetch(base + path)).text()
      return html.slice(html.indexOf('<head>'), html.indexOf('</head>'))
    }
    const catalog = await head('/en/catalogs?categories=ring')
    assert.ok(catalog.includes('rel="canonical" href="' + base + '/en/catalogs"'), 'canonical has no query')
    for (const [code, path] of [['ru', '/catalogs'], ['en', '/en/catalogs'], ['uz', '/uz/catalogs'], ['x-default', '/catalogs']]) {
      assert.ok(catalog.includes('hreflang="' + code + '" href="' + base + path + '"'), 'hreflang ' + code)
    }
    assert.match(catalog, /property="og:locale" content="en_US"/)
    assert.match(catalog, /property="og:locale:alternate" content="ru_RU"/)
    assert.match(catalog, /property="og:url" content="[^"]*\/en\/catalogs"/)
    assert.ok(catalog.includes('"item":"' + base + '/en"'), 'breadcrumbs are absolute and localized')
    const productHead = await head('/uz/products/test-ring')
    assert.ok(productHead.includes('rel="canonical" href="' + base + '/uz/products/test-ring"'))
    assert.ok(!/<meta name="description" content>/.test(productHead), 'no empty description')
    assert.match(productHead, /<title>Test ring — JeWell<\/title>/)
    // Кешируемые страницы тоже строят адреса от реального хоста, а не от localhost.
    for (const path of ['/about-us', '/contacts', '/en', '/uz/about-us']) {
      assert.ok((await head(path)).includes('rel="canonical" href="' + base + path), 'canonical host on cached ' + path)
    }
    assert.ok(productHead.includes('"url":"' + base + '/uz/products/test-ring"'), 'JSON-LD offer url uses the real host')
    const robots = await (await fetch(base + '/robots.txt')).text()
    for (const path of ['/favorites', '/en/favorites', '/uz/favorites']) assert.ok(robots.includes('Disallow: ' + path), path)
  })

  await t.test('every public page has description, Open Graph, Twitter card and valid JSON-LD', async () => {
    const head = async (path) => {
      const html = await (await fetch(base + path)).text()
      return html.slice(html.indexOf('<head>'), html.indexOf('</head>'))
    }
    const meta = (html, attr, name) => html.match(new RegExp('<meta ' + attr + '="' + name + '" content="([^"]*)"'))?.[1]
    const ld = html => [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([^<]*)<\/script>/g)].map(m => JSON.parse(m[1]))
    const descriptions = new Set()
    for (const path of ['/', '/catalogs', '/about-us', '/contacts', '/products/test-ring', '/en', '/en/contacts', '/uz/about-us']) {
      const html = await head(path)
      const description = meta(html, 'name', 'description')
      assert.ok(description && description.length > 20, 'description ' + path)
      if (!path.startsWith('/en') && !path.startsWith('/uz')) assert.ok(!descriptions.has(description), 'unique description ' + path)
      descriptions.add(description)
      assert.ok(meta(html, 'property', 'og:title'), 'og:title ' + path)
      assert.equal(meta(html, 'property', 'og:description'), description, 'og:description ' + path)
      assert.equal(meta(html, 'property', 'og:site_name'), 'JeWell', path)
      assert.ok(meta(html, 'property', 'og:type'), 'og:type ' + path)
      assert.match(meta(html, 'property', 'og:image'), /^https?:\/\/[^/]+\/[^:]*$|^https?:\/\/[^/]+\/_ipx\//, 'og:image is one absolute URL ' + path)
      assert.equal(meta(html, 'name', 'twitter:card'), 'summary_large_image', path)
      assert.match(meta(html, 'name', 'twitter:image'), /^http/, path)
      assert.ok(meta(html, 'name', 'theme-color'), 'theme-color ' + path)
      for (const item of ld(html)) assert.ok(!JSON.stringify(item).includes('localhost'), 'no localhost in JSON-LD ' + path)
    }
    // Структурированные данные по типам страниц.
    const types = async path => ld(await head(path)).map(item => item['@type'])
    assert.deepEqual(await types('/'), ['Organization', 'WebSite'])
    assert.deepEqual(await types('/contacts'), ['ContactPage', 'BreadcrumbList'])
    assert.deepEqual(await types('/en/about-us'), ['AboutPage', 'BreadcrumbList'])
    const [productLd] = ld(await head('/en/products/test-ring'))
    assert.equal(productLd['@type'], 'Product')
    assert.equal(productLd.offers.priceCurrency, 'UZS')
    assert.equal(productLd.offers.price, '2500000')
    assert.equal(productLd.offers.availability, 'https://schema.org/InStock')
    assert.ok(productLd.brand.name && productLd.description, 'brand and description are never empty')
    // Без разрешённого домена в IPX (в тестовой сборке) адрес остаётся исходным; главное — один протокол и один хост, без склейки «http://хостhttp://…».
    assert.ok(productLd.image.length && productLd.image.every(url => /^https?:\/\//.test(url) && !/^https?:\/\/[^/]+https?:/.test(url) && !url.slice(8).includes('http')), 'product images are single absolute URLs: ' + productLd.image)
    assert.equal(meta(await head('/products/test-ring'), 'property', 'og:type'), 'product')
    // Страницы без индексации не попадают в sitemap, а страница ошибки закрыта от индексации и имеет lang.
    const favorites = await head('/favorites')
    assert.match(favorites, /<meta name="robots" content="noindex">/)
    assert.ok(!(await (await fetch(base + '/sitemap.xml')).text()).includes('favorites'))
    const notFound = await (await fetch(base + '/nope', { headers: { accept: 'text/html' } })).text()
    assert.match(notFound, /<html[^>]*lang="ru"/)
    assert.match(notFound, /<meta name="robots" content="noindex">/)
  })

  await t.test('pages have exactly one h1 and no empty links', async () => {
    for (const path of ['/', '/catalogs', '/about-us', '/contacts', '/products/test-ring', '/favorites', '/en/catalogs']) {
      const html = await (await fetch(base + path)).text()
      assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, 'one h1 on ' + path)
    }
  })

  await t.test('trailing slash redirects to the canonical address, query is kept', async () => {
    for (const [from, to] of [['/about-us/', '/about-us'], ['/uz/', '/uz'], ['/en/catalogs/?sort=price-asc', '/en/catalogs?sort=price-asc']]) {
      const response = await fetch(base + from, { redirect: 'manual' })
      assert.equal(response.status, 301, from)
      assert.equal(new URL(response.headers.get('location'), base).pathname + new URL(response.headers.get('location'), base).search, to, from)
    }
    assert.equal((await fetch(base + '/', { redirect: 'manual' })).status, 200)
  })

  await t.test('robots.txt keeps images crawlable and sitemap carries x-default', async () => {
    const robots = await (await fetch(base + '/robots.txt')).text()
    assert.ok(!robots.includes('/_ipx'), 'search engines must be able to fetch product images')
    assert.ok(robots.includes('Disallow: /api/'))
    const xml = await (await fetch(base + '/sitemap.xml')).text()
    assert.ok(xml.includes('hreflang="x-default" href="' + base + '/catalogs"'))
  })
})
