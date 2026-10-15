export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return [
    'User-agent: *',
    'Disallow: /favorites',
    'Disallow: /api/',
    'Disallow: /_ipx/',
    `Sitemap: ${siteOrigin(event)}/sitemap.xml`,
    '',
  ].join('\n')
})
