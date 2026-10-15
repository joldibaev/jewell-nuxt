import type { H3Event } from 'h3'

// Публичный адрес сайта с учётом прокси (Traefik/Coolify передаёт X-Forwarded-*).
export function siteOrigin(event: H3Event): string {
  return getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }).origin
}
