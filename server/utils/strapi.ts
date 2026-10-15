import type { H3Event } from 'h3'
import type { CatalogOption, Media, Pagination, ProductCard } from '../../shared/types/catalog'

export interface StrapiResponse<T> {
  data: T
  meta: { pagination?: Pagination }
}
export type StrapiQuery = { [key: string]: string | number | boolean | null | undefined | StrapiQuery | Array<string | number | StrapiQuery> }

export function encodeStrapiQuery(query: StrapiQuery): string {
  const params = new URLSearchParams()
  function append(value: unknown, key: string) {
    if (value === undefined) return
    if (value !== null && typeof value === 'object') {
      for (const [child, item] of Object.entries(value)) append(item, key ? `${key}[${child}]` : child)
    } else {
      params.append(key, String(value))
    }
  }
  append(query, '')
  return params.toString()
}

export async function strapiGet<T>(event: H3Event, path: string, query: StrapiQuery = {}): Promise<StrapiResponse<T>> {
  const config = useRuntimeConfig(event)
  if (!config.strapiUrl || !config.strapiToken) {
    throw createError({ statusCode: 503, statusMessage: 'Content service is not configured' })
  }
  try {
    return await $fetch<StrapiResponse<T>>(`${config.strapiUrl.replace(/\/$/, '')}/api/${path}?${encodeStrapiQuery(query)}`, {
      headers: { Authorization: `Bearer ${config.strapiToken}` },
      timeout: 10_000,
      retry: 0,
    })
  } catch (error) {
    // Strapi answers 404 for a single type that has not been created/published yet: treat it as empty content.
    if (path.split('/')[0] !== 'products' && (error as { statusCode?: number }).statusCode === 404) {
      return { data: null as T, meta: {} }
    }
    // Never return upstream errors: they may include internal URLs or request headers.
    throw createError({ statusCode: 502, statusMessage: 'Content service is unavailable' })
  }
}

export function mediaUrl(event: H3Event, url: string): string {
  return new URL(url, useRuntimeConfig(event).strapiUrl).toString()
}
export function normalizeMedia(event: H3Event, media: Media): Media {
  return {
    ...media,
    // Абсолютный URL нужен IPX на фронтенде: он скачивает оригинал с домена Strapi и отдаёт нарезанный avif/webp.
    url: mediaUrl(event, media.url),
  }
}
export function normalizeOption(event: H3Event, option: CatalogOption): CatalogOption {
  return { ...option, image: option.image ? normalizeMedia(event, option.image) : option.image }
}
export function normalizeProduct(event: H3Event, product: ProductCard): ProductCard {
  return { ...product, gallery: (product.gallery || []).map(media => normalizeMedia(event, media)) }
}
export const productCardQuery: StrapiQuery = {
  fields: ['name', 'slug', 'priceUzs', 'inStock', 'previewPosition'],
  populate: {
    gallery: { fields: ['url', 'alternativeText', 'width', 'height'] },
    brand: { fields: ['name'] },
  },
}

export async function strapiCreateInquiry(event: H3Event, data: Record<string, unknown>): Promise<void> {
  const config = useRuntimeConfig(event)
  if (!config.strapiUrl || !config.strapiInquiryToken) {
    throw createError({ statusCode: 503, statusMessage: 'Inquiries are not configured' })
  }
  try {
    await $fetch(`${config.strapiUrl.replace(/\/$/, '')}/api/inquiries`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.strapiInquiryToken}` },
      body: { data },
      timeout: 10_000,
      retry: 0,
    })
  } catch (error) {
    // Причина (403 токена, 400 валидации, недоступность Strapi) нужна в логе сервера, но не в ответе клиенту.
    const e = error as { statusCode?: number; data?: unknown }
    console.error('[inquiries] Strapi rejected the inquiry', e.statusCode, JSON.stringify(e.data))
    throw createError({ statusCode: 502, statusMessage: 'Не удалось отправить заявку. Попробуйте позже.' })
  }
}

// Кеш ответов API в памяти процесса: Strapi читается не на каждый заход. Правки редактора видны через ~минуту
// (устаревший ответ отдаётся сразу, а обновление идёт в фоне). Ошибки не кешируются.
export const apiCache = { maxAge: 60, staleMaxAge: 60 * 60, swr: true }
