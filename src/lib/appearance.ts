// Appearance settings: accent colour, background tone, text size, corner
// radius, background motion and the grade-sheet style. Everything is applied
// through CSS variables on <html>, so Tailwind utilities pick it up live.

export type SheetStyle = 'modern' | 'excel'
export type TextSize = 'sm' | 'md' | 'lg'
export type Radius = 'sharp' | 'normal' | 'round'

export type Appearance = {
  /** A preset id from ACCENTS, or a #rrggbb colour picked by the user. */
  accent: string
  surface: string
  size: TextSize
  radius: Radius
  motion: boolean
  sheet: SheetStyle
}

export const DEFAULT_APPEARANCE: Appearance = { accent: 'tim', surface: 'muc', size: 'md', radius: 'normal', motion: true, sheet: 'modern' }

export const ACCENTS: { id: string; vi: string; en: string; hex: string }[] = [
  { id: 'tim', vi: 'Tím', en: 'Violet', hex: '#7d68fa' },
  { id: 'cham', vi: 'Chàm', en: 'Indigo', hex: '#6366f1' },
  { id: 'duong', vi: 'Xanh dương', en: 'Blue', hex: '#3b82f6' },
  { id: 'ngoc', vi: 'Xanh ngọc', en: 'Teal', hex: '#14b8a6' },
  { id: 'la', vi: 'Xanh lá', en: 'Green', hex: '#22c55e' },
  { id: 'cam', vi: 'Cam', en: 'Orange', hex: '#f97316' },
  { id: 'hong', vi: 'Hồng', en: 'Pink', hex: '#ec4899' },
]

const INK_STEPS = ['950', '900', '850', '800', '700', '600'] as const

/** Background tones, darkest shade first (page → sidebar → cards → raised). */
export const SURFACES: { id: string; vi: string; en: string; shades: string[] }[] = [
  { id: 'muc', vi: 'Mực', en: 'Ink', shades: ['#07080f', '#0b0d18', '#0f1220', '#141729', '#1b1f35', '#262b46'] },
  { id: 'dem', vi: 'Xanh đêm', en: 'Midnight', shades: ['#040a14', '#071121', '#0b162b', '#101d36', '#172743', '#223554'] },
  { id: 'tham', vi: 'Tím than', en: 'Plum', shades: ['#0b0710', '#120b19', '#181022', '#1f152c', '#291c39', '#38284c'] },
  { id: 'reu', vi: 'Rêu', en: 'Forest', shades: ['#050c0a', '#08130f', '#0c1a15', '#11211b', '#182b23', '#243a30'] },
  { id: 'den', vi: 'Đen tuyền', en: 'Black', shades: ['#000000', '#070707', '#0c0c0d', '#131315', '#1b1b1e', '#27272b'] },
]

const STORAGE_KEY = 'fgr-appearance'
const HEX = /^#[0-9a-f]{6}$/i

export function accentHex(accent: string): string {
  return ACCENTS.find((a) => a.id === accent)?.hex ?? (HEX.test(accent) ? accent : ACCENTS[0].hex)
}

export function loadAppearance(): Appearance {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Appearance>
      const merged = { ...DEFAULT_APPEARANCE, ...saved }
      return {
        accent: ACCENTS.some((a) => a.id === merged.accent) || HEX.test(merged.accent) ? merged.accent : DEFAULT_APPEARANCE.accent,
        surface: SURFACES.some((s) => s.id === merged.surface) ? merged.surface : DEFAULT_APPEARANCE.surface,
        size: ['sm', 'md', 'lg'].includes(merged.size) ? merged.size : 'md',
        radius: ['sharp', 'normal', 'round'].includes(merged.radius) ? merged.radius : 'normal',
        motion: merged.motion !== false,
        sheet: merged.sheet === 'excel' ? 'excel' : 'modern',
      }
    }
  } catch {
    // Blocked or broken storage: defaults.
  }
  return DEFAULT_APPEARANCE
}

export function saveAppearance(appearance: Appearance) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance))
  } catch {
    // Not remembered; harmless.
  }
}

// ---------- Colour maths (sRGB hex → OKLCH) ----------

function hexToOklch(hex: string): { l: number; c: number; h: number } {
  const n = parseInt(hex.slice(1), 16)
  const lin = (v: number) => {
    const x = v / 255
    return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
  }
  const r = lin((n >> 16) & 255)
  const g = lin((n >> 8) & 255)
  const b = lin(n & 255)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return { l: L, c: Math.hypot(A, B), h: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360 }
}

// Lightness is fixed per shade so white text stays readable on 500 whatever
// colour is picked; chroma follows the picked colour.
const SHADES: [string, number, number][] = [
  ['50', 0.97, 0.12],
  ['100', 0.94, 0.25],
  ['200', 0.875, 0.45],
  ['300', 0.78, 0.7],
  ['400', 0.68, 0.9],
  ['500', 0.585, 1],
  ['600', 0.52, 1],
  ['700', 0.46, 0.92],
  ['800', 0.4, 0.8],
  ['900', 0.35, 0.68],
  ['950', 0.26, 0.55],
]

/** An 11-step accent scale (50…950) built around one colour. */
export function accentPalette(hex: string): Record<string, string> {
  const { c, h } = hexToOklch(hex)
  const chroma = Math.min(c, 0.24)
  return Object.fromEntries(SHADES.map(([step, l, k]) => [step, `oklch(${l} ${(chroma * k).toFixed(4)} ${h.toFixed(1)})`]))
}

const RADII: [string, number][] = [
  ['xs', 0.125],
  ['sm', 0.25],
  ['md', 0.375],
  ['lg', 0.5],
  ['xl', 0.75],
  ['2xl', 1],
  ['3xl', 1.5],
  ['4xl', 2],
]
const RADIUS_SCALE: Record<Radius, number> = { sharp: 0.35, normal: 1, round: 1.45 }
const ZOOM: Record<TextSize, string> = { sm: '0.92', md: '', lg: '1.1' }

/** Writes the settings onto <html> (and <body> for text size). */
export function applyAppearance(a: Appearance, root: HTMLElement = document.documentElement) {
  const style = root.style
  const set = (name: string, value: string | null) => (value === null ? style.removeProperty(name) : style.setProperty(name, value))

  // The default violet keeps the hand-tuned scale from index.css.
  const palette = a.accent === DEFAULT_APPEARANCE.accent ? null : accentPalette(accentHex(a.accent))
  for (const [step] of SHADES) set(`--color-accent-${step}`, palette ? palette[step] : null)

  const surface = SURFACES.find((s) => s.id === a.surface) ?? SURFACES[0]
  INK_STEPS.forEach((step, i) => set(`--color-ink-${step}`, surface.id === SURFACES[0].id ? null : surface.shades[i]))

  const scale = RADIUS_SCALE[a.radius]
  for (const [name, rem] of RADII) set(`--radius-${name}`, scale === 1 ? null : `${+(rem * scale).toFixed(3)}rem`)
  set('--radius-scale', scale === 1 ? null : String(scale))

  if (document.body) document.body.style.zoom = ZOOM[a.size]
  if (a.motion) delete root.dataset.motion
  else root.dataset.motion = 'off'

  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', surface.shades[0])
}
