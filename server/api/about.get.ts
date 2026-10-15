import type { AboutPage, AboutPartner } from '../../shared/types/catalog'

type RawAbout = Omit<AboutPage, 'partners'> & { partners?: AboutPartner[] | null }

export default defineCachedEventHandler(async (event): Promise<AboutPage | null> => {
  const mediaFields = { fields: ['url', 'alternativeText', 'width', 'height'] }
  const response = await strapiGet<RawAbout | null>(event, 'about-page', {
    fields: ['heading', 'text'],
    populate: { image: mediaFields, partners: { populate: { image: mediaFields } } },
  })
  const raw = response.data
  if (!raw) return null
  return {
    ...raw,
    image: raw.image ? normalizeMedia(event, raw.image) : null,
    partners: (raw.partners ?? []).map(p => ({ ...p, image: p.image ? normalizeMedia(event, p.image) : null })),
  }
}, apiCache)
