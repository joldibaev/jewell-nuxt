import type { H3Event } from 'h3'
import { DEFAULT_LOCALE, isLocale, type Locale } from '../../shared/utils/locale'
import { strapiGet, type StrapiQuery } from './strapi'

// Язык запроса приходит параметром ?locale=…; неизвестное значение превращается в основной язык.
export function requestLocale(event: H3Event): Locale {
  const value = getQuery(event).locale
  return isLocale(value) ? value : DEFAULT_LOCALE
}

type Translatable = { documentId?: string | null; name?: string }

// Переводы читаются отдельным запросом по documentId и накладываются на русские данные. Структура (связи, цена, наличие,
// фильтры) берётся только из основного языка: у записей на других языках связи могут быть не заполнены.
// Нет перевода или Strapi не ответил — остаётся русский текст.
export async function fetchTranslations(
  event: H3Event, path: string, locale: Locale, ids: string[], fields: string[], extra: StrapiQuery = {},
): Promise<Map<string, Record<string, unknown>>> {
  const result = new Map<string, Record<string, unknown>>()
  const unique = [...new Set(ids)]
  if (locale === DEFAULT_LOCALE || !unique.length) return result
  try {
    for (let i = 0; i < unique.length; i += 100) {
      const response = await strapiGet<Record<string, unknown>[]>(event, path, {
        ...extra,
        locale,
        fields,
        filters: { documentId: { $in: unique.slice(i, i + 100) } },
        pagination: { page: 1, pageSize: 100 },
      })
      for (const item of response.data ?? []) result.set(String(item.documentId), item)
    }
  } catch (error) {
    console.error(`[i18n] translations of ${path} are unavailable`, (error as { statusCode?: number }).statusCode)
  }
  return result
}

function overlay<T extends object>(target: T, translation: Record<string, unknown> | undefined, fields: string[]) {
  if (!translation) return
  for (const field of fields) {
    const value = translation[field]
    if (typeof value === 'string' && value.trim() && field in target) (target as Record<string, unknown>)[field] = value
  }
}

// Подменяет name у справочников (категории, коллекции, материалы, камни). Объекты меняются на месте.
export async function translateNames(event: H3Event, path: string, locale: Locale, refs: (Translatable | null | undefined)[]): Promise<void> {
  const items = refs.filter((ref): ref is Translatable & { documentId: string } => !!ref?.documentId)
  const map = await fetchTranslations(event, path, locale, items.map(item => item.documentId), ['name'])
  for (const item of items) overlay(item, map.get(item.documentId), ['name'])
}

// Подменяет name и description у товаров (если поле description есть в данных). Объекты меняются на месте.
export async function translateProducts(event: H3Event, locale: Locale, products: { documentId: string; name: string; description?: string | null }[]): Promise<void> {
  const map = await fetchTranslations(event, 'products', locale, products.map(p => p.documentId), ['name', 'description'], { status: 'published' })
  for (const product of products) overlay(product, map.get(product.documentId), ['name', 'description'])
}
