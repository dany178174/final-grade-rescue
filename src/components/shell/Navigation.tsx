import { LifebuoyIcon } from '../icons'
import { NAV, type Lang } from './nav'

/** Left rail on wide screens. */
export function SideNav({ lang, path }: { lang: Lang; path: string }) {
  return (
    <nav aria-label={lang === 'vi' ? 'Chức năng chính' : 'Main'} className="glass-card p-4">
      <a href={lang === 'vi' ? '#/vn' : '#/'} className="mb-4 flex items-center gap-2.5 px-1">
        <span className="grid size-9 place-items-center rounded-xl border border-white/15 bg-linear-to-br from-blue-500/40 via-purple-500/30 to-pink-500/40">
          <LifebuoyIcon className="size-5 text-white" />
        </span>
        <span className="text-sm leading-tight font-semibold">{lang === 'vi' ? 'Cứu Điểm' : 'Grade Rescue'}</span>
      </a>
      <ul className="space-y-1.5">
        {NAV[lang].map((item) => {
          const active = item.match(path)
          return (
            <li key={item.href}>
              <a
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-2xl px-2.5 py-2.5 transition focus-visible:ring-2 focus-visible:ring-fuchsia-400/50 focus-visible:outline-none ${
                  active ? 'bg-white/[0.12] shadow-[inset_0_0_0_1px_rgb(240_171_252/0.35)]' : 'hover:bg-white/[0.07]'
                }`}
              >
                <span
                  aria-hidden
                  className={`grid size-9 shrink-0 place-items-center rounded-xl text-lg ${
                    active ? 'bg-linear-to-br from-blue-500 via-purple-500 to-pink-500' : 'bg-white/[0.08]'
                  }`}
                >
                  {item.emoji}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm leading-snug font-semibold">{item.label}</span>
                  <span className="block truncate text-[11px] text-white/50">{item.sub}</span>
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** App-style tab bar fixed to the bottom on phones and tablets. */
export function TabBar({ lang, path }: { lang: Lang; path: string }) {
  const items = NAV[lang]
  return (
    <nav
      aria-label={lang === 'vi' ? 'Chức năng chính' : 'Main'}
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-lg rounded-3xl border border-white/15 bg-[#0d0f2b]/80 p-1.5 shadow-[0_18px_50px_-12px_rgb(0_0_0/0.8)] backdrop-blur-xl xl:hidden"
    >
      <ul className={`grid gap-1 ${items.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
        {items.map((item) => {
          const active = item.match(path)
          return (
            <li key={item.href}>
              <a
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-[11px] font-semibold transition ${
                  active ? 'bg-linear-to-br from-blue-500/35 via-purple-500/30 to-pink-500/35 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                <span aria-hidden className="text-xl leading-none">
                  {item.emoji}
                </span>
                <span className="truncate">{item.short}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
