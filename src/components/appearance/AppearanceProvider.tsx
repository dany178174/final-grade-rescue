import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ACCENTS,
  accentHex,
  applyAppearance,
  DEFAULT_APPEARANCE,
  loadAppearance,
  saveAppearance,
  SURFACES,
  type Appearance,
  type Radius,
  type SheetStyle,
  type TextSize,
} from '../../lib/appearance'
import { primaryButton, selectableCard, smallButton } from '../../lib/ui'
import { PaletteIcon, ResetIcon } from '../icons'
import { AppearanceContext } from './AppearanceContext'

type Lang = 'en' | 'vi'

const COPY = {
  vi: {
    title: 'Giao diện',
    sub: 'Chọn tới đâu, web đổi tới đó. Chỉ lưu trên máy này.',
    preview: 'Xem trước',
    button: 'Nút chính',
    chip: 'Đang chọn',
    accent: 'Màu nhấn',
    custom: 'Tự chọn màu',
    surface: 'Màu nền',
    sheet: 'Kiểu bảng điểm',
    sheetModern: 'Hiện đại',
    sheetModernSub: 'Màu dịu, hợp nền tối',
    sheetExcel: 'Giống Excel',
    sheetExcelSub: 'Vàng, xanh tươi như file của lớp',
    size: 'Cỡ chữ',
    sizes: { sm: 'Nhỏ', md: 'Vừa', lg: 'Lớn' },
    radius: 'Bo góc',
    radii: { sharp: 'Vuông', normal: 'Vừa', round: 'Tròn' },
    motion: 'Nền chuyển động',
    motionSub: 'Tắt nếu máy chạy chậm hoặc bạn thấy rối mắt.',
    reset: 'Khôi phục mặc định',
    done: 'Xong',
    close: 'Đóng',
  },
  en: {
    title: 'Appearance',
    sub: 'Changes apply as you pick. Saved on this device only.',
    preview: 'Preview',
    button: 'Main button',
    chip: 'Selected',
    accent: 'Accent colour',
    custom: 'Pick any colour',
    surface: 'Background',
    sheet: 'Grade sheet style',
    sheetModern: 'Modern',
    sheetModernSub: 'Soft colours for a dark page',
    sheetExcel: 'Like Excel',
    sheetExcelSub: 'Bright yellow and green',
    size: 'Text size',
    sizes: { sm: 'Small', md: 'Medium', lg: 'Large' },
    radius: 'Corners',
    radii: { sharp: 'Square', normal: 'Medium', round: 'Round' },
    motion: 'Moving background',
    motionSub: 'Turn off on slow devices or if it is distracting.',
    reset: 'Reset to default',
    done: 'Done',
    close: 'Close',
  },
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="mt-6">
      <legend className="mb-2.5 text-xs font-semibold tracking-[0.08em] text-white/50 uppercase">{title}</legend>
      {children}
    </fieldset>
  )
}

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: ReactNode; aria?: string }[]; onChange: (id: T) => void }) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl border border-white/[0.08] bg-ink-900/70 p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          aria-label={o.aria}
          onClick={() => onChange(o.id)}
          className={`flex h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-accent-400/60 focus-visible:outline-none ${
            value === o.id ? 'bg-accent-500 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2)]' : 'text-white/60 hover:text-white'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Panel({ lang, appearance, update, onClose }: { lang: Lang; appearance: Appearance; update: (p: Partial<Appearance>) => void; onClose: () => void }) {
  const t = COPY[lang]
  const custom = !ACCENTS.some((a) => a.id === appearance.accent)
  const swatchRing = (on: boolean) => (on ? 'ring-2 ring-white ring-offset-2 ring-offset-ink-800' : 'ring-1 ring-white/15 hover:ring-white/40')

  return (
    <div className="max-h-[85dvh] overflow-y-auto overscroll-contain p-5 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span aria-hidden className="grid size-10 place-items-center rounded-xl bg-accent-500/15 text-accent-300">
            <PaletteIcon className="size-5" />
          </span>
          <div>
            <h2 id="appearance-title" className="text-lg font-semibold tracking-tight">
              {t.title}
            </h2>
            <p className="text-xs text-white/50">{t.sub}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label={t.close} className="grid size-9 shrink-0 place-items-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white">
          ✕
        </button>
      </div>

      <div aria-label={t.preview} className="mt-5 flex flex-wrap items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-ink-900/70 p-3.5">
        <span className={`${primaryButton} pointer-events-none h-10 px-4`}>{t.button}</span>
        <span className={`${selectableCard(true)} pointer-events-none px-3 py-2 text-xs font-semibold`}>{t.chip}</span>
        <span className="h-2 min-w-16 flex-1 overflow-hidden rounded-full bg-white/10">
          <span className="block h-full w-2/3 rounded-full bg-accent-400" />
        </span>
      </div>

      <Section title={t.accent}>
        <div className="flex flex-wrap gap-3">
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              type="button"
              aria-pressed={appearance.accent === a.id}
              aria-label={lang === 'vi' ? a.vi : a.en}
              title={lang === 'vi' ? a.vi : a.en}
              onClick={() => update({ accent: a.id })}
              style={{ backgroundColor: a.hex }}
              className={`grid size-10 place-items-center rounded-full text-sm font-bold text-white transition ${swatchRing(appearance.accent === a.id)}`}
            >
              {appearance.accent === a.id && '✓'}
            </button>
          ))}
          <span
            title={t.custom}
            className={`relative grid size-10 place-items-center rounded-full text-sm font-bold text-white transition ${swatchRing(custom)}`}
            style={{ background: custom ? accentHex(appearance.accent) : 'conic-gradient(from 0deg, #f43f5e, #f59e0b, #84cc16, #14b8a6, #3b82f6, #8b5cf6, #f43f5e)' }}
          >
            {custom ? '✓' : '+'}
            <input
              type="color"
              aria-label={t.custom}
              value={accentHex(appearance.accent)}
              onChange={(e) => update({ accent: e.target.value })}
              className="absolute inset-0 size-full cursor-pointer rounded-full opacity-0"
            />
          </span>
        </div>
      </Section>

      <Section title={t.surface}>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {SURFACES.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={appearance.surface === s.id}
              onClick={() => update({ surface: s.id })}
              className={`${selectableCard(appearance.surface === s.id)} p-1.5 text-center`}
            >
              <span aria-hidden className="flex h-10 overflow-hidden rounded-lg border border-white/10" style={{ backgroundColor: s.shades[0] }}>
                <span className="w-1/3" style={{ backgroundColor: s.shades[1] }} />
                <span className="m-1.5 flex-1 rounded-md" style={{ backgroundColor: s.shades[3] }} />
              </span>
              <span className="mt-1.5 block text-[11px] font-semibold text-white/80">{lang === 'vi' ? s.vi : s.en}</span>
            </button>
          ))}
        </div>
      </Section>

      {lang === 'vi' && (
        <Section title={t.sheet}>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { id: 'modern', label: t.sheetModern, sub: t.sheetModernSub, cells: ['border-amber-300/45 bg-amber-300/[0.15] text-amber-50', 'border-dashed border-emerald-300/60 bg-emerald-400/[0.13] text-emerald-50'] },
                { id: 'excel', label: t.sheetExcel, sub: t.sheetExcelSub, cells: ['border-[#c9b800] bg-[#fff04d] text-[#1f1a00]', 'border-[#8fbf7a] bg-[#cfe8c0] text-[#10260b]'] },
              ] as { id: SheetStyle; label: string; sub: string; cells: string[] }[]
            ).map((o) => (
              <button
                key={o.id}
                type="button"
                aria-pressed={appearance.sheet === o.id}
                onClick={() => update({ sheet: o.id })}
                className={`${selectableCard(appearance.sheet === o.id)} p-3`}
              >
                <span aria-hidden className="flex gap-1">
                  {['9', '8,5', '10'].map((v, i) => (
                    <span key={v} className={`grid h-7 flex-1 place-items-center rounded-md border text-xs font-semibold tabular-nums ${o.cells[i === 1 ? 1 : 0]}`}>
                      {v}
                    </span>
                  ))}
                </span>
                <span className="mt-2 block text-sm font-semibold">{o.label}</span>
                <span className="block text-[11px] text-white/50">{o.sub}</span>
              </button>
            ))}
          </div>
        </Section>
      )}

      <div className="grid gap-x-4 sm:grid-cols-2">
        <Section title={t.size}>
          <Segmented<TextSize>
            value={appearance.size}
            onChange={(size) => update({ size })}
            options={[
              { id: 'sm', label: <span className="text-xs">A</span>, aria: t.sizes.sm },
              { id: 'md', label: <span className="text-sm">A</span>, aria: t.sizes.md },
              { id: 'lg', label: <span className="text-lg">A</span>, aria: t.sizes.lg },
            ]}
          />
        </Section>
        <Section title={t.radius}>
          <Segmented<Radius>
            value={appearance.radius}
            onChange={(radius) => update({ radius })}
            options={(['sharp', 'normal', 'round'] as Radius[]).map((id) => ({
              id,
              aria: t.radii[id],
              label: <span aria-hidden className={`size-4 border-2 border-current border-r-0 border-b-0 ${id === 'sharp' ? 'rounded-none' : id === 'normal' ? 'rounded-tl-[5px]' : 'rounded-tl-[10px]'}`} />,
            }))}
          />
        </Section>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5">
        <span>
          <span id="motion-label" className="block text-sm font-semibold">
            {t.motion}
          </span>
          <span className="block text-xs text-white/50">{t.motionSub}</span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={appearance.motion}
          aria-labelledby="motion-label"
          onClick={() => update({ motion: !appearance.motion })}
          className={`relative h-7 w-12 shrink-0 rounded-full transition ${appearance.motion ? 'bg-accent-500' : 'bg-white/15'}`}
        >
          <span className={`absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform ${appearance.motion ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-5">
        <button type="button" onClick={() => update(DEFAULT_APPEARANCE)} className={`${smallButton} h-10 px-3.5 text-sm`}>
          <ResetIcon className="size-4" />
          {t.reset}
        </button>
        <button type="button" onClick={onClose} className={`${primaryButton} h-10 px-6`}>
          {t.done}
        </button>
      </div>
    </div>
  )
}

