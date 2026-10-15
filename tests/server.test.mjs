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
    assert.ok(en.includes('English') && en.includes('Русский'), 'language select lists every language')
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
})
