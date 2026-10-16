import type { Banner, BannerFrame } from '../../shared/types/catalog'

// Only numeric percentages and known modes reach the storefront's CSS.
export function normalizeBannerFrames(value: unknown, mediaId: number): Banner['frames'] {
  const map = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  const entry = map[String(mediaId)] as Partial<Banner['frames']> | undefined
  const frame = (input: unknown): BannerFrame => {
    const source = input as Partial<BannerFrame> | null
    const percent = (n: unknown) => typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 50
    return { x: percent(source?.x), y: percent(source?.y), fit: source?.fit === 'contain' ? 'contain' : 'cover' }
  }
  return { desktop: frame(entry?.desktop), mobile: frame(entry?.mobile) }
}
