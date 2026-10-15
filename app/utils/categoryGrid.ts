// Сетка плиток категорий. Телефон: 2 колонки, нечётная последняя плитка на всю ширину.
// Десктоп (6 колонок): по 3 плитки в ряд, остаток (1 или 2 плитки) делит последнюю строку.
// Классы записаны целиком, чтобы Tailwind увидел их при сборке.
export function categoryTileClasses(index: number, total: number) {
  const last = index === total - 1
  const oddLast = last && total % 2 === 1
  const rest = total % 3
  const stretched = (rest === 2 && index >= total - 2) || (rest === 1 && last)
  const span = rest === 2 && index >= total - 2 ? 'lg:col-span-3' : rest === 1 && last ? 'lg:col-span-6' : 'lg:col-span-2'
  return {
    item: `${oddLast ? 'col-span-2' : 'col-span-1'} ${span}`,
    link: `${oddLast ? 'min-[400px]:aspect-21/9' : ''} ${stretched ? 'lg:aspect-21/9' : 'lg:aspect-square'}`,
  }
}
