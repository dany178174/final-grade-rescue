import { useAppearance } from '../appearance/AppearanceContext'
import { LanguagesIcon, LifebuoyIcon, PaletteIcon } from '../icons'
import { SupportCards } from './SupportCards'
import { NAV, type Lang } from './nav'

/** Full-height sidebar on wide screens: brand, tools, then install / coffee at the bottom. */
export function SideNav({ lang, path }: { lang: Lang; path: string }) {
  const vi = lang === 'vi'
  const { open } = useAppearance()
  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 py-6">
      <a
        href={vi ? '#/vn' : '#/'}
        className="flex items-center gap-3 rounded-xl px-2 py-1 focus-visible:ring-2 focus-visible:ring-accent-400/50 focus-visible:outline-none"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-500 shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_8px_22px_-8px_color-mix(in_oklab,var(--color-accent-500)_90%,transparent)]">
          <LifebuoyIcon className="size-5 text-white" />
        </span>
        <span className="min-w-0">
          <span className="block text-[15px] leading-tight font-semibold tracking-tight">{vi ? 'Cứu Điểm' : 'Grade Rescue'}</span>
          <span className="block text-[11px] text-white/45">{vi ? 'Thang điểm 10 · Thông tư 22' : 'Final grade calculator'}</span>
        </span>
      </a>

      <nav aria-label={vi ? 'Chức năng chính' : 'Main'} className="mt-8">
        <p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.12em] text-white/35 uppercase">{vi ? 'Công cụ' : 'Tools'}</p>
        <ul className="space-y-1">
          {NAV[lang].map((item) => {
            const active = item.match(path)
            const Icon = item.icon
            return (
              <li key={item.href}>
                <a
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition focus-visible:ring-2 focus-visible:ring-accent-400/50 focus-visible:outline-none ${
                    active ? 'bg-white/[0.07] text-white' : 'text-white/65 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  {active && <span aria-hidden className="absolute inset-y-2.5 -left-4 w-1 rounded-r-full bg-accent-400" />}
                  <Icon className={`size-5 shrink-0 transition ${active ? 'text-accent-300' : 'text-white/40 group-hover:text-white/70'}`} />
                  <span className="min-w-0">
                    <span className="block text-sm leading-snug font-medium">{item.label}</span>
                    <span className="block truncate text-[11px] text-white/40">{item.sub}</span>
                  </span>
                </a>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="mt-auto space-y-3 pt-8">
        <SupportCards lang={lang} layout="rail" />
        <button
          type="button"
          onClick={open}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-white/60 transition hover:bg-white/[0.04] hover:text-white/90 focus-visible:ring-2 focus-visible:ring-accent-400/50 focus-visible:outline-none"
        >
          <PaletteIcon className="size-4" />
          {vi ? 'Giao diện: màu, cỡ chữ…' : 'Appearance: colours, text size…'}
        </button>
        {vi && (
          <a
            href="#/"
            lang="en"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-white/50 transition hover:bg-white/[0.04] hover:text-white/80"
          >
            <LanguagesIcon className="size-4" />
            US grading (English)
          </a>
        )}
      </div>
    </div>
  )
}

/** Brand and the appearance button above the page on phones and tablets. */
export function MobileTopBar({ lang }: { lang: Lang }) {
  const vi = lang === 'vi'
  const { open } = useAppearance()
  return (
    <div className="mx-auto mb-4 flex max-w-5xl items-center justify-between xl:hidden">
      <a href={vi ? '#/vn' : '#/'} className="flex items-center gap-2.5 rounded-xl py-1 pr-2 focus-visible:ring-2 focus-visible:ring-accent-400/50 focus-visible:outline-none">
        <span className="grid size-8 place-items-center rounded-lg bg-accent-500 shadow-[inset_0_1px_0_rgb(255_255_255/0.25)]">
          <LifebuoyIcon className="size-4 text-white" />
        </span>
        <span className="text-sm font-semibold tracking-tight">{vi ? 'Cứu Điểm' : 'Grade Rescue'}</span>
      </a>
      <button
        type="button"
        onClick={open}
        aria-label={vi ? 'Giao diện: đổi màu, cỡ chữ' : 'Appearance: colours and text size'}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-white/75 transition hover:bg-white/[0.08] hover:text-white"
      >
        <PaletteIcon className="size-4 text-accent-300" />
        {vi ? 'Giao diện' : 'Theme'}
      </button>
    </div>
  )
}

/** App-style tab bar fixed to the bottom on phones and tablets. */
export function TabBar({ lang, path }: { lang: Lang; path: string }) {
  const items = NAV[lang]
  return (
    <nav
      aria-label={lang === 'vi' ? 'Chức năng chính' : 'Main'}
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-lg rounded-2xl border border-white/10 bg-ink-900/85 p-1.5 shadow-[0_18px_50px_-12px_rgb(0_0_0/0.85)] backdrop-blur-xl xl:hidden"
    >
      <ul className={`grid gap-1 ${items.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
        {items.map((item) => {
          const active = item.match(path)
          const Icon = item.icon
          return (
            <li key={item.href}>
              <a
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold transition ${
                  active ? 'bg-accent-500/[0.16] text-accent-100' : 'text-white/55 hover:text-white'
                }`}
              >
                <Icon className={`size-[1.35rem] ${active ? 'text-accent-300' : ''}`} />
                <span className="truncate">{item.short}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
