import type { Banner, BannerFrame } from '../../shared/types/catalog'

// Only numeric percentages and known modes reach the storefront's CSS.
export function normalizeBannerFrames(value: unknown, mediaId: number): Banner['frames'] {
  const map = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  const entry = map[String(mediaId)] as Partial<Banner['frames']> | undefined
  return { desktop: normalizeImageFrame(entry?.desktop), mobile: normalizeImageFrame(entry?.mobile) }
}

export function normalizeImageFrame(input: unknown): BannerFrame {
  const source = input as Partial<BannerFrame> | null
  const percent = (n: unknown) => typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 50
  return { ...(typeof source?.zoom === 'number' && Number.isFinite(source.zoom) ? { zoom: Math.max(1, Math.min(10, source.zoom)) } : {}), x: percent(source?.x), y: percent(source?.y), fit: source?.fit === 'contain' ? 'contain' : 'cover' }
}
