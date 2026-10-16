import assert from 'node:assert/strict'
import { test } from 'node:test'
import { orderLetterVariants } from '../server/utils/letter-order.ts'

const letter = (value, prefix = 'Ожерелье') => ({ documentId: prefix + value, name: `${prefix} с буквой «${value}»` })

test('letter variants run consecutively in A–Z order; other products retain their relative order', () => {
  const other = { documentId: 'other', name: 'Ellips' }
  const source = [letter('D'), letter('S'), other, letter('N'), letter('M'), letter('A')]
  const result = orderLetterVariants(source)
  assert.deepEqual(result.map(p => p.documentId), ['ОжерельеA', 'ОжерельеD', 'ОжерельеM', 'ОжерельеN', 'ОжерельеS', 'other'])
  assert.equal(source[0].documentId, 'ОжерельеD')
})

test('models form separate groups; quoting and letter case do not affect alphabetic order', () => {
  const source = [letter('Z'), letter('D', 'Браслет'), { documentId: 'a', name: 'Ожерелье с буквой "a"' }, letter('A', 'Браслет')]
  assert.deepEqual(orderLetterVariants(source).map(p => p.documentId), ['a', 'ОжерельеZ', 'БраслетA', 'БраслетD'])
})

test('sorting precedes pagination, including when A is beyond page one', () => {
  const source = ['Z', 'Y', 'X', 'W', 'V', 'U', 'T', 'S', 'R', 'Q', 'P', 'O', 'N', 'M', 'L', 'K', 'J', 'I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'].map(value => letter(value))
  const ordered = orderLetterVariants(source)
  assert.equal(ordered.slice(0, 20)[0].name, 'Ожерелье с буквой «A»')
  assert.equal(ordered.slice(20)[0].name, 'Ожерелье с буквой «U»')
  assert.equal(new Set(ordered.map(p => p.documentId)).size, 26)
})

test('unrelated names containing words after буквой are unchanged', () => {
  const source = [{ documentId: '1', name: 'Кольцо с буквой Apple' }, { documentId: '2', name: 'Кольцо с буквой Banana' }]
  assert.deepEqual(orderLetterVariants(source), source)
})
