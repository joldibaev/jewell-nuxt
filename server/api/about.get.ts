import type { AboutPage, AboutPartner } from '../../shared/types/catalog'

type RawAbout = Omit<AboutPage, 'partners'> & { partners?: AboutPartner[] | null }

export default defineCachedEventHandler(async (event): Promise<AboutPage | null> => {
  const locale = requestLocale(event)
  const mediaFields = { fields: ['url', 'alternativeText', 'width', 'height'] }
  const response = await strapiGet<RawAbout | null>(event, 'about-page', {
    fields: ['heading', 'text'],
    populate: { image: mediaFields, partners: { populate: { image: mediaFields } } },
  })
  const raw = response.data
  if (!raw) return null
  const partners = (raw.partners ?? []).map(p => ({ ...p, image: p.image ? normalizeMedia(event, p.image) : null }))
  const about: AboutPage = {
    ...raw,
    image: raw.image ? normalizeMedia(event, raw.image) : null,
    partners,
  }
  // Страница-одиночка на другом языке — отдельная запись: берём из неё тексты, а картинки и пустые поля остаются русскими.
  // Партнёры соединяются по порядку: перевод строки i накладывается на партнёра i.
  if (locale !== DEFAULT_LOCALE) {
    const translated = await strapiGet<RawAbout | null>(event, 'about-page', {
      locale, fields: ['heading', 'text'], populate: { partners: true },
    }).then(r => r.data).catch(() => null)
    if (translated) {
      if (translated.heading?.trim()) about.heading = translated.heading
      if (translated.text?.trim()) about.text = translated.text
      ;(translated.partners ?? []).forEach((tr, i) => {
        const base = about.partners[i]
        if (!base) return
        for (const field of ['name', 'description', 'linkLabel', 'linkUrl'] as const) {
          if (tr[field]?.trim()) base[field] = tr[field] as never
        }
      })
    }
  }
  return about
}, apiCache)
