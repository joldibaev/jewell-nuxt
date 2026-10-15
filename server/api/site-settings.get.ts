import type { SiteSettings } from '../../shared/types/catalog'

type RawSettings = Omit<SiteSettings, 'storePhotos'> & { storePhotos?: SiteSettings['storePhotos'] | null }

const TRANSLATED_FIELDS = ['address', 'productNote', 'workingHours', 'legalDetails'] as const

export default defineCachedEventHandler(async (event): Promise<SiteSettings | null> => {
  const locale = requestLocale(event)
  const response = await strapiGet<RawSettings | null>(event, 'site-setting', {
    fields: ['phone', 'email', 'address', 'instagramUrl', 'telegramUrl', 'whatsappUrl', 'facebookUrl', 'mapEmbedUrl', 'productNote', 'workingHours', 'legalDetails'],
    populate: { storePhotos: { fields: ['url', 'alternativeText', 'width', 'height'] } },
  })
  if (!response.data) return null
  const settings: SiteSettings = { ...response.data, storePhotos: (response.data.storePhotos ?? []).map(photo => normalizeMedia(event, photo)) }
  // Текстовые поля адреса и условий переводятся; нет перевода — остаётся русский текст.
  if (locale !== DEFAULT_LOCALE) {
    const translated = await strapiGet<Partial<RawSettings> | null>(event, 'site-setting', { locale, fields: [...TRANSLATED_FIELDS] })
      .then(r => r.data).catch(() => null)
    for (const field of TRANSLATED_FIELDS) {
      const value = translated?.[field]
      if (typeof value === 'string' && value.trim()) settings[field] = value
    }
  }
  return settings
}, apiCache)
