// Языки сайта. Русский основной: на нём заполнен весь контент в Strapi, остальные переводы накладываются поверх него.
export const LOCALES = ['ru', 'en', 'uz'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'ru'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

// Язык для форматирования чисел (разделитель тысяч): у узбекского он совпадает с русским.
export const NUMBER_LOCALES: Record<Locale, string> = { ru: 'ru-RU', en: 'en-US', uz: 'uz-UZ' }
