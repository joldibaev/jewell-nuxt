interface NamedProduct {
  documentId: string
  name: string
}

// Переставляем только варианты одной модели: посторонние товары остаются на своих местах.
// Вызывается для всей выдачи до пагинации и до наложения переводов.
export function orderLetterVariants<T extends NamedProduct>(products: T[]): T[] {
  const groups = new Map<string, { positions: number[]; variants: { product: T; letter: string }[] }>()
  products.forEach((product, index) => {
    const match = /^(.*?буквой\s*)[«"“'‘]?([a-z])(?:[»"”'’]|(?=\s|$))(.*)$/iu.exec(product.name.trim())
    if (!match) return
    const key = `${match[1]}\u0000${match[3]}`.toLowerCase().replace(/\s+/g, ' ')
    const group = groups.get(key) ?? { positions: [], variants: [] }
    group.positions.push(index)
    group.variants.push({ product, letter: match[2]!.toUpperCase() })
    groups.set(key, group)
  })
  const ordered = [...products]
  for (const group of groups.values()) {
    group.variants.sort((a, b) => a.letter.localeCompare(b.letter, 'en'))
    group.positions.forEach((position, index) => { ordered[position] = group.variants[index]!.product })
  }
  return ordered
}
