import { useId, useRef } from 'react'
import { primaryButton } from '../../lib/ui'
import { CoffeeIcon, PhoneDownloadIcon } from '../icons'
import { COFFEE_URL, type Lang } from './nav'
import { useInstall } from './useInstall'

const COPY = {
  vi: {
    installTitle: 'Cài app lên điện thoại',
    installSub: 'Mở nhanh từ màn hình chính, dùng cả khi mất mạng.',
    install: 'Cài app',
    howTo: 'Xem cách cài',
    openOnPhone: 'Mở web trên điện thoại để cài',
    iosTitle: 'Thêm vào màn hình chính',
    iosSteps: ['Mở trang này bằng Safari.', 'Bấm nút Chia sẻ (hình vuông có mũi tên lên).', 'Chọn “Thêm vào MH chính”, rồi bấm “Thêm”.'],
    done: 'Đã hiểu',
    coffeeTitle: 'Mời mình ly cà phê',
    coffeeSub: 'Giúp web luôn miễn phí, không quảng cáo.',
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
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3.5">
      <div className="flex items-start gap-3">
        <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-lg bg-sky-400/[0.14] text-sky-300">
          <PhoneDownloadIcon className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm leading-snug font-semibold">{t.installTitle}</span>
          {!compact && <span className="mt-0.5 block text-xs text-pretty text-white/50">{t.installSub}</span>}
        </span>
      </div>
      {canPrompt || ios ? (
        <button
          type="button"
          onClick={() => (canPrompt ? prompt() : dialogRef.current?.showModal())}
          className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-lg bg-white text-sm font-semibold text-ink-950 transition hover:bg-white/90"
        >
          {canPrompt ? t.install : t.howTo}
        </button>
      ) : (
        <p className="mt-2.5 text-[11px] text-white/45">{t.openOnPhone}</p>
      )}
      {ios && (
        <dialog
          ref={dialogRef}
          aria-labelledby={titleId}
          onClick={(e) => {
            if (e.target === e.currentTarget) dialogRef.current?.close()
          }}
          className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-white/10 bg-ink-800/95 p-6 text-left text-white shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)] backdrop:bg-ink-950/70 backdrop:backdrop-blur-sm"
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
      className="group block rounded-2xl border border-amber-300/20 bg-linear-to-b from-amber-300/[0.09] to-amber-300/[0.02] p-3.5 transition hover:border-amber-300/40 focus-visible:ring-2 focus-visible:ring-amber-300/50 focus-visible:outline-none"
    >
      <span className="flex items-start gap-3">
        <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-300/[0.16] text-amber-200 transition group-hover:-rotate-6">
          <CoffeeIcon className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm leading-snug font-semibold">{t.coffeeTitle}</span>
          {!compact && <span className="mt-0.5 block text-xs text-pretty text-white/50">{t.coffeeSub}</span>}
        </span>
      </span>
      <span className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-lg bg-[#fcd34d] text-sm font-semibold text-[#2a1405] transition group-hover:bg-[#fde68a]">
        {t.coffee}
      </span>
    </a>
  )
}

/** "Install app" and "Buy me a coffee": stacked in the sidebar, or side by side under the page on phones. */
export function SupportCards({ lang, layout }: { lang: Lang; layout: 'rail' | 'row' }) {
  if (layout === 'rail') {
    return (
      <div className="space-y-3">
        <CoffeeCard lang={lang} />
        <InstallCard lang={lang} />
      </div>
    )
  }
  return (
    <div className="mt-8 grid w-full max-w-md grid-cols-2 gap-3 sm:max-w-xl [&>:only-child]:col-span-2">
      <InstallCard lang={lang} compact />
      <CoffeeCard lang={lang} compact />
    </div>
  )
}
