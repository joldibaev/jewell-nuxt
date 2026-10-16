import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sortCatalogProducts } from '../server/utils/catalog-sorting.ts'

const variant = (value, prefix = 'Charm') => ({ documentId: prefix + value, name: `${prefix} ${value}` })

test('alphabetical group keeps all variants together and ungrouped items retain their order', () => {
  const group = { documentId: 'letters', sortOrder: 1, sortMode: 'По алфавиту' }
  const other = { documentId: 'other', name: 'Ellips' }
  const source = [variant('D'), { ...variant('S'), catalogSortGroup: group }, other, { ...variant('A'), catalogSortGroup: group }, { ...variant('M'), catalogSortGroup: group }]
  const result = sortCatalogProducts(source)
  assert.deepEqual(result.map(p => p.documentId), ['CharmA', 'CharmM', 'CharmS', 'CharmD', 'other'])
  assert.equal(source[0].documentId, 'CharmD')
})

test('groups use configured order; alphabetical and manual groups can be mixed', () => {
  const second = { documentId: 'second', sortOrder: 2, sortMode: 'По алфавиту' }
  const first = { documentId: 'first', sortOrder: 1, sortMode: 'Вручную' }
  const source = [
    { ...variant('Z'), catalogSortGroup: second },
    { ...variant('A', 'Bracelet'), catalogSortGroup: first, catalogSortPosition: 2 },
    { ...variant('D', 'Bracelet'), catalogSortGroup: first, catalogSortPosition: 1 },
  ]
  assert.deepEqual(sortCatalogProducts(source).map(p => p.documentId), ['BraceletD', 'BraceletA', 'CharmZ'])
})

test('sorting is complete before the caller paginates', () => {
  const group = { documentId: 'letters', sortOrder: 1, sortMode: 'По алфавиту' }
  const source = [...Array(26)].map((_, index) => {
    const value = 26 - index
    return { documentId: `Item${value}`, name: `Item ${String(value).padStart(2, '0')}`, catalogSortGroup: group }
  })
  const ordered = sortCatalogProducts(source)
  assert.equal(ordered.slice(0, 20)[0].name, 'Item 01')
  assert.equal(ordered.slice(20)[0].name, 'Item 21')
  assert.equal(new Set(ordered.map(p => p.documentId)).size, 26)
})
