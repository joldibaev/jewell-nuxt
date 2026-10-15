import type { PreviewPosition } from '#shared/types/catalog'

// Соответствие значений поля «Положение изображения» из Strapi классам Tailwind. Запись полная: значения по умолчанию нет.
const classes: Record<PreviewPosition, string> = {
  'Сверху': 'object-top',
  'По центру': 'object-center',
  'Снизу': 'object-bottom',
}

export function previewPositionClass(position: PreviewPosition | null): string | undefined {
  return position ? classes[position] : undefined
}