export function AppearanceProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const [appearance, setAppearance] = useState<Appearance>(loadAppearance)
  const [isOpen, setIsOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    applyAppearance(appearance)
    saveAppearance(appearance)
  }, [appearance])

  const update = useCallback((patch: Partial<Appearance>) => setAppearance((prev) => ({ ...prev, ...patch })), [])
  const open = useCallback(() => {
    setIsOpen(true)
    dialogRef.current?.showModal()
  }, [])
  const close = useCallback(() => dialogRef.current?.close(), [])
  const value = useMemo(() => ({ appearance, update, open }), [appearance, update, open])

  return (
    <AppearanceContext.Provider value={value}>
      {children}
      <dialog
        ref={dialogRef}
        aria-labelledby="appearance-title"
        onClose={() => setIsOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) close()
        }}
        className="mx-auto mt-auto mb-0 w-full max-w-lg rounded-t-3xl border border-b-0 border-white/10 bg-ink-800/95 p-0 text-white shadow-[0_-20px_60px_-20px_rgb(0_0_0/0.8)] backdrop-blur-xl backdrop:bg-ink-950/30 sm:m-auto sm:w-[calc(100%-2rem)] sm:rounded-3xl sm:border-b"
      >
        {isOpen && <Panel lang={lang} appearance={appearance} update={update} onClose={close} />}
      </dialog>
    </AppearanceContext.Provider>
  )
}
