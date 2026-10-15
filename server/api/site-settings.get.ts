import type { SiteSettings } from '../../shared/types/catalog'

type RawSettings = Omit<SiteSettings, 'storePhotos'> & { storePhotos?: SiteSettings['storePhotos'] | null }

export default defineCachedEventHandler(async (event): Promise<SiteSettings | null> => {
  const response = await strapiGet<RawSettings | null>(event, 'site-setting', {
    fields: ['phone', 'email', 'address', 'instagramUrl', 'telegramUrl', 'whatsappUrl', 'facebookUrl', 'mapEmbedUrl', 'productNote', 'workingHours', 'legalDetails'],
    populate: { storePhotos: { fields: ['url', 'alternativeText', 'width', 'height'] } },
  })
  if (!response.data) return null
  return { ...response.data, storePhotos: (response.data.storePhotos ?? []).map(photo => normalizeMedia(event, photo)) }
}, apiCache)
