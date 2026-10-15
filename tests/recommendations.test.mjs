import assert from 'node:assert/strict'
import { test } from 'node:test'
import { pickRecommendations, similarityScore, toProductCard } from '../server/utils/recommendations.ts'

function product(id, extra = {}) {
  return {
    documentId: id, name: id, slug: id, priceUzs: '10000000', inStock: false, previewPosition: null, gallery: [],
    categories: [], collection: null, brand: null, materials: [], gems: [], ...extra,
  }
}
const ring = { documentId: 'ring' }
const necklace = { documentId: 'necklace' }
const gold = { documentId: 'gold' }
const base = product('base', {
  categories: [ring], collection: { documentId: 'cameo' }, brand: { name: 'B', documentId: 'brand' },
  materials: [gold], gems: [{ gem: { documentId: 'diamond' } }],
})

test('similarity rewards shared attributes, close price and stock', () => {
  const same = product('same', { ...base, documentId: 'same', inStock: true })
  assert.equal(similarityScore(base, same), 5 + 3 + 4 + 2 + 2 + 3 + 2)
  assert.equal(similarityScore(base, product('far', { priceUzs: '50000000' })), 0)
  assert.equal(similarityScore(base, product('near', { priceUzs: '5000000' })), 1)
})

test('manual picks come first, then autofill by score up to the limit', () => {
  const manual = [product('m1'), product('m2'), product('m1'), product('base')]
  const candidates = [
    product('weak', { materials: [gold] }),
    product('strong', { collection: { documentId: 'cameo' }, categories: [ring] }),
    product('m2', { collection: { documentId: 'cameo' } }),
    product('unrelated', { priceUzs: '0' }),
  ]
  const ids = pickRecommendations(base, manual, candidates).map(item => item.documentId)
  assert.deepEqual(ids, ['m1', 'm2', 'strong', 'weak'])
})

test('limits one category to three, but fills remaining slots when nothing else fits', () => {
  const rings = Array.from({ length: 6 }, (_, i) => product('ring' + i, { categories: [ring] }))
  const necklaces = [product('neck0', { categories: [necklace], materials: [gold] })]
  const ids = pickRecommendations(base, [], [...rings, ...necklaces], 5).map(item => item.documentId)
  assert.deepEqual(ids, ['ring0', 'ring1', 'ring2', 'neck0', 'ring3'])
  assert.equal(pickRecommendations(base, [], rings).length, 6)
})

test('response cards do not leak similarity fields', () => {
  assert.deepEqual(Object.keys(toProductCard(base)).sort(), ['brand', 'documentId', 'gallery', 'inStock', 'name', 'previewPosition', 'priceUzs', 'slug'])
  assert.deepEqual(toProductCard(base).brand, { name: 'B' })
})
