import type { Media } from '#shared/types/catalog'

type Getter<T> = MaybeRefOrGetter<T>

/** Обрезка текста до описания для поисковиков и соцсетей: по границе слова, с многоточием. */
export function shortText(text: string | null | undefined, max = 160): string | undefined {
  const flat = (text ?? '').replace(/\s+/g, ' ').trim()
  if (!flat) return undefined
  if (flat.length <= max) return flat
  const cut = flat.slice(0, max - 1)
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), max / 2)).replace(/[\s,.;:—-]+$/, '') + '…'
}

/** Абсолютный адрес на этом сайте: поисковики и соцсети требуют полные URL в og:image и JSON-LD. */
export function useAbsoluteUrl() {
  const origin = useRequestURL().origin
  return (path: string) => origin + path
}

/** Картинка для превью в соцсетях: лёгкая jpeg-нарезка 1200px, а без картинки — общая заставка сайта. */
export function useSocialImage() {
  const img = useImage()
  const absolute = useAbsoluteUrl()
  return (media?: Pick<Media, 'url'> | null) => {
    if (!media?.url) return absolute('/img/og-default.jpg')
    const src = img(media.url, { width: 1200, format: 'jpeg' })
    // Если домен картинки не разрешён в IPX, @nuxt/image отдаёт исходный абсолютный адрес: дописывать к нему хост сайта нельзя.
    return /^https?:\/\//.test(src) ? src : absolute(src)
  }
}

interface PageSeo {
  title: Getter<string>
  description: Getter<string | undefined>
  /** Абсолютный адрес картинки; по умолчанию — общая заставка сайта. */
  image?: Getter<string | undefined>
  type?: 'website' | 'product'
}

/**
 * Базовые SEO-теги страницы: title, description, Open Graph и Twitter Card.
 * canonical, hreflang, og:url и og:locale расставляет app/app.vue, поэтому здесь их нет.
 */
export function usePageSeo(seo: PageSeo) {
  const defaultImage = useAbsoluteUrl()('/img/og-default.jpg')
  const title = () => toValue(seo.title)
  const description = () => toValue(seo.description)
  const image = () => toValue(seo.image) ?? defaultImage
  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogImage: image,
    ogImageAlt: title,
    // 'product' в типах unhead нет, но это штатное значение Open Graph для товаров.
    ogType: (seo.type ?? 'website') as 'website',
    ogSiteName: 'JeWell',
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: image,
  })
}

/** JSON-LD в <head>; undefined-поля отбрасываются при сериализации, «<» экранируется, чтобы текст из CMS не закрыл тег script. */
export function useJsonLd(data: Getter<Record<string, unknown> | Record<string, unknown>[]>) {
  useHead(() => ({
    script: [toValue(data)].flat().map(item => ({ type: 'application/ld+json', innerHTML: JSON.stringify({ '@context': 'https://schema.org', ...item }).replace(/</g, '\\u003c') })),
  }))
}

/** Хлебные крошки (BreadcrumbList): `url` — путь сайта вместе с языком, последняя крошка — текущая страница. */
export function breadcrumbList(origin: string, items: { name: string; url: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: origin + item.url })),
  }
}
