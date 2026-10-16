interface NamedProduct {
  documentId: string
  name: string
}

// Собираем варианты одной модели в непрерывную группу и сортируем по букве.
// Выполняется для полной выдачи до пагинации и до наложения переводов.
export function orderLetterVariants<T extends NamedProduct>(products: T[]): T[] {
  const groups = new Map<string, { first: number; variants: { product: T; letter: string }[] }>()
  const groupAt = new Map<number, string>()
  products.forEach((product, index) => {
    const match = /^(.*?буквой\s*)[«"“'‘]?([a-z])(?:[»"”'’]|(?=\s|$))(.*)$/iu.exec(product.name.trim())
    if (!match) return
    const normalize = (part: string) => part.toLocaleLowerCase('ru').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
    const key = `${normalize(match[1]!)}\u0000${normalize(match[3]!)}`
    const group = groups.get(key) ?? { first: index, variants: [] }
    group.variants.push({ product, letter: match[2]!.toUpperCase() })
    groups.set(key, group)
    groupAt.set(index, key)
  })

  for (const group of groups.values()) {
    group.variants.sort((a, b) => a.letter.localeCompare(b.letter, 'en'))
  }
  const result: T[] = []
  products.forEach((product, index) => {
    const key = groupAt.get(index)
    if (!key) {
      result.push(product)
      return
    }
    const group = groups.get(key)!
    if (index === group.first) result.push(...group.variants.map(variant => variant.product))
  })
  return result
}
