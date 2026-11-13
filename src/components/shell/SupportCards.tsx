import { useId, useRef } from 'react'
import { primaryButton } from '../../lib/ui'
import { COFFEE_URL, type Lang } from './nav'
import { useInstall } from './useInstall'

const COPY = {
  vi: {
    installTitle: 'Cài app lên điện thoại',
    installSub: 'Mở nhanh từ màn hình chính, dùng được cả khi mất mạng.',
    install: 'Cài app',
    howTo: 'Xem cách cài',
    openOnPhone: 'Mở web trên điện thoại để cài',
    iosTitle: 'Thêm vào màn hình chính',
    iosSteps: ['Mở trang này bằng Safari.', 'Bấm nút Chia sẻ (hình vuông có mũi tên lên).', 'Chọn “Thêm vào MH chính”, rồi bấm “Thêm”.'],
    done: 'Đã hiểu',
    coffeeTitle: 'Mời mình ly cà phê',
    coffeeSub: 'Giúp web luôn miễn phí, không quảng cáo cho mọi học sinh.',
    coffee: 'Ủng hộ từ 1$',
  },
  en: {
    installTitle: 'Get the app',
    installSub: 'Open it from your home screen, even offline.',
    install: 'Install app',
    howTo: 'How to install',
    openOnPhone: 'Open this site on your phone to install',
    iosTitle: 'Add to your Home Screen',
    iosSteps: ['Open this page in Safari.', 'Tap the Share button (the square with an arrow).', 'Choose “Add to Home Screen”, then “Add”.'],
    done: 'Got it',
    coffeeTitle: 'Buy me a coffee',
    coffeeSub: 'Keeps this free and ad-free for every student.',
    coffee: 'Support from $1',
  },
}

function InstallCard({ lang, compact }: { lang: Lang; compact?: boolean }) {
  const t = COPY[lang]
  const { canPrompt, ios, installed, prompt } = useInstall()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  if (installed) return null

  return (
    <div className="relative overflow-hidden rounded-3xl border border-sky-300/30 bg-linear-to-br from-sky-500/25 via-indigo-500/20 to-purple-500/25 p-4 shadow-[0_18px_40px_-18px_rgb(56_189_248/0.6)]">
      <p aria-hidden className={compact ? 'text-2xl' : 'text-3xl'}>
        📲
      </p>
      <p className="mt-1.5 font-semibold leading-snug">{t.installTitle}</p>
      {!compact && <p className="mt-1 text-xs text-pretty text-white/65">{t.installSub}</p>}
      {canPrompt || ios ? (
        <button
          type="button"
          onClick={() => (canPrompt ? prompt() : dialogRef.current?.showModal())}
          className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-xl bg-white text-sm font-semibold text-[#0b0c24] transition hover:bg-white/90"
        >
          {canPrompt ? t.install : t.howTo}
        </button>
      ) : (
        <p className="mt-2 text-[11px] text-white/55">{t.openOnPhone}</p>
      )}
      {ios && (
        <dialog
          ref={dialogRef}
          aria-labelledby={titleId}
          onClick={(e) => {
            if (e.target === e.currentTarget) dialogRef.current?.close()
          }}
          className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-3xl border border-white/15 bg-[#12142e]/95 p-6 text-left text-white shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)] backdrop:bg-[#05061a]/70 backdrop:backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <img src="/apple-touch-icon.png" alt="" className="size-12 rounded-xl" />
            <h2 id={titleId} className="text-lg font-semibold">
              {t.iosTitle}
            </h2>
          </div>
          <ol className="mt-4 space-y-2.5 text-sm text-white/80">
            {t.iosSteps.map((step, i) => (
              <li key={step} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-semibold">{i + 1}</span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
          <button type="button" onClick={() => dialogRef.current?.close()} className={`${primaryButton} mt-6 w-full`}>
            {t.done}
          </button>
        </dialog>
      )}
    </div>
  )
}

function CoffeeCard({ lang, compact }: { lang: Lang; compact?: boolean }) {
  const t = COPY[lang]
  return (
    <a
      href={COFFEE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-3xl border border-amber-300/35 bg-linear-to-br from-amber-500/30 via-orange-500/20 to-pink-500/30 p-4 shadow-[0_18px_40px_-18px_rgb(251_146_60/0.6)] transition hover:border-amber-200/60"
    >
      <p aria-hidden className={`${compact ? 'text-2xl' : 'text-3xl'} transition group-hover:scale-110`}>
        ☕
      </p>
      <p className="mt-1.5 font-semibold leading-snug">{t.coffeeTitle}</p>
      {!compact && <p className="mt-1 text-xs text-pretty text-white/65">{t.coffeeSub}</p>}
      <span className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-xl bg-amber-300 text-sm font-semibold text-[#2a1405] transition group-hover:bg-amber-200">
        {t.coffee}
      </span>
    </a>
  )
}

/** "Install app" and "Buy me a coffee", stacked in the right rail or side by side on phones. */
export function SupportCards({ lang, layout }: { lang: Lang; layout: 'rail' | 'row' }) {
  if (layout === 'rail') {
    return (
      <div className="space-y-4">
        <InstallCard lang={lang} />
        <CoffeeCard lang={lang} />
      </div>
    )
  }
  return (
    <div className="mt-6 grid w-full max-w-md grid-cols-2 gap-3 sm:max-w-xl [&>:only-child]:col-span-2">
      <InstallCard lang={lang} compact />
      <CoffeeCard lang={lang} compact />
    </div>
  )
}
