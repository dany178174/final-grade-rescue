// Appearance settings: accent colour, background tone, text size, corner
// radius, background motion and the grade-sheet style. Everything is applied
// through CSS variables on <html>, so Tailwind utilities pick it up live.

export type SheetStyle = 'modern' | 'excel'
export type ThemeMode = 'dark' | 'light' | 'auto'
export type TextSize = 'sm' | 'md' | 'lg'
export type Radius = 'sharp' | 'normal' | 'round'

export type Appearance = {
  /** Dark page, white page, or follow the device setting. */
  mode: ThemeMode
  /** A preset id from ACCENTS, or a #rrggbb colour picked by the user. */
  accent: string
  surface: string
  size: TextSize
  radius: Radius
  motion: boolean
  sheet: SheetStyle
}

export const DEFAULT_APPEARANCE: Appearance = { mode: 'dark', accent: 'tim', surface: 'muc', size: 'md', radius: 'normal', motion: true, sheet: 'modern' }

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

/**
 * Background tones as ink-950 (page), 900 (sidebar, tables), 850 (cards),
 * 800 (headers), 700 and 600. Each has a dark set and a light set.
 */
export const SURFACES: { id: string; vi: string; en: string; lightVi: string; lightEn: string; shades: string[]; light: string[] }[] = [
  {
    id: 'muc', vi: 'Mực', en: 'Ink', lightVi: 'Trắng xám', lightEn: 'Cool white',
    shades: ['#07080f', '#0b0d18', '#0f1220', '#141729', '#1b1f35', '#262b46'],
    light: ['#eef0f6', '#f9fafc', '#ffffff', '#f1f3f8', '#e4e7f0', '#cfd4e2'],
  },
  {
    id: 'dem', vi: 'Xanh đêm', en: 'Midnight', lightVi: 'Xanh nhạt', lightEn: 'Sky',
    shades: ['#040a14', '#071121', '#0b162b', '#101d36', '#172743', '#223554'],
    light: ['#eaf1fa', '#f7faff', '#ffffff', '#eef3fb', '#dde7f4', '#c5d2e8'],
  },
  {
    id: 'tham', vi: 'Tím than', en: 'Plum', lightVi: 'Tím nhạt', lightEn: 'Lavender',
    shades: ['#0b0710', '#120b19', '#181022', '#1f152c', '#291c39', '#38284c'],
    light: ['#f2eef8', '#fbf9fe', '#ffffff', '#f4f0f9', '#e7e0f1', '#d3c8e5'],
  },
  {
    id: 'reu', vi: 'Rêu', en: 'Forest', lightVi: 'Xanh bạc hà', lightEn: 'Mint',
    shades: ['#050c0a', '#08130f', '#0c1a15', '#11211b', '#182b23', '#243a30'],
    light: ['#ecf3ef', '#f8fbf9', '#ffffff', '#eff5f1', '#dfe9e3', '#c8d8ce'],
  },
  {
    id: 'den', vi: 'Đen tuyền', en: 'Black', lightVi: 'Trắng tinh', lightEn: 'Pure white',
    shades: ['#000000', '#070707', '#0c0c0d', '#131315', '#1b1b1e', '#27272b'],
    light: ['#f3f3f4', '#fafafa', '#ffffff', '#f4f4f5', '#e7e7ea', '#d4d4d8'],
  },
]

/** True when the page should be white: chosen, or "auto" on a device set to light. */
export function isLight(mode: ThemeMode): boolean {
  if (mode === 'light') return true
  if (mode === 'dark') return false
  try {
    return window.matchMedia('(prefers-color-scheme: light)').matches
  } catch {
    return false
  }
}

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
        mode: merged.mode === 'light' || merged.mode === 'auto' ? merged.mode : 'dark',
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

// The hand-tuned default violet, same values as index.css.
const DEFAULT_SCALE: Record<string, string> = {
  '50': '#f3f1ff',
  '100': '#e9e5ff',
  '200': '#d5cdff',
  '300': '#b6a8ff',
  '400': '#9a87ff',
  '500': '#7d68fa',
  '600': '#6a50ef',
  '700': '#5940d4',
  '800': '#4834aa',
  '900': '#3b2d86',
  '950': '#241a52',
}

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

  const light = isLight(a.mode)
  if (light) root.dataset.theme = 'light'
  else delete root.dataset.theme

  // The default violet keeps the hand-tuned scale from index.css. On a white
  // page the scale is reversed (300 ↔ 700…), so pale accent text turns dark.
  const isDefault = a.accent === DEFAULT_APPEARANCE.accent
  const scale = isDefault ? DEFAULT_SCALE : accentPalette(accentHex(a.accent))
  const steps = SHADES.map(([step]) => step)
  steps.forEach((step, i) => {
    const value = light ? scale[steps[steps.length - 1 - i]] : scale[step]
    set(`--color-accent-${step}`, !light && isDefault ? null : value)
  })

  const surface = SURFACES.find((s) => s.id === a.surface) ?? SURFACES[0]
  const inks = light ? surface.light : surface.shades
  INK_STEPS.forEach((step, i) => set(`--color-ink-${step}`, !light && surface.id === SURFACES[0].id ? null : inks[i]))

  const radius = RADIUS_SCALE[a.radius]
  for (const [name, rem] of RADII) set(`--radius-${name}`, radius === 1 ? null : `${+(rem * radius).toFixed(3)}rem`)
  set('--radius-scale', radius === 1 ? null : String(radius))

  if (document.body) document.body.style.zoom = ZOOM[a.size]
  if (a.motion) delete root.dataset.motion
  else root.dataset.motion = 'off'

  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', inks[0])
}
